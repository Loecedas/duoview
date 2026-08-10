import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { UserData } from '../../types';
import { AppIcon } from '../AppIcon';
import type { IconMode } from '../useIconMode';

interface Props {
    userData: UserData;
    compareUserData?: UserData | null;
    seq?: number;
    theme?: 'light' | 'dark';
    isPrinting?: boolean;
    iconMode: IconMode;
    user1Label?: string;
    user2Label?: string;
}

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
    dataKey2,
    color2,
    label1,
    label2,
    footerValue2,
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
    dataKey2?: string;
    color2?: string;
    label1?: string;
    label2?: string;
    footerValue2?: string;
}) {
    return (
        <div className="chart-shell bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex flex-col gap-2">
            <h2 className="flex min-h-6 items-center text-base font-bold leading-none text-gray-800">{title}</h2>
            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                        {dataKey2 && color2 && (
                            <linearGradient id={`${gradientId}2`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color2} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={color2} stopOpacity={0.02} />
                            </linearGradient>
                        )}
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
                        formatter={(v: number | string | undefined, name: any) => {
                            const displayName = name === dataKey ? (label1 || '用户1') : (label2 || '用户2');
                            return [`${v ?? 0} ${unit}`, displayName];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        name={dataKey}
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                        isAnimationActive={!isPrinting}
                        animationDuration={isPrinting ? 0 : 1500}
                    />
                    {dataKey2 && color2 && (
                        <Area
                            type="monotone"
                            dataKey={dataKey2}
                            name={dataKey2}
                            stroke={color2}
                            strokeWidth={2.5}
                            fill={`url(#${gradientId}2)`}
                            dot={false}
                            activeDot={{ r: 4, fill: color2, strokeWidth: 0 }}
                            isAnimationActive={!isPrinting}
                            animationDuration={isPrinting ? 0 : 1500}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
            {dataKey2 ? (
                <div className="flex justify-around pt-1 text-xs text-gray-400">
                    <div>
                        {label1}: <span className="font-bold" style={{ color }}>{footerValue}</span>
                    </div>
                    <div>
                        {label2}: <span className="font-bold" style={{ color: color2 }}>{footerValue2}</span>
                    </div>
                </div>
            ) : (
                <p className="text-center text-xs text-gray-400">
                    {footerLabel}{' '}
                    <span className="font-bold" style={{ color }}>{footerValue}</span>
                </p>
            )}
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

export function XpBarChart({
    userData,
    compareUserData,
    theme = 'light',
    isPrinting = false,
    iconMode,
    user1Label,
    user2Label,
}: Props) {
    const isDark = theme === 'dark';

    const xpData = useMemo(() => {
        const u1History = userData.dailyXpHistory?.slice(-7) ?? [];
        if (!compareUserData) {
            return u1History.map(d => ({ ...d, xp1: d.xp }));
        }
        const u2History = compareUserData.dailyXpHistory?.slice(-7) ?? [];
        return u1History.map((d, index) => {
            const u2Day = u2History[index];
            return {
                date: d.date,
                xp1: (d.xp as number) || 0,
                xp2: (u2Day?.xp as number) || 0,
                isFuture: d.isFuture || u2Day?.isFuture
            };
        });
    }, [userData, compareUserData]);

    const timeData = useMemo(() => {
        const u1History = userData.dailyTimeHistory?.slice(-7) ?? [];
        if (!compareUserData) {
            return u1History.map(d => ({ ...d, time1: d.time }));
        }
        const u2History = compareUserData.dailyTimeHistory?.slice(-7) ?? [];
        return u1History.map((d, index) => {
            const u2Day = u2History[index];
            return {
                date: d.date,
                time1: (d.time as number) || 0,
                time2: (u2Day?.time as number) || 0,
                isFuture: d.isFuture || u2Day?.isFuture
            };
        });
    }, [userData, compareUserData]);

    const weeklyXp1 = xpData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.xp1 as number) || 0), 0);

    const weeklyXp2 = compareUserData ? xpData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.xp2 as number) || 0), 0) : 0;

    const weeklyMinutes1 = timeData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.time1 as number) || 0), 0);

    const weeklyMinutes2 = compareUserData ? timeData
        .filter((d) => !d.isFuture)
        .reduce((s, d) => s + ((d.time2 as number) || 0), 0) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SingleAreaChart
                data={xpData}
                dataKey="xp1"
                title={<ChartTitle icon="bolt" iconMode={iconMode}>最近 7 天经验</ChartTitle>}
                color="#58cc02"
                gradientId="xpGradient"
                footerLabel="本周共获得"
                footerValue={`${weeklyXp1.toLocaleString()} XP`}
                unit="XP"
                isDark={isDark}
                isPrinting={isPrinting}
                dataKey2={compareUserData ? 'xp2' : undefined}
                color2="#ce82ff"
                label1={user1Label || '用户1'}
                label2={user2Label || '用户2'}
                footerValue2={`${weeklyXp2.toLocaleString()} XP`}
            />
            {timeData.length > 0 ? (
                <SingleAreaChart
                    data={timeData}
                    dataKey="time1"
                    title={<ChartTitle icon="clock" iconMode={iconMode}>最近 7 天学习时间</ChartTitle>}
                    color="#1cb0f6"
                    gradientId="timeGradient"
                    footerLabel="本周学习"
                    footerValue={formatMinutes(weeklyMinutes1)}
                    unit="分钟"
                    isDark={isDark}
                    isPrinting={isPrinting}
                    dataKey2={compareUserData ? 'time2' : undefined}
                    color2="#ff9600"
                    label1={user1Label || '用户1'}
                    label2={user2Label || '用户2'}
                    footerValue2={formatMinutes(weeklyMinutes2)}
                />
            ) : (
                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">暂无学习时间数据</p>
                </div>
            )}
        </div>
    );
}
