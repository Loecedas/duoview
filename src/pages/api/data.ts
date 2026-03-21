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

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username')?.trim();

    if (!username) {
        return jsonResponse({ error: '请提供用户名' }, 400);
    }

    if (!isValidUsername(username)) {
        return jsonResponse({ error: '用户名格式无效' }, 400);
    }

    const jwt = getEnv('DUOLINGO_JWT');

    const cacheKey = `user:${username.toLowerCase()}`;
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

        // 并行获取所有用户数据接口（原串行 ~26s → 并行 ~10s）
        const [v2Result, v1Result, api1Result] = await Promise.all([
            fetchWithTimeout(
                `${DUOLINGO_BASE_URL}/2017-06-30/users?username=${encodeURIComponent(username)}`,
                headers, 10000
            ),
            fetchWithTimeout(
                `${DUOLINGO_BASE_URL}/users/${encodeURIComponent(username)}`,
                headers, 8000
            ),
            fetchWithTimeout(
                `${DUOLINGO_BASE_URL}/api/1/users/show?username=${encodeURIComponent(username)}`,
                headers, 8000
            ),
        ]);

        // 若 V2 返回 401/403，说明账号设置为私密或访问受限
        if (v2Result.status === 401 || v2Result.status === 403) {
            return jsonResponse({ error: '该账号设置为私密，无法访问', code: 'PRIVATE_ACCOUNT' }, 403);
        }

        const v2Raw = v2Result.data as { users?: any[] } | any;
        const v2Data = v2Raw?.users?.[0] || v2Raw;
        const v1Data = v1Result.data as any;
        const api1Data = api1Result.data as any;

        if (!v2Data && !v1Data && !api1Data) {
            return jsonResponse({ error: '找不到该用户，请检查用户名是否正确' }, 404);
        }

        // Deep merge: V2 takes priority, then api1, then V1
        const userData = {
            ...(v1Data || {}),
            ...(api1Data || {}),
            ...(v2Data || {}),
            tracking_properties: {
                ...(v1Data?.tracking_properties || v1Data?.trackingProperties || {}),
                ...(api1Data?.tracking_properties || api1Data?.trackingProperties || {}),
                ...(v2Data?.tracking_properties || v2Data?.trackingProperties || {})
            }
        } as any;

        const userId = userData.id || userData.user_id || userData.tracking_properties?.user_id;

        if (userId && jwt) {
            // 并行获取 xp 摘要和排行榜数据
            // xp_summaries 端点需要认证，使用 JWT 单独请求
            const authHeaders: HeadersInit = { ...headers, 'Authorization': `Bearer ${jwt}` };
            const [xpResult, lbResult] = await Promise.all([
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2017-06-30/users/${userId}/xp_summaries?startDate=1970-01-01`,
                    authHeaders, 12000
                ),
                fetchWithTimeout(
                    `${DUOLINGO_BASE_URL}/2017-06-30/users/${userId}/leaderboards?active=true`,
                    authHeaders, 10000
                ),
            ]);
            const xpData = xpResult.data as any;
            if (xpData?.summaries) userData._xpSummaries = xpData.summaries;
            if (lbResult.data) userData._leaderboardHistory = lbResult.data;
        }

        if (!userData || typeof userData !== 'object') {
            return jsonResponse({ error: '数据格式异常' }, 502);
        }

        const transformed = transformDuolingoData(userData);

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
