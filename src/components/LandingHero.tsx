import React, { useEffect, useState, useRef } from 'react';
import { AppIcon } from './AppIcon';
import { useIconMode } from './useIconMode';
import { t } from '../utils/i18n';

export default function LandingHero() {
    const [username, setUsername] = useState('');
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [username2, setUsername2] = useState('');
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [themeOpen, setThemeOpen] = useState(false);
    const themeRef = useRef<HTMLDivElement>(null);
    const isDark = resolvedTheme === 'dark';
    const themeIcons = { light: 'sun', dark: 'moon', system: 'desktop' } as const;
    const { iconMode } = useIconMode();

    useEffect(() => {
        const saved = localStorage.getItem('duoview-theme') as 'light' | 'dark' | 'system' | null;
        if (saved) setTheme(saved);
    }, []);

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

    // Fix bfcache back navigation
    useEffect(() => {
        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                setLoading(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed1 = username.trim();
        if (!trimmed1) return;
        setLoading(true);
        if (isCompareMode) {
            const trimmed2 = username2.trim();
            window.location.href = `/dashboard?user=${encodeURIComponent(trimmed1)},${encodeURIComponent(trimmed2)}`;
        } else {
            window.location.href = `/dashboard?user=${encodeURIComponent(trimmed1)}`;
        }
    }

    const examples = ['duolingo', 'KartikTalwar'];

    return (

        <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f0f4f8]'}`} data-theme={resolvedTheme}>
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <div className="relative" ref={themeRef}>
                    <button
                        type="button"
                        onClick={() => setThemeOpen(o => !o)}
                        className={`flex items-center justify-center w-10 h-10 rounded-2xl border-2 border-b-4 transition-colors ${
                            isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                        aria-label="Toggle Theme"
                    >
                        <AppIcon name={themeIcons[theme]} mode={iconMode} className="text-xl" />
                    </button>
                    {themeOpen && (
                        <div className={`absolute right-0 top-full mt-2 z-50 min-w-[130px] overflow-hidden rounded-2xl border-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
                            isDark
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-white border-gray-200'
                        }`}>
                            {(['light', 'dark', 'system'] as const).map(t_key => (
                                <button
                                    type="button"
                                    key={t_key}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeTheme(t_key);
                                    }}
                                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                                        isDark
                                        ? `hover:bg-slate-700 ${theme === t_key ? 'text-slate-100 font-extrabold' : 'text-slate-300'}`
                                        : `hover:bg-gray-50 ${theme === t_key ? 'text-gray-900 font-extrabold' : 'text-gray-600'}`
                                    }`}
                                >
                                    <AppIcon name={themeIcons[t_key]} mode={iconMode} className="text-current text-base" />
                                    {t_key === 'light' ? t('theme.light') : t_key === 'dark' ? t('theme.dark') : t('theme.system')}
                                    {theme === t_key && <span className="ml-auto">✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Logo / Brand */}
            <div className="mb-10 animate-fade-in-up text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                    <AppIcon name="parrot" mode="emoji" className="text-4xl" label="DuoView" />
                    <span className="text-4xl font-black text-[#58cc02] tracking-tight">DuoView</span>
                </div>
                <p className={`text-sm font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('nav.home').replace('返回 ', '')} · 多邻国学习数据查看器</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md animate-fade-in-up delay-1">
                <div className={`rounded-3xl shadow-lg border-2 border-b-4 p-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <h1 className={`text-2xl font-extrabold mb-2 text-center ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                        {t('hero.title')}
                    </h1>
                    <p className={`text-sm text-center mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {t('hero.subtitle')}
                    </p>

                    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                        {/* Mode Toggle Switch */}
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                查询模式
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsCompareMode(!isCompareMode)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border-2 border-b-4 ${
                                    isCompareMode
                                    ? 'bg-[#f9f0ff] border-[#ce82ff] text-[#ce82ff]'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                            >
                                {isCompareMode ? '双人对比 开启' : '单人查询 开启'}
                            </button>
                        </div>

                        {!isCompareMode ? (
                            <div>
                                <label htmlFor="username" className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {t('hero.label')}
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    autoFocus
                                    autoComplete="off"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder={t('hero.placeholder')}
                                    className={`w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 focus:border-[#1cb0f6] outline-none font-bold text-base transition-colors placeholder:font-normal ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
                                />
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in-up">
                                <div>
                                    <label htmlFor="username" className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        第一个用户
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        autoFocus
                                        autoComplete="off"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="输入第一个用户名"
                                        className={`w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 focus:border-[#ce82ff] outline-none font-bold text-base transition-colors placeholder:font-normal ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="username2" className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        第二个用户
                                    </label>
                                    <input
                                        id="username2"
                                        type="text"
                                        autoComplete="off"
                                        value={username2}
                                        onChange={e => setUsername2(e.target.value)}
                                        placeholder="输入第二个用户名"
                                        className={`w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 focus:border-[#ce82ff] outline-none font-bold text-base transition-colors placeholder:font-normal ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!username.trim() || (isCompareMode && !username2.trim()) || loading}
                            className={`w-full py-3.5 rounded-2xl border-2 border-b-4 text-white font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5 ${
                                isCompareMode 
                                ? 'border-[#ce82ff] bg-[#ce82ff] hover:bg-[#b066e0]' 
                                : 'border-[#1cb0f6] bg-[#1cb0f6] hover:bg-[#1899d6]'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <AppIcon name="hourglass" mode={iconMode} className="text-white animate-spin" />
                                    {t('hero.redirecting')}
                                </>
                            ) : (
                                <>
                                    <AppIcon name="search" mode={iconMode} className="text-white" />
                                    {isCompareMode ? '开始对比' : t('hero.submit')}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Examples */}
            <div className="mt-6 animate-fade-in-up delay-2 text-center">
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('hero.examples')}</span>
                <span className="ml-2 space-x-2">
                    {examples.map(ex => (
                        <button
                            key={ex}
                            onClick={() => {
                                setUsername(ex);
                                setLoading(true);
                                window.location.href = `/dashboard?user=${encodeURIComponent(ex)}`;
                            }}
                            className="text-sm text-[#1cb0f6] font-bold hover:underline"
                        >
                            {ex}
                        </button>
                    ))}
                </span>
            </div>

            {/* Footer */}
            <footer className={`mt-16 animate-fade-in-up delay-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {t('hero.footer')}
            </footer>
        </div>
    );
}
