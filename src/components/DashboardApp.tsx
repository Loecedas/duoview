import React, { useState, useEffect, useCallback, useRef } from 'react';
import { navigate } from 'astro:transitions/client';
import type { UserData } from '../types';
import { t } from '../utils/i18n';
import { StatCard } from './dashboard/StatCard';
import { CourseList } from './dashboard/CourseList';
import { TodayOverview } from './dashboard/TodayOverview';
import { XpBarChart } from './dashboard/XpBarChart';
import { HeatmapChart } from './dashboard/HeatmapChart';
import MonthlyChart from './dashboard/MonthlyChart';
import YearlyChart from './dashboard/YearlyChart';
import YearlyTimeChart from './dashboard/YearlyTimeChart';
import { Navbar } from './Navbar';
import { AppIcon } from './AppIcon';
import { useIconMode } from './useIconMode';
import type { IconName } from './AppIcon';

interface CompareStatCardProps {
    title: string;
    icon: 'bolt' | 'flame' | 'clock' | 'calendar';
    iconMode: any;
    label1: string;
    value1: number;
    value1Text: string;
    label2: string;
    value2: number;
    value2Text: string;
    color1: string;
    color2: string;
}

function CompareStatCard({
    title,
    icon,
    iconMode,
    label1,
    value1,
    value1Text,
    label2,
    value2,
    value2Text,
    color1,
    color2,
}: CompareStatCardProps) {
    const total = (value1 || 0) + (value2 || 0);
    const pct1 = total > 0 ? Math.round((value1 / total) * 100) : 50;
    const pct2 = total > 0 ? 100 - pct1 : 50;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-gray-700 mb-1">
                <AppIcon name={icon} mode={iconMode} className="text-base" />
                {title}
            </h3>
            <div className="flex justify-between items-baseline mb-1">
                <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">{label1}</span>
                    <span className="text-base font-black truncate block" style={{ color: color1 }}>{value1Text}</span>
                </div>
                <div className="text-right min-w-0 flex-1 pl-2">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">{label2}</span>
                    <span className="text-base font-black truncate block" style={{ color: color2 }}>{value2Text}</span>
                </div>
            </div>
            {/* progress bar */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full transition-all duration-500" style={{ width: `${pct1}%`, backgroundColor: color1 }} />
                <div className="h-full transition-all duration-500" style={{ width: `${pct2}%`, backgroundColor: color2 }} />
            </div>
        </div>
    );
}

function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '暂无数据') return 0;
    let totalMinutes = 0;
    const hourMatch = timeStr.match(/(\d+)\s*(h|小时)/i);
    const minuteMatch = timeStr.match(/(\d+)\s*(min|分钟)/i);
    if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
        totalMinutes += parseInt(minuteMatch[1]);
    }
    if (!hourMatch && !minuteMatch) {
        const digits = timeStr.match(/\d+/);
        if (digits) totalMinutes = parseInt(digits[0]);
    }
    return totalMinutes;
}

function formatTimeToHMin(timeStr: string): string {
    if (!timeStr || timeStr === '暂无数据') return timeStr;
    const hourMatch = timeStr.match(/(\d+)\s*小时/);
    const minuteMatch = timeStr.match(/(\d+)\s*分钟/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const mins = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    if (hours === 0 && mins === 0) {
        const hMatch = timeStr.match(/(\d+)\s*h/i);
        const mMatch = timeStr.match(/(\d+)\s*min/i);
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        if (h === 0 && m === 0) {
            const digits = timeStr.match(/\d+/);
            return digits ? `${digits[0]}min` : timeStr;
        }
        return h > 0 ? `${h}h${m}min` : `${m}min`;
    }
    return hours > 0 ? `${hours}h${mins}min` : `${mins}min`;
}

interface CustomSelectProps {
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    isDark?: boolean;
}

function CustomSelect({ value, options, onChange, isDark }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-b-4 transition-all duration-150 min-w-[95px] select-none ${
                    isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <svg
                    className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 opacity-70 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div
                    className={`absolute right-0 mt-1.5 w-32 rounded-xl border-2 shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${
                        isDark
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-gray-200'
                    }`}
                >
                    <div className="py-1">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center px-3 py-2 text-xs font-bold transition-colors text-left ${
                                        isSelected
                                        ? (isDark ? 'bg-slate-700 text-white' : 'bg-[#e5f5ff] text-[#1cb0f6]')
                                        : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-50')
                                    }`}
                                >
                                    {option.label}
                                    {isSelected && <span className="ml-auto text-[10px]">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

interface DashboardAppProps {
    username: string;
}

export default function DashboardApp({ username }: DashboardAppProps) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [compareUserData, setCompareUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [themeOpen, setThemeOpen] = useState(false);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const isDark = resolvedTheme === 'dark';
    const dashboardRef = useRef<HTMLDivElement>(null);
    const themeRef = useRef<HTMLDivElement>(null);
    const { iconMode, toggleIconMode } = useIconMode();

    const [selectedMonthlyYear, setSelectedMonthlyYear] = useState('');
    const [monthlyViewMode, setMonthlyViewMode] = useState<'year' | 'rolling12'>('rolling12');
    const [monthlyMetric, setMonthlyMetric] = useState<'xp' | 'time'>('xp');

    const registrationYear = (() => {
        const m = userData?.creationDate?.match(/(\d{4})/);
        return m ? Number(m[1]) : undefined;
    })();

    const getMonthlyYears = (data: any[], regYear?: number) => {
        const currentYear = new Date().getFullYear();
        const yearSet = new Set<number>();
        if (data?.length) {
            data.forEach((item) => {
                const yr = Number(item.date.slice(0, 4));
                if (!Number.isNaN(yr) && yr > 2010 && yr <= currentYear) yearSet.add(yr);
            });
        }
        const minYear = regYear && regYear > 2010 && regYear <= currentYear
            ? regYear
            : yearSet.size > 0 ? Math.min(...yearSet) : currentYear;
        for (let y = minYear; y <= currentYear; y++) yearSet.add(y);
        return Array.from(yearSet).sort((a, b) => b - a).map(String);
    };

    const years = getMonthlyYears(userData?.yearlyXpHistory || [], registrationYear);

    useEffect(() => {
        if (years.length > 0 && !years.includes(selectedMonthlyYear)) {
            setSelectedMonthlyYear(years[0]);
        }
    }, [userData, selectedMonthlyYear, years]);

    const fetchData = useCallback(async (showRefreshing = false) => {
        const controller = new AbortController();
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const usernames = username.split(',').map(u => u.trim()).filter(Boolean);

            if (usernames.length === 2) {
                const [res1, res2] = await Promise.all([
                    fetch(`/api/data?username=${encodeURIComponent(usernames[0])}`, {
                        signal: controller.signal,
                        headers: timezone ? { 'x-user-timezone': timezone } : undefined
                    }),
                    fetch(`/api/data?username=${encodeURIComponent(usernames[1])}`, {
                        signal: controller.signal,
                        headers: timezone ? { 'x-user-timezone': timezone } : undefined
                    })
                ]);

                const json1 = await res1.json();
                if (!res1.ok) throw new Error(`${usernames[0]}: ${json1.error || '获取数据失败'}`);

                const json2 = await res2.json();
                if (!res2.ok) throw new Error(`${usernames[1]}: ${json2.error || '获取数据失败'}`);

                setUserData(json1.data);
                setCompareUserData(json2.data);
            } else {
                const res = await fetch(`/api/data?username=${encodeURIComponent(username)}`, {
                    signal: controller.signal,
                    headers: timezone ? { 'x-user-timezone': timezone } : undefined
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || '获取数据失败');
                setUserData(json.data);
                setCompareUserData(null);
            }
            setLastUpdated(Date.now());
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            setError(e.message || '未知错误');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
        return () => controller.abort();
    }, [username]);

    useEffect(() => {
        let cleanupFunc: (() => void) | undefined;
        fetchData().then(cleanup => {
            if (typeof cleanup === 'function') cleanupFunc = cleanup;
        });
        return () => {
            if (cleanupFunc) cleanupFunc();
        };
    }, [fetchData]);

    // Load saved theme
    useEffect(() => {
        const saved = localStorage.getItem('duoview-theme') as 'light' | 'dark' | 'system' | null;
        if (saved) setTheme(saved);
    }, []);

    // Resolve system theme
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => {
            setResolvedTheme(theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme);
        };
        update();
        if (theme === 'system') {
            mq.addEventListener('change', update);
            return () => mq.removeEventListener('change', update);
        }
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.body.setAttribute('data-theme', resolvedTheme);
        if (resolvedTheme === 'dark') {
            document.documentElement.style.backgroundColor = '#0f172a';
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.style.backgroundColor = '#f0f4f8';
            document.documentElement.style.colorScheme = 'light';
        }
    }, [resolvedTheme]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            const root = themeRef.current;
            if (!root) return;

            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const clickedInside = path.length > 0 ? path.includes(root) : root.contains(e.target as Node);

            if (!clickedInside) setThemeOpen(false);
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, []);

    const changeTheme = (t: 'light' | 'dark' | 'system') => {
        setTheme(t);
        localStorage.setItem('duoview-theme', t);
        setThemeOpen(false);
    };

    // Keyboard Esc support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Escape' || e.key === 'Esc') && !sharing) {
                if (themeOpen) {
                    setThemeOpen(false);
                } else {
                    navigate('/');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [sharing, themeOpen]);

    // Mobile/Hardware back button support
    useEffect(() => {
        window.history.pushState({ entry: true }, '');
        
        const handlePopState = (e: PopStateEvent) => {
            navigate('/');
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const themeIcon = { light: 'sun', dark: 'moon', system: 'desktop' } as const;

    const getUpdateStatusText = () => {
        if (refreshing) return t('nav.updating');
        if (!lastUpdated) return t('nav.not_updated');
        const timeStr = new Date(lastUpdated).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
        });
        return t('nav.updated_at', { time: timeStr });
    };

    const handleShare = useCallback(async () => {
        const el = dashboardRef.current;
        if (!el || sharing) return;
        setSharing(true);
        
        const originalStyle = {
            width: el.style.width,
            maxWidth: el.style.maxWidth,
            height: el.style.height,
            padding: el.style.padding,
            boxSizing: el.style.boxSizing,
            overflow: el.style.overflow,
            background: el.style.background,
            visibility: el.style.visibility
        };

        try {
            const isStandardMode = el.clientWidth === 1280;
            const captureWidth = isStandardMode ? 1280 : el.clientWidth;
            
            el.style.width = `${captureWidth}px`;
            el.style.maxWidth = `${captureWidth}px`;
            el.style.height = 'auto';
            el.style.padding = '32px 32px 56px 32px';
            el.style.boxSizing = 'border-box';
            el.style.background = resolvedTheme === 'dark' ? '#0f172a' : '#f0f4f8';
            
            window.dispatchEvent(new Event('resize'));

            const actualScrollHeight = el.scrollHeight;
            const captureHeight = isStandardMode ? 1320 : actualScrollHeight;
            el.style.height = `${captureHeight}px`;
            el.style.overflow = 'hidden';

            await new Promise(resolve => setTimeout(resolve, 800));
            await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(el, {
                pixelRatio: 2,
                width: captureWidth,
                height: captureHeight,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    margin: '0',
                    width: `${captureWidth}px`,
                    height: `${captureHeight}px`,
                    padding: '32px 32px 56px 32px',
                    boxSizing: 'border-box',
                },
                backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f0f4f8',
                skipFonts: false,
                cacheBust: true,
            });

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `duoview-${username}-${dateStr}.png`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 2000);

        } catch (e: any) {
            console.error('截图失败', e);
            alert(`截图失败：${e?.message ?? e}`);
        } finally {
            Object.assign(el.style, originalStyle);
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => {
                setSharing(false);
            }, 50);
        }
    }, [username, sharing, resolvedTheme]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AppIcon name="parrot" mode="emoji" className="text-5xl animate-bounce" label={t('dash.loading_label')} />
                <p className="text-gray-600 font-bold text-lg">
                    {t('dash.fetching', { username })}
                </p>
                <p className="text-gray-400 text-sm">{t('dash.loading_tip')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <a
                    href="/"
                    className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border-2 border-b-4 border-gray-200 font-bold text-gray-600 hover:border-[#1cb0f6] hover:text-[#1cb0f6] transition-colors text-sm"
                >
                    ← {t('error.back')}
                </a>
                <div className="text-center max-w-sm">
                    <AppIcon name="sad" mode={iconMode} className="mb-4 text-5xl text-red-400" label="错误" />
                    <h2 className="text-xl font-extrabold text-gray-800 mb-2">{t('error.user_not_found')}</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        {t('error.user_not_found_tip', { username })}
                    </p>
                    <p className="text-red-400 text-xs mb-6 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#58cc02] hover:bg-[#46a300] text-white font-black rounded-2xl border-b-4 border-[#46a300] transition-colors"
                    >
                        <AppIcon name="search" mode={iconMode} className="text-white" />
                        {t('error.reenter')}
                    </a>
                </div>
            </div>
        );
    }

    if (!userData) return null;

    const usernames = username.split(',').map(u => u.trim()).filter(Boolean);

    const statItems: Array<{ label: string; value: string | number; icon: IconName; color: string; bg: string }> = [
        { label: '预估投入时间', value: userData.estimatedLearningTime, icon: 'clock', color: '#a855f7', bg: 'bg-purple-50' },
        { label: '总经验', value: userData.totalXp.toLocaleString() + ' XP', icon: 'bolt', color: '#eab308', bg: 'bg-yellow-50' },
        { label: '学习课程', value: userData.courses.length, icon: 'books', color: '#58cc02', bg: 'bg-blue-50' },
        { label: '账号年龄', value: `${userData.accountAgeDays} 天`, icon: 'calendar', color: '#ff4b4b', bg: 'bg-purple-50' },
    ];

    return (
        <div className="min-h-screen bg-[#f0f4f8]" data-theme={resolvedTheme}>
            {sharing && (
                <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in ${isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                    <div className="relative mb-6">
                        <div className={`h-20 w-20 animate-spin rounded-full border-4 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-t-[#58cc02]`} />
                        <AppIcon name="camera" mode={iconMode} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-[#58cc02]" />
                    </div>
                    <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dash.sharing_title')}</p>
                    <p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {t('dash.sharing_tip')}
                    </p>
                </div>
            )}

            <Navbar
                refreshing={refreshing}
                sharing={sharing}
                fetchData={fetchData}
                handleShare={handleShare}
                iconMode={iconMode}
                toggleIconMode={toggleIconMode}
                theme={theme}
                themeOpen={themeOpen}
                setThemeOpen={setThemeOpen}
                changeTheme={changeTheme}
                themeIcon={themeIcon}
                getUpdateStatusText={getUpdateStatusText}
                themeRef={themeRef}
                resolvedTheme={resolvedTheme}
            />

            <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
                <div ref={dashboardRef} className="max-w-7xl mx-auto bg-inherit">
                    {compareUserData ? (
                        /* 对比模式布局 */
                        <div className="animate-fade-in-up">
                            {/* 对比模式标题 */}
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center gap-4 bg-white rounded-3xl p-4 shadow-sm border-2 border-b-4 border-gray-200">
                                    <div className="text-right">
                                        <div className="font-extrabold text-lg text-gray-800">{usernames[0]}</div>
                                        <div className="text-xs text-[#58cc02] font-bold">连胜: {userData.streak} 天</div>
                                    </div>
                                    <span className="text-xl font-black text-purple-400">VS</span>
                                    <div className="text-left">
                                        <div className="font-extrabold text-lg text-gray-800">{usernames[1]}</div>
                                        <div className="text-xs text-[#ce82ff] font-bold">连胜: {compareUserData.streak} 天</div>
                                    </div>
                                </div>
                            </div>

                            {/* 对比核心数据卡片 */}
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <CompareStatCard
                                    title="总经验对比"
                                    icon="bolt"
                                    iconMode={iconMode}
                                    label1={usernames[0]}
                                    value1={userData.totalXp}
                                    value1Text={`${userData.totalXp.toLocaleString()} XP`}
                                    label2={usernames[1]}
                                    value2={compareUserData.totalXp}
                                    value2Text={`${compareUserData.totalXp.toLocaleString()} XP`}
                                    color1="#58cc02"
                                    color2="#ce82ff"
                                />

                                <CompareStatCard
                                    title="连胜天数对比"
                                    icon="flame"
                                    iconMode={iconMode}
                                    label1={usernames[0]}
                                    value1={userData.streak}
                                    value1Text={`${userData.streak} 天`}
                                    label2={usernames[1]}
                                    value2={compareUserData.streak}
                                    value2Text={`${compareUserData.streak} 天`}
                                    color1="#58cc02"
                                    color2="#ce82ff"
                                />

                                <CompareStatCard
                                    title="累计学习时间对比"
                                    icon="clock"
                                    iconMode={iconMode}
                                    label1={usernames[0]}
                                    value1={parseTimeToMinutes(userData.estimatedLearningTime)}
                                    value1Text={formatTimeToHMin(userData.estimatedLearningTime)}
                                    label2={usernames[1]}
                                    value2={parseTimeToMinutes(compareUserData.estimatedLearningTime)}
                                    value2Text={formatTimeToHMin(compareUserData.estimatedLearningTime)}
                                    color1="#58cc02"
                                    color2="#ce82ff"
                                />

                                <CompareStatCard
                                    title="注册天数对比"
                                    icon="calendar"
                                    iconMode={iconMode}
                                    label1={usernames[0]}
                                    value1={userData.accountAgeDays}
                                    value1Text={`${userData.accountAgeDays} 天`}
                                    label2={usernames[1]}
                                    value2={compareUserData.accountAgeDays}
                                    value2Text={`${compareUserData.accountAgeDays} 天`}
                                    color1="#58cc02"
                                    color2="#ce82ff"
                                />
                            </div>

                            {/* 合并对比图表 */}
                            <div className="space-y-4 mb-6">
                                <XpBarChart
                                    userData={userData}
                                    compareUserData={compareUserData}
                                    theme={resolvedTheme}
                                    isPrinting={sharing}
                                    iconMode={iconMode}
                                    user1Label={usernames[0]}
                                    user2Label={usernames[1]}
                                />
                                
                                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200">
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                            <AppIcon name="calendar" mode={iconMode} className="text-base" />
                                            月度经验与时间对比
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMonthlyMetric(m => m === 'xp' ? 'time' : 'xp')}
                                                className="px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-b-4 border-gray-200 bg-white text-gray-600 hover:border-gray-300 focus:outline-none"
                                            >
                                                {monthlyMetric === 'xp' ? '切换为时间' : '切换为经验'}
                                            </button>
                                            <CustomSelect
                                                 value={monthlyViewMode === 'rolling12' ? 'rolling12' : selectedMonthlyYear}
                                                 onChange={(val) => {
                                                     if (val === 'rolling12') {
                                                         setMonthlyViewMode('rolling12');
                                                     } else {
                                                         setMonthlyViewMode('year');
                                                         setSelectedMonthlyYear(val);
                                                     }
                                                 }}
                                                 options={[
                                                     { value: 'rolling12', label: '近 12 个月' },
                                                     ...years.map(y => ({ value: y, label: `${y} 年` }))
                                                 ]}
                                                 isDark={isDark}
                                             />
                                        </div>
                                    </div>
                                    <MonthlyChart
                                        data={userData.yearlyXpHistory || []}
                                        compareData={compareUserData.yearlyXpHistory || []}
                                        selectedYear={selectedMonthlyYear}
                                        viewMode={monthlyViewMode}
                                        metric={monthlyMetric}
                                        isDark={isDark}
                                        isPrinting={sharing}
                                        user1Label={usernames[0]}
                                        user2Label={usernames[1]}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                            <AppIcon name="bolt" mode={iconMode} className="text-base" />
                                            年度经验对比
                                        </h4>
                                        <YearlyChart
                                            data={userData.yearlyXpHistory || []}
                                            compareData={compareUserData.yearlyXpHistory || []}
                                            isDark={isDark}
                                            isPrinting={sharing}
                                            user1Label={usernames[0]}
                                            user2Label={usernames[1]}
                                        />
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                            <AppIcon name="clock" mode={iconMode} className="text-base" />
                                            年度学习时间对比
                                        </h4>
                                        <YearlyTimeChart
                                            data={userData.yearlyXpHistory || []}
                                            compareData={compareUserData.yearlyXpHistory || []}
                                            isDark={isDark}
                                            isPrinting={sharing}
                                            user1Label={usernames[0]}
                                            user2Label={usernames[1]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 单人模式布局 */
                        <div className="animate-fade-in-up">
                            <div className="mb-3">
                                <h1 className="mb-2 break-words text-2xl font-extrabold text-gray-800 sm:text-3xl">
                                    {t('dash.user_data', { username })}
                                </h1>
                                <p className="text-xs text-gray-500 sm:text-sm">
                                    {t('dash.joined_days', { days: userData.accountAgeDays })}
                                    · {t('dash.learning_focus', { language: userData.learningLanguage })}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {userData.isPlus && (
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f9f0ff] border border-[#f0d9ff] rounded-2xl text-[#ce82ff] text-sm font-bold whitespace-nowrap">
                                            <AppIcon name="crown" mode={iconMode} className="text-base" />
                                            Super
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#fff3e0] border border-[#ffe0b2] rounded-2xl text-[#ff9600] text-sm font-bold whitespace-nowrap">
                                        <AppIcon name="flame" mode={iconMode} className="text-base" />
                                        {userData.streak} 天连胜
                                    </span>
                                </div>
                            </div>

                            {/* Stat Cards */}
                            <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                                {statItems.map((item, i) => (
                                    <StatCard key={item.label} {...item} iconMode={iconMode} seq={i + 1} />
                                ))}
                            </div>

                            {/* Charts */}
                            <div className="mb-4">
                                <XpBarChart userData={userData} seq={5} theme={resolvedTheme} isPrinting={sharing} iconMode={iconMode} />
                            </div>

                            {/* Monthly Chart */}
                            <div className="mb-4 bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 animate-fade-in-up delay-5">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 className="flex h-6 items-center text-base font-bold leading-none text-gray-800">
                                        <AppIcon name="calendar" mode={iconMode} className="mr-1.5 text-[1.05em]" />
                                        {monthlyMetric === 'xp' ? '月度经验对比' : '月度学习时间'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMonthlyMetric(m => m === 'xp' ? 'time' : 'xp')}
                                            className="px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-b-4 border-gray-200 bg-white text-gray-600 hover:border-gray-300 focus:outline-none"
                                        >
                                            {monthlyMetric === 'xp' ? '切换为时间' : '切换为经验'}
                                        </button>
                                        <CustomSelect
                                            value={monthlyViewMode === 'rolling12' ? 'rolling12' : selectedMonthlyYear}
                                            onChange={(val) => {
                                                if (val === 'rolling12') {
                                                    setMonthlyViewMode('rolling12');
                                                } else {
                                                    setMonthlyViewMode('year');
                                                    setSelectedMonthlyYear(val);
                                                }
                                            }}
                                            options={[
                                                { value: 'rolling12', label: '近 12 个月' },
                                                ...years.map(y => ({ value: y, label: `${y} 年` }))
                                            ]}
                                            isDark={isDark}
                                        />
                                    </div>
                                </div>
                                <div className="w-full">
                                    <MonthlyChart
                                        data={userData.yearlyXpHistory || []}
                                        selectedYear={selectedMonthlyYear}
                                        viewMode={monthlyViewMode}
                                        metric={monthlyMetric}
                                        isDark={isDark}
                                        isPrinting={sharing}
                                    />
                                </div>
                            </div>

                            {/* Yearly Charts */}
                            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up delay-5">
                                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
                                    <h2 className="flex h-6 items-center text-base font-bold leading-none text-gray-800">
                                        <AppIcon name="bolt" mode={iconMode} className="mr-1.5 text-[1.05em]" />
                                        年度经验对比
                                    </h2>
                                    <YearlyChart data={userData.yearlyXpHistory || []} isDark={isDark} isPrinting={sharing} />
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
                                    <h2 className="flex h-6 items-center text-base font-bold leading-none text-gray-800">
                                        <AppIcon name="clock" mode={iconMode} className="mr-1.5 text-[1.05em]" />
                                        年度学习时间
                                    </h2>
                                    <YearlyTimeChart data={userData.yearlyXpHistory || []} isDark={isDark} isPrinting={sharing} />
                                </div>
                            </div>

                            {/* Course List */}
                            <div className="animate-fade-in-up delay-5 mb-4">
                                <CourseList courses={userData.courses} />
                            </div>

                            {/* Today Overview */}
                            <div className="mb-4">
                                <TodayOverview userData={userData} iconMode={iconMode} seq={6} />
                            </div>

                            {/* Heatmap */}
                            <div className="animate-fade-in-up delay-5">
                                <HeatmapChart userData={userData} iconMode={iconMode} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
