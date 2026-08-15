import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MonthlyChartProps {
  data: Array<{ date: string; xp: number; time?: number }>;
  compareData?: Array<{ date: string; xp: number; time?: number }> | null;
  selectedYear?: string;
  viewMode?: 'year' | 'rolling12';
  metric?: 'xp' | 'time';
  isDark?: boolean;
  isPrinting?: boolean;
  user1Label?: string;
  user2Label?: string;
}

interface MonthlyChartPoint {
  date: string;
  axisLabel: string;
  value: number;
  value2?: number;
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function formatRollingMonthLabel(date: Date): string {
  return `${String(date.getFullYear()).slice(-2)}/${date.getMonth() + 1}`;
}

function formatRollingMonthLabelForNarrowScreen(value: string): string {
  const month = value.split('/')[1];
  return month ? `${month}月` : value;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
}

const getHorizontalCoordinates = ({ yAxis }: any) => {
  if (!yAxis) return [];
  const ticks = yAxis.ticks || yAxis.niceTicks;
  if (Array.isArray(ticks)) {
    return ticks.map((entry: any) => {
      if (entry && typeof entry.coordinate === 'number') {
        return entry.coordinate;
      }
      const val = typeof entry === 'object' && entry !== null && 'value' in entry ? entry.value : entry;
      if (typeof yAxis.scale?.map === 'function') {
        return yAxis.scale.map(val);
      }
      if (typeof yAxis.scale === 'function') {
        return yAxis.scale(val);
      }
      return null;
    }).filter((c: any) => typeof c === 'number' && !isNaN(c));
  }
  return [];
};

function MonthlyChart({
  data,
  compareData,
  selectedYear,
  viewMode = 'year',
  metric = 'xp',
  isDark: isDarkProp,
  isPrinting = false,
  user1Label,
  user2Label,
}: MonthlyChartProps) {
  const isDark = isDarkProp ?? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const isExtraNarrowScreen = chartWidth > 0 && chartWidth <= 425;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setChartWidth(Math.round(entry.contentRect.width));
    });

    observer.observe(container);
    setChartWidth(Math.round(container.getBoundingClientRect().width));

    return () => observer.disconnect();
  }, []);

  const chartData = useMemo<MonthlyChartPoint[]>(() => {
    const valueKey = metric === 'time' ? 'time' : 'xp';

    if (viewMode === 'rolling12') {
      const monthlyValues1 = new Map<string, number>();
      const monthlyValues2 = new Map<string, number>();
      const today = new Date();

      for (let i = 11; i >= 0; i -= 1) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyValues1.set(monthKey, 0);
        monthlyValues2.set(monthKey, 0);
      }

      data.forEach((item) => {
        const monthKey = item.date.slice(0, 7);
        if (monthlyValues1.has(monthKey)) {
          monthlyValues1.set(monthKey, (monthlyValues1.get(monthKey) || 0) + (item[valueKey] || 0));
        }
      });

      if (compareData) {
        compareData.forEach((item) => {
          const monthKey = item.date.slice(0, 7);
          if (monthlyValues2.has(monthKey)) {
            monthlyValues2.set(monthKey, (monthlyValues2.get(monthKey) || 0) + (item[valueKey] || 0));
          }
        });
      }

      return Array.from(monthlyValues1.entries()).map(([monthKey, value]) => {
        const [year, month] = monthKey.split('-');
        const fullLabel = formatRollingMonthLabel(new Date(Number(year), Number(month) - 1, 1));

        return {
          date: fullLabel,
          axisLabel: isExtraNarrowScreen ? formatRollingMonthLabelForNarrowScreen(fullLabel) : fullLabel,
          value,
          value2: monthlyValues2.get(monthKey) || 0,
        };
      });
    }

    const year = selectedYear || new Date().getFullYear().toString();
    const monthlyValues1 = new Array<number>(12).fill(0);
    const monthlyValues2 = new Array<number>(12).fill(0);

    data.forEach((item) => {
      if (!item.date.startsWith(year)) return;
      const month = Number(item.date.slice(5, 7));
      if (month >= 1 && month <= 12) {
        monthlyValues1[month - 1] += item[valueKey] || 0;
      }
    });

    if (compareData) {
      compareData.forEach((item) => {
        if (!item.date.startsWith(year)) return;
        const month = Number(item.date.slice(5, 7));
        if (month >= 1 && month <= 12) {
          monthlyValues2[month - 1] += item[valueKey] || 0;
        }
      });
    }

    return MONTH_LABELS.map((label, index) => ({
      date: label,
      axisLabel: label,
      value: monthlyValues1[index],
      value2: monthlyValues2[index],
    }));
  }, [data, compareData, isExtraNarrowScreen, metric, selectedYear, viewMode]);

  const totalValue1 = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const totalValue2 = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value2 || 0), 0);
  }, [chartData]);

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] w-full items-center justify-center text-gray-400">
        暂无月度数据
      </div>
    );
  }

  const themeColor1 = metric === 'time' ? '#1cb0f6' : '#58cc02';
  const themeColor2 = metric === 'time' ? '#ff9600' : '#ce82ff';
  
  const gradientId1 = metric === 'time' ? 'monthTimeGradient' : 'monthXpGradient';
  const gradientId2 = metric === 'time' ? 'monthTimeGradient2' : 'monthXpGradient2';

  const footerValue1 = metric === 'time' ? formatMinutes(totalValue1) : `${totalValue1.toLocaleString()} XP`;
  const footerValue2 = metric === 'time' ? formatMinutes(totalValue2) : `${totalValue2.toLocaleString()} XP`;

  return (
    <div ref={containerRef} className="chart-shell flex w-full flex-col gap-2">
      <div className="w-full">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 14, right: 10, bottom: 5, left: -8 }}>
            <defs>
              <linearGradient id={gradientId1} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor1} stopOpacity={0.25} />
                <stop offset="95%" stopColor={themeColor1} stopOpacity={0.02} />
              </linearGradient>
              {compareData && (
                <linearGradient id={gradientId2} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor2} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={themeColor2} stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#334155' : '#f0f0f0'}
              horizontalCoordinatesGenerator={getHorizontalCoordinates}
            />
            <XAxis
              dataKey="axisLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#94a3b8' : '#9ca3af', fontSize: 10 }}
              interval={0}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#94a3b8' : '#9ca3af', fontSize: 10 }}
              width={45}
              domain={[0, 'auto']}
              tickFormatter={(value) => {
                if (metric === 'time') return value >= 60 ? `${Math.floor(value / 60)}h` : value;
                return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;
              }}
            />
            <Tooltip
              itemSorter={(item: any) => -(Number(item.value) || 0)}
              cursor={{ stroke: themeColor1, strokeWidth: 1, strokeDasharray: '4 4' }}
              labelFormatter={(_, payload) => {
                const entry = payload?.[0]?.payload as MonthlyChartPoint | undefined;
                return entry?.date || '';
              }}
              formatter={(value, name) => {
                const displayName = name === 'value' ? (user1Label || '用户1') : (user2Label || '用户2');
                return [
                  `${Number(value ?? 0).toLocaleString()} ${metric === 'time' ? '分钟' : 'XP'}`,
                  displayName,
                ];
              }}
              contentStyle={{
                borderRadius: 12,
                border: isDark ? '1px solid #334155' : 'none',
                boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                fontSize: 12,
                color: isDark ? '#e2e8f0' : '#111827',
              }}
              labelStyle={{ color: isDark ? '#cbd5e1' : '#374151' }}
              itemStyle={{ color: isDark ? '#e2e8f0' : '#111827' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="value"
              stroke={themeColor1}
              strokeWidth={2.5}
              fill={`url(#${gradientId1})`}
              dot={false}
              activeDot={{ r: 4, fill: themeColor1, strokeWidth: 0 }}
              isAnimationActive={!isPrinting}
              animationDuration={isPrinting ? 0 : 1500}
            />
            {compareData && (
              <Area
                type="monotone"
                dataKey="value2"
                name="value2"
                stroke={themeColor2}
                strokeWidth={2.5}
                fill={`url(#${gradientId2})`}
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
            {user1Label}: <span className="font-bold" style={{ color: themeColor1 }}>{footerValue1}</span>
          </div>
          <div>
            {user2Label}: <span className="font-bold" style={{ color: themeColor2 }}>{footerValue2}</span>
          </div>
        </div>
      ) : (
        <div className="pt-1 text-center text-xs text-gray-400">
          {metric === 'time' ? '本月度共学习 ' : '本月度共获得 '}
          <span className="font-bold font-sans" style={{ color: themeColor1 }}>
            {footerValue1}
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(MonthlyChart);
