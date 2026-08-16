import type { UserData, DuolingoRawUser, Course } from "../types";

const LEAGUE_TIERS = [
  "青铜", "白银", "黄金", "蓝宝石", "红宝石",
  "祖母绿", "紫水晶", "珍珠", "黑曜石", "钻石"
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;
function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const SUBJECT_MAP: Record<string, string> = {
  "chess": "国际象棋",
  "math": "数学",
  "music": "音乐"
};

export const LANGUAGE_MAP: Record<string, string> = {
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'zh': '中文',
  'zh-CN': '中文',
  'zh-HK': '粤语',
  'es': '西班牙语',
  'fr': '法语',
  'de': '德语',
  'it': '意大利语',
  'ru': '俄语',
  'pt': '葡萄牙语',
  'tr': '土耳其语',
  'vi': '越南语',
  'th': '泰语',
  'ar': '阿拉伯语',
};

/**
 * 格式化课程标题为中文
 */
function formatCourseTitle(title: string, langCode?: string, subject?: string): string {
  if (subject && SUBJECT_MAP[subject]) return SUBJECT_MAP[subject];
  if (langCode && LANGUAGE_MAP[langCode]) return LANGUAGE_MAP[langCode];
  
  const lowerTitle = (title || "").toLowerCase();
  if (lowerTitle.includes('english')) return '英语';
  if (lowerTitle.includes('chinese') && lowerTitle.includes('cantonese')) return '粤语';
  if (lowerTitle.includes('chinese')) return '中文';
  if (lowerTitle.includes('japanese')) return '日语';
  if (lowerTitle.includes('korean')) return '韩语';
  if (lowerTitle.includes('spanish')) return '西班牙语';
  if (lowerTitle.includes('french')) return '法语';
  if (lowerTitle.includes('german')) return '德语';
  
  return title;
}

function normalizeUnixTs(ts: number): number {
  return ts < 10000000000 ? ts * 1000 : ts;
}

// 日期格式化器缓存，按时区缓存以避免重复创建
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone
    });
    if (dateFormatterCache.size > 50) {
      const firstKey = dateFormatterCache.keys().next().value;
      if (firstKey) dateFormatterCache.delete(firstKey);
    }
    dateFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

// 日期解析缓存，减少重复的 Date 解析开销
const dateParseCache = new Map<string, number>();

function getCachedDateTimestamp(dateStr: string): number {
  let ts = dateParseCache.get(dateStr);
  if (ts === undefined) {
    ts = new Date(dateStr).getTime();
    // 限制缓存大小，防止内存泄漏
    if (dateParseCache.size > 1000) {
      const firstKey = dateParseCache.keys().next().value;
      if (firstKey) dateParseCache.delete(firstKey);
    }
    dateParseCache.set(dateStr, ts);
  }
  return ts;
}

function normalizeTimezone(timeZone?: string): string {
  if (timeZone) {
    try {
      Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
      return timeZone;
    } catch {
      // 忽略非法时区
    }
  }
  return getSystemTimezone();
}

/**
 * 将 Date 对象转换为 YYYY-MM-DD 格式的本地日期键
 */
function toLocalDateKey(date: Date, timeZone?: string): string {
  const tz = normalizeTimezone(timeZone);
  try {
    return getDateFormatter(tz).format(date);
  } catch {
    // 降级方案：如果格式化失败，回退到 Date 对象的本地时间
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * 获取指定时区的当天开始时间戳（毫秒）
 * 使用与 toLocalDateKey 相同的时区，确保一致性
 */
function getStartOfDayInTimezone(date: Date, timeZone?: string): number {
  const tz = normalizeTimezone(timeZone);
  const dateKey = toLocalDateKey(date, tz);
  // 构造该时区的午夜时间
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
  // 解析偏移量，如 "GMT+8", "GMT+05:30", "GMT-5", "GMT"
  const offsetMatch = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  let offset = '+00:00';
  if (offsetMatch) {
    const sign = offsetMatch[1];
    const hours = offsetMatch[2].padStart(2, '0');
    const minutes = offsetMatch[3] || '00';
    offset = `${sign}${hours}:${minutes}`;
  }
  return new Date(`${dateKey}T00:00:00${offset}`).getTime();
}

/**
 * 将 xpSummary 的日期字段解析为日期键
 * 统一处理数字时间戳和字符串日期格式
 * 返回 null 表示无效日期
 */
function parseSummaryDateKey(date: number | string, timeZone?: string): string | null {
  const tz = normalizeTimezone(timeZone);
  if (typeof date === 'number') {
    const d = new Date(normalizeUnixTs(date));
    if (isNaN(d.getTime())) return null;
    return toLocalDateKey(d, tz);
  }
  const utcDate = new Date(String(date).replace(/\//g, '-') + 'T00:00:00Z');
  if (isNaN(utcDate.getTime())) return null;
  return toLocalDateKey(utcDate, tz);
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取指定日期所在自然周的周一（一周的第一天）
 */
function getMonday(date: Date, timeZone?: string): Date {
  const tz = normalizeTimezone(timeZone);
  // 获取该时区下的日期信息
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    timeZone: tz
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');

  // 创建本地日期对象
  const localDate = new Date(year, month, day);
  const dayOfWeek = localDate.getDay(); // 0 = 周日，1 = 周一，..., 6 = 周六

  // 计算到周一的偏移量（周日需要回退 6 天，其他天回退 dayOfWeek - 1 天）
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function calcDaysSince(createdAt: Date, timeZone?: string): number {
  const tz = normalizeTimezone(timeZone);
  const diffMs = getStartOfDayInTimezone(new Date(), tz) - getStartOfDayInTimezone(createdAt, tz);
  return Math.max(0, Math.floor(diffMs / MS_PER_DAY));
}

function resolveTierIndex(rawAny: any, rawData: DuolingoRawUser): number {
  // 1. 直接字段检测
  if (rawAny.tier !== undefined && rawAny.tier >= 0) return rawAny.tier;

  // 2. 深度合并后的 tracking_properties
  const tp = rawData.tracking_properties || rawData.trackingProperties || (rawData as any).tracking_properties;
  if (tp?.league_tier !== undefined) return tp.league_tier;
  if (tp?.leaderboard_league !== undefined) return tp.leaderboard_league;

  // 3. 从排行榜历史中提取 (V2 API 结果)
  const lbHistory = (rawData as any)._leaderboardHistory;
  if (lbHistory?.rankings?.length) {
    const activeLb = lbHistory.rankings[0];
    if (activeLb?.tier !== undefined) return activeLb.tier;
  }

  // 4. 从课程语言数据中提取 (V1 API 结果)
  if (rawData.language_data) {
    const currentLang = Object.values(rawData.language_data).find((l: any) => l.current_learning) as any;
    if (currentLang?.tier !== undefined) return currentLang.tier;
    // 遍历所有语言，取最高的 tier
    const tiers = Object.values(rawData.language_data).map((l: any) => l.tier).filter(t => t !== undefined && t >= 0);
    if (tiers.length > 0) return Math.max(...tiers);
  }

  // 5. 其他常见字段名
  if ((rawData as any).league_tier !== undefined) return (rawData as any).league_tier;
  if ((rawData as any).leaderboard_league !== undefined) return (rawData as any).leaderboard_league;

  return -1;
}

function parseCreationDate(
  creationTs: number | undefined,
  created: string | undefined,
  timeZone?: string
): { dateStr: string; ageDays: number } {
  const tz = normalizeTimezone(timeZone);
  if (creationTs) {
    const ts = creationTs < 10000000000 ? creationTs * 1000 : creationTs;
    const cDate = new Date(ts);
    if (!isNaN(cDate.getTime())) {
      return {
        dateStr: cDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: tz }),
        ageDays: calcDaysSince(cDate, tz)
      };
    }
  }
  if (created) {
    const cDate = new Date(created);
    if (!isNaN(cDate.getTime())) {
      return {
        dateStr: cDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: tz }),
        ageDays: calcDaysSince(cDate, tz)
      };
    }
  }
  return { dateStr: "未知", ageDays: 0 };
}

function resolveStreakExtendedTime(
  streakExtendedToday: boolean,
  rawAny: any,
  rawData: DuolingoRawUser,
  localTodayStart: number,
  timeZone?: string
): string | undefined {
  if (!streakExtendedToday) return undefined;
  const tz = normalizeTimezone(timeZone);

  if (rawAny.streakData?.currentStreak?.lastExtendedDate) {
    return new Date(rawAny.streakData.currentStreak.lastExtendedDate)
      .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: tz });
  }

  if (rawData.calendar?.length) {
    const todayStr = toLocalDateKey(new Date(), tz);
    const todayEvents = rawData.calendar
      .filter(e => toLocalDateKey(new Date(normalizeUnixTs(e.datetime)), tz) === todayStr)
      .sort((a, b) => a.datetime - b.datetime);
    if (todayEvents.length > 0) {
      return new Date(normalizeUnixTs(todayEvents[0].datetime))
        .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    }
  }

  if (rawAny.xpGains?.length) {
    const todayGains = rawAny.xpGains
      .filter((g: any) => g.time * 1000 >= localTodayStart)
      .sort((a: any, b: any) => a.time - b.time);
    if (todayGains.length > 0) {
      return new Date(todayGains[0].time * 1000)
        .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    }
  }

  if (streakExtendedToday) {
    return "刚刚";
  }

  return undefined;
}

function sumPoints(items: Array<{ points?: number; xp?: number }> | undefined): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.points || item.xp || 0), 0);
}

export function transformDuolingoData(rawData: DuolingoRawUser, requestedTimezone?: string): UserData {
  // 输入验证
  if (!rawData || typeof rawData !== 'object') {
    throw new TypeError('transformDuolingoData: 输入必须是有效的用户数据对象');
  }

  const rawAny = rawData as any;
  const timeZone = normalizeTimezone(requestedTimezone);

  const streak = rawData.site_streak ?? rawData.streak ?? 0;

  let totalXp = rawAny._amebaData?.totalXp ?? rawData.total_xp ?? rawData.totalXp ?? 0;
  if (totalXp === 0) totalXp = sumPoints(rawData.languages);
  if (totalXp === 0 && rawData.language_data) totalXp = sumPoints(Object.values(rawData.language_data));
  if (totalXp === 0) totalXp = sumPoints(rawData.courses);

  const dailyGoal = rawData.dailyGoal ?? rawData.daily_goal ?? rawData.xpGoal ?? 0;
  const creationTs = rawData.creation_date || rawData.creationDate;

  let courses: Course[] = [];

  // --- Ameba Data Parsing (New Subjects Support) ---
  const amebaData = rawAny._amebaData;
  if (amebaData?.courses?.length) {
    courses = amebaData.courses
      .filter((c: any) => c.learningLanguage || c.subject || c.title)
      .map((c: any) => {
        const langCode = c.learningLanguage || c.subject;
        const title = formatCourseTitle(c.title, langCode, c.subject);

        let timeSpent = c.timeSpent || c.duration || 0;
        if (timeSpent > 1000000) timeSpent = Math.floor(timeSpent / 1000);

        return {
          title: title,
          xp: c.xp || c.points || 0,
          fromLanguage: c.fromLanguage || 'en',
          learningLanguage: c.learningLanguage || c.subject || 'unknown',
          crowns: c.crowns || 0,
          id: c.id || c.courseId || `${c.learningLanguage}-${c.fromLanguage}`,
          subject: c.subject,
          timeSpent: Math.floor(timeSpent / 60)
        };
      });
  }

  // Fallback and legacy courses (Merge with Ameba courses if not already present)
  if (rawData.courses?.length) {
    rawData.courses.forEach((c: any) => {
      const exists = courses.some(ac => 
        (ac.id && c.id && ac.id === c.id) || 
        (ac.learningLanguage === c.learningLanguage && ac.fromLanguage === c.fromLanguage)
      );
      if (!exists && (c.learningLanguage || c.subject || c.title)) {
        const langCode = c.learningLanguage || c.subject;
        const title = formatCourseTitle(c.title, langCode, c.subject);

        courses.push({
          title: title,
          xp: c.xp || 0,
          fromLanguage: c.fromLanguage || 'en',
          learningLanguage: c.learningLanguage || c.subject || 'unknown',
          crowns: c.crowns || 0,
          id: c.id || `${c.learningLanguage}-${c.fromLanguage}`,
          subject: c.subject,
          timeSpent: c.timeSpent || c.duration || 0
        });
      }
    });
  }

  if (rawAny.languages?.length) {
    const v1Courses = rawAny.languages
      .filter((l: any) => l.language || l.language_string)
      .map((l: any) => ({
        id: l.language,
        title: formatCourseTitle(l.language_string, l.language),
        xp: l.points || 0,
        crowns: l.crowns || 0,
        fromLanguage: 'en',
        learningLanguage: l.language,
      }));

    for (const v1c of v1Courses) {
      const exists = courses.some(c =>
        c.learningLanguage === v1c.learningLanguage &&
        (Math.abs(c.xp - v1c.xp) < 5 || (c.fromLanguage === 'en' && v1c.fromLanguage === 'en'))
      );
      if (!exists) courses.push(v1c);
    }
  }

  if (rawData.language_data) {
    const fallbackCourses = Object.entries(rawData.language_data)
      .filter(([_, langDetail]: [string, any]) => langDetail.learning_language || _)
      .map(([langCode, langDetail]: [string, any]) => {
        let crowns = langDetail.crowns || 0;
        if (crowns === 0 && langDetail.skills?.length) {
          crowns = langDetail.skills.reduce((acc: number, skill: any) =>
            acc + (skill.levels_finished || skill.crowns || skill.finishedLevels || 0), 0);
        }
        const learningLanguage = langDetail.learning_language || langCode;
        return {
          id: learningLanguage,
          title: formatCourseTitle(langDetail.language_string, learningLanguage),
          xp: langDetail.points || langDetail.level_progress || 0,
          crowns,
          fromLanguage: langDetail.from_language || 'en',
          learningLanguage: learningLanguage,
        };
      });
      
    courses.push(...fallbackCourses);
  }
  
  const coursesXpSum = courses.reduce((sum, c) => sum + (c.xp || 0), 0);
  totalXp = Math.max(totalXp, coursesXpSum);

  // 最终去重：结合归一化后的标题和源语言进行去重
  // 确保用不同语言学习的同一种语言不会被错误合并
  const courseMap = new Map<string, Course>();
  for (const c of courses) {
    const normalizedTitle = (c.title || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
    const key = `${normalizedTitle}-${c.fromLanguage || 'en'}`;
    // 只要归一化标题和源语言一致，就视为同一科目，后入的数据（Ameba）会覆盖旧数据
    courseMap.set(key, c);
  }
  courses = Array.from(courseMap.values());

  let learningLanguage = "None";
  if (rawData.language_data) {
    const current = Object.values(rawData.language_data).find(l => l.current_learning);
    learningLanguage = current?.language_string ?? courses[0]?.title ?? "None";
  } else if (rawData.currentCourse) {
    const cur = rawData.currentCourse as any;
    learningLanguage = (cur.subject ? SUBJECT_MAP[cur.subject] : cur.title) ?? courses[0]?.title ?? "None";
  } else if (courses.length > 0) {
    learningLanguage = courses[0].title;
  }

  const xpByDate = new Map<string, number>();
  const timeByDate = new Map<string, number>();

  function addCalendarEvent(event: { datetime: number; improvement?: number }): void {
    const eventTs = normalizeUnixTs(event.datetime);
    const dateKey = toLocalDateKey(new Date(eventTs), timeZone);
    const improvement = event.improvement || 0;
    xpByDate.set(dateKey, (xpByDate.get(dateKey) || 0) + improvement);
    timeByDate.set(dateKey, (timeByDate.get(dateKey) || 0) + Math.ceil((improvement || 10) / 3));
  }

  if (rawAny._xpSummaries?.length) {
    for (const summary of rawAny._xpSummaries) {
      const dateKey = parseSummaryDateKey(summary.date, timeZone);
      if (!dateKey) continue;

      const gainedXp = summary.gainedXp ?? summary.gained_xp ?? 0;
      xpByDate.set(dateKey, gainedXp);

      const sessionTimeSeconds = summary.totalSessionTime ?? summary.total_session_time ?? 0;
      const minutes = Math.round(sessionTimeSeconds / 60);
      timeByDate.set(dateKey, minutes > 0 ? minutes : Math.ceil(gainedXp / 3));
    }
  } else if (rawData.calendar?.length) {
    rawData.calendar.forEach(addCalendarEvent);
  } else if (rawData.language_data) {
    Object.values(rawData.language_data).forEach((lang: any) => {
      if (lang.calendar?.length) lang.calendar.forEach(addCalendarEvent);
    });
  }

  // 滚动 7 天数据（用于首页图表）
  const dailyXpHistory: { date: string; xp: number }[] = [];
  const dailyTimeHistory: { date: string; time: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = toLocalDateKey(d, timeZone);
    const dayLabel = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', timeZone });
    dailyXpHistory.push({ date: dayLabel, xp: xpByDate.get(dateKey) || 0 });
    dailyTimeHistory.push({ date: dayLabel, time: timeByDate.get(dateKey) || 0 });
  }

  // 自然周数据（用于分享卡片，周一到周日）
  const weeklyXpHistory: { date: string; xp: number; isFuture: boolean }[] = [];
  const weeklyTimeHistory: { date: string; time: number; isFuture: boolean }[] = [];
  const monday = getMonday(today, timeZone);
  const todayDateKey = toLocalDateKey(today, timeZone);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = toLocalDateKey(d, timeZone);
    const dayLabel = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', timeZone });
    const isFuture = dateKey > todayDateKey;

    weeklyXpHistory.push({
      date: dayLabel,
      xp: isFuture ? 0 : (xpByDate.get(dateKey) || 0),
      isFuture
    });
    weeklyTimeHistory.push({
      date: dayLabel,
      time: isFuture ? 0 : (timeByDate.get(dateKey) || 0),
      isFuture
    });
  }

  const yearlyXpHistory: { date: string; xp: number; time?: number }[] = [];
  xpByDate.forEach((xp, date) => yearlyXpHistory.push({ date, xp, time: timeByDate.get(date) }));

  const { dateStr: creationDateStr, ageDays: accountAgeDays } = parseCreationDate(creationTs, rawData.created, timeZone);

  const hasInventoryPremium = rawAny.inventory?.premium_subscription || rawAny.inventory?.super_subscription;
  const hasItemPremium = rawAny.has_item_premium_subscription || rawAny.has_item_immersive_subscription;
  const isPlus = !!(rawData.hasPlus || rawData.hasSuper || rawData.plusStatus === 'active' || rawAny.has_plus || rawAny.is_plus || hasInventoryPremium || hasItemPremium);

  // 计算总学习时间：优先使用课程中的真实 timeSpent
  const coursesTimeSum = courses.reduce((sum, c) => sum + (c.timeSpent || 0), 0);
  let totalMinutes = coursesTimeSum;
  let hasRealTimeData = totalMinutes > 0;

  if (!hasRealTimeData && rawAny._xpSummaries?.length) {
    const totalSeconds = rawAny._xpSummaries.reduce((acc: number, s: any) =>
      acc + (s.totalSessionTime ?? s.total_session_time ?? 0), 0);
    totalMinutes = Math.floor(totalSeconds / 60);
    hasRealTimeData = totalSeconds > 0;
  }

  if (!hasRealTimeData) {
    let dailyTimeSum = 0;
    timeByDate.forEach(t => { dailyTimeSum += t; });
    totalMinutes = dailyTimeSum;
    hasRealTimeData = totalMinutes > 0;
  }

  // 兜底方案：如果总时间为 0 且有经验值，则根据 XP 估算 (每 3 XP 估算为 1 分钟)
  if (totalMinutes === 0 && totalXp > 0) {
    totalMinutes = Math.ceil(totalXp / 3);
    hasRealTimeData = true;
  }

  const estimatedLearningTime = hasRealTimeData
    ? `${Math.floor(totalMinutes / 60)}小时 ${totalMinutes % 60}分钟`
    : '暂无数据';

  let xpToday = 0;
  let lessonsToday = 0;
  const streakExtendedToday = rawAny.streak_extended_today ?? rawAny.streakExtendedToday ?? false;

  const now = new Date();
  const localTodayStart = getStartOfDayInTimezone(now, timeZone);
  const localTodayEnd = localTodayStart + MS_PER_DAY;
  const localTodayDateKey = toLocalDateKey(now, timeZone);

  const streakExtendedTime = resolveStreakExtendedTime(streakExtendedToday, rawAny, rawData, localTodayStart, timeZone);

  // 优先从 xpSummaries 获取今日数据（包含官方统计 of numSessions）
  if (rawAny._xpSummaries?.length) {
    const todaySummary = rawAny._xpSummaries.find((s: any) =>
      parseSummaryDateKey(s.date, timeZone) === localTodayDateKey
    );
    if (todaySummary) {
      xpToday = todaySummary.gainedXp ?? todaySummary.gained_xp ?? 0;
      lessonsToday = todaySummary.numSessions ?? 0;
    }
  }

  // 备用：从其他数据源获取
  if (xpToday === 0) {
    const todayXpFromHistory = xpByDate.get(localTodayDateKey) || 0;

    if (rawAny.xp_today !== undefined) {
      xpToday = rawAny.xp_today;
    } else if (todayXpFromHistory > 0) {
      xpToday = todayXpFromHistory;
    } else if (rawAny.streakData?.currentStreak?.endDate) {
      const streakEndTs = new Date(rawAny.streakData.currentStreak.endDate).getTime();
      if (streakEndTs >= localTodayStart && streakEndTs < localTodayEnd) {
        xpToday = rawAny.streakData.currentStreak.lastExtendedDate ? 1 : 0;
      }
    } else if (rawData.calendar?.length) {
      const todayEvents = rawData.calendar.filter(e =>
        normalizeUnixTs(e.datetime) >= localTodayStart && normalizeUnixTs(e.datetime) < localTodayEnd
      );
      xpToday = todayEvents.reduce((acc, e) => acc + (e.improvement || 0), 0);
      if (lessonsToday === 0) lessonsToday = todayEvents.length;
    }
  }

  // 最终备用：从 xpGains 获取
  if (xpToday === 0 && rawAny.xpGains?.length) {
    const todayGains = rawAny.xpGains.filter((g: any) => {
      const gainTs = g.time * 1000;
      return gainTs >= localTodayStart && gainTs < localTodayEnd;
    });
    xpToday = todayGains.reduce((acc: number, g: any) => acc + (g.xp || 0), 0);
    if (lessonsToday === 0) lessonsToday = todayGains.length;
  }

  return {
    timezone: timeZone,
    streak, totalXp,
    courses, dailyXpHistory,
    dailyTimeHistory, yearlyXpHistory,
    weeklyXpHistory, weeklyTimeHistory,
    learningLanguage, creationDate: creationDateStr, accountAgeDays,
    isPlus, dailyGoal, estimatedLearningTime,
    xpToday,
    lessonsToday: lessonsToday || undefined,
    streakExtendedToday,
    streakExtendedTime,
    weeklyXp: rawAny.weeklyXp,
    numSessionsCompleted: rawAny.numSessionsCompleted,
    streakFreezeCount: rawAny.streakFreezeCount,
  };
}

export async function fetchDuolingoData(username?: string, _jwt?: string): Promise<UserData> {
  const timezone = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined;
  const params = new URLSearchParams();
  if (username) params.set('username', username);
  if (timezone) params.set('tz', timezone);
  const queryString = params.toString();
  const url = queryString ? `/api/data?${queryString}` : '/api/data';
  const response = await fetch(url, {
    headers: timezone ? { 'x-user-timezone': timezone } : undefined
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Fetch failed');
  }

  if (result.code === 'JWT_EXPIRED') {
    throw new Error('JWT_EXPIRED');
  }

  return result.data as UserData;
}
