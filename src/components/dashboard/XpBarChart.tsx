import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { UserData } from '../../types';
import { AppIcon } from '../AppIcon';
import type { IconMode } from '../useIconMode';

interface Props { userData: UserData; seq?: number; theme?: 'light' | 'dark'; isPrinting?: boolean; iconMode: IconMode; }

function formatMinutes(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m}分钟`;
    if (m === 0) return `${h}小时`;
    return `${h}小时${m}分钟`;
}

function SingleAreaChart({
    data,
    dataKey,
    title,
    color,
    gradientId,
    footerLabel,
    footerValue,
    unit,
    refValue,
    isDark,
    isPrinting,
}: {
    data: Record<string, unknown>[];
    dataKey: string;
    title: React.ReactNode;
    color: string;
    gradientId: string;
    footerLabel: string;
    footerValue: string;
    unit: string;
    refValue?: number;
    isDark: boolean;
    isPrinting?: boolean;
}) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
            <h2 className="flex min-h-6 items-center text-base font-bold leading-none text-gray-800">{title}</h2>
            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    {refValue !== undefined && refValue > 0 && (
                        <ReferenceLine
                            y={refValue}
                            stroke={color}
                            strokeDasharray="4 4"
                            strokeOpacity={0.5}
                        />
                    )}
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: isDark ? '1px solid #334155' : 'none',
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: 12,
                            color: isDark ? '#e2e8f0' : '#111827',
                        }}
                        labelStyle={{ color: isDark ? '#cbd5e1' : '#374151' }}
                        itemStyle={{ color: isDark ? '#e2e8f0' : '#111827' }}
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(v: number | string | undefined) => [`${v ?? 0} ${unit}`, '']}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                        isAnimationActive={!isPrinting}
                        animationDuration={isPrinting ? 0 : 1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-gray-400">
                {footerLabel}{' '}
                <span className="font-bold" style={{ color }}>{footerValue}</span>
            </p>
        </div>
    );
}

function ChartTitle({
    icon,
    iconMode,
    children,
}: {
    icon: 'bolt' | 'clock';
    iconMode: IconMode;
    children: React.ReactNode;
}) {
    return (
        <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap leading-none">
            <AppIcon name={icon} mode={iconMode} className="text-[1.05em]" />
            {children}
        </span>
    );
}

export function XpBarChart({ userData, theme = 'light', isPrinting = false, iconMode }: Props) {
    const xpData = (userData.dailyXpHistory?.slice(-7) ?? []) as Record<string, unknown>[];
    const timeData = (userData.dailyTimeHistory?.slice(-7) ?? []) as Record<string, unknown>[];
    const isDark = theme === 'dark';

    const weeklyXp = xpData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.xp as number) || 0), 0);

    const weeklyMinutes = timeData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.time as number) || 0), 0);

    const nonZeroDays = xpData.filter((d) => !d.isFuture && ((d.xp as number) || 0) > 0).length;
    const avgXp = nonZeroDays > 0 ? Math.round(weeklyXp / nonZeroDays) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SingleAreaChart
                data={xpData}
                dataKey="xp"
                title={<ChartTitle icon="bolt" iconMode={iconMode}>最近 7 天经验</ChartTitle>}
                color="#58cc02"
                gradientId="xpGradient"
                footerLabel="本周共获得"
                footerValue={`${weeklyXp.toLocaleString()} XP`}
                unit="XP"
                isDark={isDark}
                isPrinting={isPrinting}
            />
            {timeData.length > 0 ? (
                <SingleAreaChart
                    data={timeData}
                    dataKey="time"
                    title={<ChartTitle icon="clock" iconMode={iconMode}>最近 7 天学习时间</ChartTitle>}
                    color="#1cb0f6"
                    gradientId="timeGradient"
                    footerLabel="本周学习"
                    footerValue={formatMinutes(weeklyMinutes)}
                    unit="分钟"
                    isDark={isDark}
                    isPrinting={isPrinting}
                />
            ) : (
                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">暂无学习时间数据</p>
                </div>
            )}
        </div>
    );
}
