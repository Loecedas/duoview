import type { APIRoute } from 'astro';
import type { CacheEntry, UserData } from '../../types';
import { transformDuolingoData } from '../../services/duolingoService';
import { getEnv, jsonResponse } from '../../utils/api-helpers';

export const prerender = false;

const DUOLINGO_BASE_URL = 'https://www.duolingo.com';
const CACHE_TTL = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

const cache = new Map<string, CacheEntry<UserData>>();

async function fetchWithTimeout(url: string, headers: HeadersInit, timeoutMs = 8000): Promise<{ data: any; status: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return { data: null, status: res.status };
        return { data: await res.json(), status: res.status };
    } catch {
        clearTimeout(timeoutId);
        return { data: null, status: 0 };
    }
}

// Validate username: only allow alphanumeric, underscores, hyphens, dots
function isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_\-.]{1,64}$/.test(username);
}

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username')?.trim();
    const userTimezone = url.searchParams.get('tz')?.trim() || request.headers.get('x-user-timezone')?.trim() || undefined;

    if (!username) {
        return jsonResponse({ error: '请提供用户名' }, 400);
    }

    if (!isValidUsername(username)) {
        return jsonResponse({ error: '用户名格式无效' }, 400);
    }

    const jwt = getEnv('DUOLINGO_JWT', locals);

    const cacheKey = `user:${username.toLowerCase()}:tz:${userTimezone || 'default'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return jsonResponse({ data: cached.data, cached: true }, 200, { cacheControl: 'public, max-age=300' });
    }

    try {
        // 使用完整的浏览器 headers 模拟真实的 Chrome 请求
        // 注意：不添加 Authorization header，Duolingo WAF 会拦截带 JWT 的服务端请求（返回 500 HTML）
        // 公开账号无需认证即可访问 V2 API
        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.duolingo.com/',
            'Origin': 'https://www.duolingo.com',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        };

        // 1. 取长补短 - 第一阶段：优先利用 2023 接口获取新版数据，2017 接口并发预取与容灾
        // 2023 优势：支持多学科（数学/音乐/象棋）、全新 Learning Path 数据结构与现代字段
        // 2017 优势：老用户历史数据兼容性高，具备王冠与旧版结构，且可作为主备容灾兜底
        const encodedUser = encodeURIComponent(username);
        const [v2Result, v17Result] = await Promise.all([
            fetchWithTimeout(`${DUOLINGO_BASE_URL}/2023-05-23/users?username=${encodedUser}`, headers, 7000),
            fetchWithTimeout(`${DUOLINGO_BASE_URL}/2017-06-30/users?username=${encodedUser}`, headers, 5000),
        ]);

        if (v2Result.status === 401 || v2Result.status === 403 || v17Result.status === 401 || v17Result.status === 403) {
            return jsonResponse({ error: '该账号设置为私密，无法访问', code: 'PRIVATE_ACCOUNT' }, 403);
        }

        const v2Raw = v2Result.data as { users?: any[] } | any;
        const v2User = v2Raw?.users?.[0] || v2Raw;

        const v17Raw = v17Result.data as { users?: any[] } | any;
        const v17User = v17Raw?.users?.[0] || v17Raw;

        if (!v2User && !v17User) {
            return jsonResponse({ error: '找不到该用户，请检查用户名是否正确' }, 404);
        }

        // 基础数据深度融合：以 2023 为主（新版现代化模型），2017 补齐历史缺漏字段
        let userData: any = {
            ...(v17User || {}),
            ...(v2User || {}),
            tracking_properties: {
                ...(v17User?.tracking_properties || v17User?.trackingProperties || {}),
                ...(v2User?.tracking_properties || v2User?.trackingProperties || {}),
            }
        };

        const userId = userData.id || userData.user_id;

        // 2. 取长补短 - 第二阶段：利用 2023 模块化微端点与 2017 字段投影获取总经验与总时长
        // 在 2023 和 2017 接口 URL 后通过 ?fields= 显式声明拉取 totalXp, totalTime, timeSpent, totalSessionTime 等全量字段
        if (userId && jwt) {
            const authHeaders: HeadersInit = { ...headers, 'Authorization': `Bearer ${jwt}` };
            
            const extendedFields = [
                'courses', 'currentCourse', 'fromLanguage', 'learningLanguage',
                'trackingProperties', 'totalXp', 'total_xp', 'totalTime',
                'timeSpent', 'totalSessionTime', 'totalTimeSpent',
                'streak', 'streakData', 'streakExtendedToday', 'creationDate',
                'hasPlus', 'hasSuper', 'xpGains', 'weeklyXp',
                'numSessionsCompleted', 'streakFreezeCount'
            ].join(',');

            const [amebaResult, fields17Result, xpResult, lbResult] = await Promise.all([
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2023-05-23/users/${userId}?fields=${extendedFields}`,
                    authHeaders, 7000
                ),
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2017-06-30/users/${userId}?fields=gems,lingots,trackingProperties,totalXp,total_xp,totalTime,totalSessionTime,timeSpent`,
                    authHeaders, 7000
                ),
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2023-05-23/users/${userId}/xp_summaries?startDate=1970-01-01`,
                    authHeaders, 7000
                ),
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2023-05-23/users/${userId}/leaderboards?active=true`,
                    authHeaders, 7000
                )
            ]);

            if (amebaResult.data) {
                userData._amebaData = amebaResult.data;
                if (typeof amebaResult.data.totalXp === 'number') {
                    userData.totalXp = Math.max(userData.totalXp || 0, amebaResult.data.totalXp);
                }
                if (typeof amebaResult.data.totalTime === 'number') {
                    userData.totalTime = amebaResult.data.totalTime;
                }
                if (typeof amebaResult.data.timeSpent === 'number') {
                    userData.timeSpent = amebaResult.data.timeSpent;
                }
                if (amebaResult.data.courses?.length > 0) {
                    userData.courses = [...(userData.courses || []), ...amebaResult.data.courses];
                }
            }

            if (fields17Result.data) {
                userData._fields17Data = fields17Result.data;
                if (typeof fields17Result.data.totalXp === 'number') {
                    userData.totalXp = Math.max(userData.totalXp || 0, fields17Result.data.totalXp);
                }
                if (typeof fields17Result.data.total_xp === 'number') {
                    userData.totalXp = Math.max(userData.totalXp || 0, fields17Result.data.total_xp);
                }
                if (typeof fields17Result.data.totalSessionTime === 'number') {
                    userData.totalSessionTime = fields17Result.data.totalSessionTime;
                }
            }

            if (xpResult.data?.summaries) {
                userData._xpSummaries = xpResult.data.summaries;
            }
            
            if (lbResult.data) {
                userData._leaderboardHistory = lbResult.data;
            }
        }

        if (!userData || typeof userData !== 'object') {
            return jsonResponse({ error: '数据格式异常' }, 502);
        }

        const transformed = transformDuolingoData(userData, userTimezone);

        if (cache.size >= MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(cacheKey, { data: transformed, timestamp: Date.now() });

        return jsonResponse({ data: transformed }, 200, { cacheControl: 'public, max-age=300' });
    } catch (err: any) {
        return jsonResponse({ error: '获取数据时出错：' + (err?.message || '未知错误') }, 500);
    }
};
