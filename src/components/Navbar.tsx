import React from 'react';
import { AppIcon } from './AppIcon';
import type { IconMode } from './useIconMode';
import type { IconName } from './AppIcon';

interface NavbarProps {
    refreshing: boolean;
    sharing: boolean;
    fetchData: (showRefreshing?: boolean) => void;
    handleShare: () => void;
    iconMode: IconMode;
    toggleIconMode: () => void;
    theme: 'light' | 'dark' | 'system';
    themeOpen: boolean;
    setThemeOpen: (open: boolean | ((o: boolean) => boolean)) => void;
    changeTheme: (t: 'light' | 'dark' | 'system') => void;
    themeIcon: { light: IconName; dark: IconName; system: IconName };
    getUpdateStatusText: () => string;
    themeRef: React.RefObject<HTMLDivElement | null>;
    resolvedTheme: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({
    refreshing,
    sharing,
    fetchData,
    handleShare,
    iconMode,
    toggleIconMode,
    theme,
    themeOpen,
    setThemeOpen,
    changeTheme,
    themeIcon,
    getUpdateStatusText,
    themeRef,
    resolvedTheme
}) => {
    const isDark = resolvedTheme === 'dark';

    return (
        <nav 
            className={`sticky top-0 z-30 w-full px-3 sm:px-4 md:px-6 transition-all duration-300 border-b backdrop-blur-sm shadow-sm ${
                isDark 
                ? 'bg-[#0f172a]/95 border-slate-800 text-slate-100' 
                : 'bg-white/95 border-gray-200 text-gray-800'
            }`}
        >
            <div className="max-w-7xl mx-auto py-2 sm:py-3 relative min-h-[3.5rem] sm:min-h-[4.5rem] flex items-center justify-between">
                {/* 左侧：返回按钮 */}
                <div className="z-10">
                    <a
                        href="/"
                        className={`inline-flex items-center gap-1 rounded-2xl border-2 border-b-4 px-2.5 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                            isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        }`}
                    >
                        ← 返回<span className="hidden sm:inline">首页</span>
                    </a>
                </div>
                
                {/* 中间：Logo (Mobile 仅图标 / Desktop 文字+图标) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 pointer-events-none">
                    <AppIcon name="parrot" mode="emoji" className="text-xl sm:text-2xl" label="DuoView" />
                    <span className="text-base font-black text-[#58cc02] sm:text-lg lg:text-xl hidden sm:inline">DuoView</span>
                </div>

                {/* 右侧：操作区 */}
                <div className="flex items-center gap-1.5 sm:gap-2 z-10">
                    <div className="hidden xl:flex items-center px-1">
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`} aria-live="polite">
                            {getUpdateStatusText()}
                        </span>
                    </div>
                    
                    {/* 操作按钮组 */}
                    <div className={`flex items-center rounded-2xl border-2 border-b-4 transition-all duration-300 lg:border-0 lg:border-b-0 lg:rounded-none lg:bg-transparent lg:gap-2 ${
                        isDark 
                        ? 'bg-slate-800 border-slate-700 divide-slate-700/50' 
                        : 'bg-white border-gray-200 divide-gray-100'
                    } divide-x lg:divide-x-0`}>
                        {/* Theme picker */}
                        <div className="relative" ref={themeRef}>
                            <button
                                type="button"
                                onClick={() => setThemeOpen(o => !o)}
                                className={`flex items-center gap-1.5 transition-colors text-xs font-bold sm:gap-2 sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-l-[14px] lg:rounded-2xl lg:border-2 lg:border-b-4 ${
                                    isDark
                                    ? 'text-slate-200 hover:bg-slate-700 lg:bg-slate-800 lg:border-slate-700 lg:hover:bg-slate-700 lg:hover:border-slate-600 lg:hover:text-slate-100'
                                    : 'text-gray-600 hover:bg-gray-50 lg:bg-white lg:border-gray-200 lg:hover:bg-gray-50 lg:hover:border-gray-300 lg:hover:text-gray-800'
                                }`}
                            >
                                <AppIcon name={themeIcon[theme]} mode={iconMode} className="text-current text-sm sm:text-base" />
                                <span className="hidden lg:inline">主题</span>
                            </button>
                            {themeOpen && (
                                <div className={`absolute right-0 top-full mt-2 z-50 min-w-[130px] overflow-hidden rounded-2xl border-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
                                    isDark
                                    ? 'bg-slate-800 border-slate-700'
                                    : 'bg-white border-gray-200'
                                }`}>
                                    {(['light', 'dark', 'system'] as const).map(t => (
                                        <button
                                            type="button"
                                            key={t}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                changeTheme(t);
                                            }}
                                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                                                isDark
                                                ? `hover:bg-slate-700 ${theme === t ? 'text-slate-100 font-extrabold' : 'text-slate-300'}`
                                                : `hover:bg-gray-50 ${theme === t ? 'text-gray-900 font-extrabold' : 'text-gray-600'}`
                                            }`}
                                        >
                                            <AppIcon name={themeIcon[t]} mode={iconMode} className="text-current text-base" />
                                            {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '系统'}
                                            {theme === t && <span className="ml-auto">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 分享按钮 */}
                        <button
                            type="button"
                            onClick={handleShare}
                            disabled={sharing}
                            className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 text-xs font-bold sm:gap-2 sm:px-4 sm:py-2 sm:text-sm px-3 py-1.5 lg:rounded-2xl lg:border-2 lg:border-b-4 ${
                                isDark
                                ? 'text-slate-200 hover:bg-slate-700 lg:bg-slate-800 lg:border-slate-700 lg:hover:bg-slate-700 lg:hover:border-slate-600 lg:hover:text-slate-100'
                                : 'text-gray-600 hover:bg-gray-50 lg:bg-white lg:border-gray-200 lg:hover:bg-gray-50 lg:hover:border-gray-300 lg:hover:text-gray-800'
                            }`}
                            >
                            <AppIcon name="camera" mode={iconMode} className={`text-current text-sm sm:text-base ${sharing ? 'animate-spin' : ''}`} />
                            <span className="hidden lg:inline">{sharing ? '截图中' : '分享'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleIconMode}
                            className={`flex items-center gap-1.5 transition-colors text-xs font-bold sm:gap-2 sm:px-4 sm:py-2 sm:text-sm px-3 py-1.5 lg:rounded-2xl lg:border-2 lg:border-b-4 ${
                                isDark
                                ? 'text-slate-200 hover:bg-slate-700 lg:bg-slate-800 lg:border-slate-700 lg:hover:bg-slate-700 lg:hover:border-slate-600 lg:hover:text-slate-100'
                                : 'text-gray-600 hover:bg-gray-50 lg:bg-white lg:border-gray-200 lg:hover:bg-gray-50 lg:hover:border-gray-300 lg:hover:text-gray-800'
                            }`}
                            aria-pressed={iconMode === 'svg'}
                            aria-label={iconMode === 'svg' ? '恢复 emoji 图标' : '切换为 SVG 图标'}
                        >
                            <AppIcon name="shapes" mode={iconMode} className="text-current text-sm sm:text-base" />
                            <span className="hidden lg:inline w-[2rem] text-center">图标</span>
                        </button>

                        {/* 刷新按钮 */}
                        <button
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className={`flex items-center justify-center gap-1 transition-colors disabled:opacity-60 text-xs font-bold sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-r-[14px] lg:rounded-2xl lg:border-2 lg:border-b-4 sm:min-w-[2.5rem] lg:min-w-[4.5rem] ${
                                isDark
                                ? 'text-slate-200 hover:bg-slate-700 lg:bg-slate-800 lg:border-slate-700 lg:hover:bg-slate-700 lg:hover:border-slate-600 lg:hover:text-slate-100'
                                : 'text-gray-600 hover:bg-gray-50 lg:bg-white lg:border-gray-200 lg:hover:bg-gray-50 lg:hover:border-gray-300 lg:hover:text-gray-800'
                            }`}
                        >
                            {refreshing ? (
                                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-[#58cc02] rounded-full animate-spin sm:w-4 sm:h-4" />
                            ) : (
                                <AppIcon name="refresh" mode={iconMode} className="text-current text-sm sm:text-base" />
                            )}
                            <span className="hidden lg:inline">刷新</span>
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
};
