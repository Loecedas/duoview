import React, { useEffect, useState } from 'react';

export default function LandingHero() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

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
    }, [resolvedTheme]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;
        setLoading(true);
        window.location.href = `/dashboard?user=${encodeURIComponent(trimmed)}`;
    }

    const examples = ['duolingo', 'KartikTalwar'];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" data-theme={resolvedTheme}>
            {/* Logo / Brand */}
            <div className="mb-10 animate-fade-in-up text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                    <span className="text-4xl">🦜</span>
                    <span className="text-4xl font-black text-[#58cc02] tracking-tight">DuoView</span>
                </div>
                <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase">多邻国学习数据查看器</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md animate-fade-in-up delay-1">
                <div className="bg-white rounded-3xl shadow-lg border-2 border-b-4 border-gray-200 p-8">
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">
                        查看任意用户的学习数据
                    </h1>
                    <p className="text-gray-500 text-sm text-center mb-8">
                        无需登录 · 输入用户名 · 秒速生成仪表盘
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                多邻国用户名 / ID
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoFocus
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="输入用户名…"
                                className="w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 border-gray-200 focus:border-[#1cb0f6] outline-none text-gray-800 font-bold text-base transition-colors placeholder:text-gray-400 placeholder:font-normal"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!username.trim() || loading}
                            className="w-full py-3.5 rounded-2xl border-2 border-b-4 border-[#1cb0f6] bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> 正在跳转…
                                </>
                            ) : (
                                <>🔍 查看学习数据 →</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Examples */}
            <div className="mt-6 animate-fade-in-up delay-2 text-center">
                <span className="text-gray-400 text-sm">试试这些用户：</span>
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
            <footer className="mt-16 animate-fade-in-up delay-3 text-center text-xs text-gray-400">
                DuoView 是非官方工具，与 Duolingo 公司无关 · 数据来自公开的多邻国 API
            </footer>
        </div>
    );
}
