import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { UserData } from '../types';
import { t } from '../utils/i18n';
import { StatCard } from './dashboard/StatCard';
import { CourseList } from './dashboard/CourseList';
import { TodayOverview } from './dashboard/TodayOverview';
import { XpBarChart } from './dashboard/XpBarChart';
import { HeatmapChart } from './dashboard/HeatmapChart';
import { Navbar } from './Navbar';
import { AppIcon } from './AppIcon';
import { useIconMode } from './useIconMode';

interface DashboardAppProps {
    username: string;
}

export default function DashboardApp({ username }: DashboardAppProps) {
    const [userData, setUserData] = useState<UserData | null>(null);
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

    const fetchData = useCallback(async (showRefreshing = false) => {
        const controller = new AbortController();
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/data?username=${encodeURIComponent(username)}`, {
                signal: controller.signal
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || '获取数据失败');
            setUserData(json.data);
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
            if (e.key === 'Escape' && !sharing) {
                if (themeOpen) {
                    setThemeOpen(false);
                } else {
                    window.location.replace('/');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [sharing, themeOpen]);

    // Mobile/Hardware back button support
    useEffect(() => {
        // Push a dummy state once on mount to intercept the hardware back button
        window.history.pushState({ entry: true }, '');
        
        const handlePopState = (e: PopStateEvent) => {
            // Redirect immediately to home
            window.location.replace('/');
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
        
        // 1. 深度克隆原始状态
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
            // ---- 镜像沙箱方案：强制刷新并锁定渲染 ----
            
            // 判定是否为标准 1280px 模式
            const isStandardMode = el.clientWidth === 1280;
            const captureWidth = isStandardMode ? 1280 : el.clientWidth;
            
            // A. 解锁高度测量真实长度
            el.style.width = `${captureWidth}px`;
            el.style.maxWidth = `${captureWidth}px`;
            el.style.height = 'auto';
            el.style.padding = '32px 32px 56px 32px';
            el.style.boxSizing = 'border-box';
            el.style.background = resolvedTheme === 'dark' ? '#0f172a' : '#f0f4f8';
            
            // B. 强制广播 Resize 事件，让所有图表（Recharts）重新感知容器宽度
            window.dispatchEvent(new Event('resize'));

            // C. 测量真实高度并锁定
            const actualScrollHeight = el.scrollHeight;
            const captureHeight = isStandardMode ? 1320 : actualScrollHeight;
            el.style.height = `${captureHeight}px`;
            el.style.overflow = 'hidden';

            // D. 深度等待：给图表充足的重绘和动画静止时间 (800ms + 动画帧)
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

            // 下载逻辑
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
            // E. 同步恢复现场：先恢复样式，再移除遮罩
            Object.assign(el.style, originalStyle);
            window.dispatchEvent(new Event('resize')); // 恢复时再次触发 resize 以修正布局
            
            // 额外延迟 50ms 确保浏览器重绘完成，然后再移除 Loading 状态
            setTimeout(() => {
                setSharing(false);
            }, 50);
        }
    }, [username, sharing, resolvedTheme]);




    // ---- LOADING ----
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                {/*
                <AppIcon name="parrot" mode={iconMode} className="text-5xl animate-bounce text-[#58cc02]" label="加载中" />
                */}
                <AppIcon name="parrot" mode="emoji" className="text-5xl animate-bounce" label={t('dash.loading_label')} />
                <p className="text-gray-600 font-bold text-lg">
                    {t('dash.fetching', { username })}
                </p>
                <p className="text-gray-400 text-sm">{t('dash.loading_tip')}</p>
            </div>
        );
    }

    // ---- ERROR ----
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                {/* Back button */}
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

    const statItems = [
        { label: '预估投入时间', value: userData.estimatedLearningTime, icon: 'clock', color: '#a855f7', bg: 'bg-purple-50' },
        { label: '总经验', value: userData.totalXp.toLocaleString() + ' XP', icon: 'bolt', color: '#eab308', bg: 'bg-yellow-50' },
        { label: '学习课程', value: userData.courses.length, icon: 'books', color: '#58cc02', bg: 'bg-blue-50' },
        { label: '账号年龄', value: `${userData.accountAgeDays} 天`, icon: 'calendar', color: '#ff4b4b', bg: 'bg-purple-50' },
    ];

    return (
        <div className="min-h-screen bg-[#f0f4f8]" data-theme={resolvedTheme}>
            {/* 截图中的全屏遮罩 - 解决界面跳变问题 */}
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


            {/* Dashboard content — captured for share screenshot */}
            <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
                <div ref={dashboardRef} className="max-w-7xl mx-auto bg-inherit">
                    {/* Page Header */}
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

                        {/* Course List (语言分布) */}
                        <div className="animate-fade-in-up delay-5 mb-4">
                            <CourseList courses={userData.courses} />
                        </div>

                        {/* Today Overview (今日概览) */}
                        <div className="mb-4">
                            <TodayOverview userData={userData} iconMode={iconMode} seq={6} />
                        </div>

                        {/* Heatmap */}
                        <div className="animate-fade-in-up delay-5">
                            <HeatmapChart userData={userData} iconMode={iconMode} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
