import { memo, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface YearlyTimeChartProps {
  data: Array<{ date: string; xp: number; time?: number }>;
  compareData?: Array<{ date: string; xp: number; time?: number }> | null;
  isDark?: boolean;
  isPrinting?: boolean;
  user1Label?: string;
  user2Label?: string;
}

interface YearTimeData {
  date: string;
  time1: number;
  time2?: number;
}

function formatMinutes(totalTime: number): string {
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
}

function YearlyTimeChart({
  data,
  compareData,
  isDark: isDarkProp,
  isPrinting = false,
  user1Label,
  user2Label,
}: YearlyTimeChartProps) {
  const yearlyData = useMemo<YearTimeData[]>(() => {
    const yearMap1 = new Map<string, number>();
    const yearMap2 = new Map<string, number>();

    data.forEach((item) => {
      const year = item.date.substring(0, 4);
      yearMap1.set(year, (yearMap1.get(year) || 0) + (item.time || 0));
    });

    if (compareData) {
      compareData.forEach((item) => {
        const year = item.date.substring(0, 4);
        yearMap2.set(year, (yearMap2.get(year) || 0) + (item.time || 0));
      });
    }

    const uniqueYears = Array.from(new Set([...yearMap1.keys(), ...yearMap2.keys()])).sort();

    return uniqueYears.map((year) => ({
      date: year,
      time1: yearMap1.get(year) || 0,
      time2: compareData ? (yearMap2.get(year) || 0) : undefined,
    }));
  }, [data, compareData]);

  const totalTime1 = useMemo(() => {
    return yearlyData.reduce((sum, item) => sum + item.time1, 0);
  }, [yearlyData]);

  const totalTime2 = useMemo(() => {
    return yearlyData.reduce((sum, item) => sum + (item.time2 || 0), 0);
  }, [yearlyData]);

  const isDark = isDarkProp ?? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');

  if (yearlyData.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] w-full items-center justify-center text-gray-400">
        暂无时间数据
      </div>
    );
  }

  const themeColor1 = '#ff9600';
  const themeColor2 = '#1cb0f6';

  return (
    <div className="chart-shell flex h-full min-h-[220px] w-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={yearlyData} margin={{ top: 14, right: 10, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="yearlyTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor1} stopOpacity={0.25} />
                <stop offset="95%" stopColor={themeColor1} stopOpacity={0.02} />
              </linearGradient>
              {compareData && (
                <linearGradient id="yearlyTimeGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor2} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={themeColor2} stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#334155' : '#f0f0f0'}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#94a3b8' : '#9ca3af', fontSize: 10 }}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#94a3b8' : '#9ca3af', fontSize: 10 }}
              width={40}
              domain={[0, 'auto']}
              tickFormatter={(value) => (value >= 60 ? `${Math.floor(value / 60)}h` : value)}
            />
            <Tooltip
              formatter={(value, name) => {
                const displayName = name === 'time1' ? (user1Label || '用户1') : (user2Label || '用户2');
                return [`${value} 分钟`, displayName];
              }}
              contentStyle={{
                borderRadius: '12px',
                border: isDark ? '1px solid #334155' : 'none',
                boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#111827',
              }}
              labelStyle={{ color: isDark ? '#cbd5e1' : '#374151' }}
              itemStyle={{ color: isDark ? '#e2e8f0' : '#111827' }}
            />
            <Area
              type="monotone"
              dataKey="time1"
              name="time1"
              stroke={themeColor1}
              strokeWidth={2.5}
              fill="url(#yearlyTimeGradient)"
              dot={false}
              activeDot={{ r: 4, fill: themeColor1, strokeWidth: 0 }}
              isAnimationActive={!isPrinting}
              animationDuration={isPrinting ? 0 : 1500}
            />
            {compareData && (
              <Area
                type="monotone"
                dataKey="time2"
                name="time2"
                stroke={themeColor2}
                strokeWidth={2.5}
                fill="url(#yearlyTimeGradient2)"
                dot={false}
                activeDot={{ r: 4, fill: themeColor2, strokeWidth: 0 }}
                isAnimationActive={!isPrinting}
                animationDuration={isPrinting ? 0 : 1500}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {compareData ? (
        <div className="flex justify-around pt-1 text-xs text-gray-400">
          <div>
            {user1Label}: <span className="font-bold" style={{ color: themeColor1 }}>{formatMinutes(totalTime1)}</span>
          </div>
          <div>
            {user2Label}: <span className="font-bold" style={{ color: themeColor2 }}>{formatMinutes(totalTime2)}</span>
          </div>
        </div>
      ) : (
        <div className="pt-1 text-center text-xs text-gray-400">
          累计学习 <span className="font-bold font-sans" style={{ color: themeColor1 }}>{formatMinutes(totalTime1)}</span>
        </div>
      )}
    </div>
  );
}

export default memo(YearlyTimeChart);
