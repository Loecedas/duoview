import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DuoColors } from '../../styles/duolingoColors';
import type { UserData } from '../../types';

interface Props {
  userData: UserData;
  forceViewMode?: ViewMode;
}

type ViewMode = 'quarter' | 'half' | 'year';
type TooltipAlignment = 'center' | 'left' | 'right';

interface TooltipInfo {
  date: string;
  xp: number;
  time?: number;
  x: number;
  y: number;
  showBelow: boolean;
  alignment: TooltipAlignment;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function toLocalDateStr(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Shanghai'
    }).format(d);
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function getColor(xp: number, maxXp: number): string {
  if (xp < 0) return 'transparent';
  if (xp === 0) return '#EBEDF0';
  const intensity = Math.min(xp / maxXp, 1);
  if (intensity < 0.25) return '#9BE9A8';
  if (intensity < 0.5) return '#40C463';
  if (intensity < 0.75) return DuoColors.featherGreen;
  return '#216E39';
}

export function HeatmapChart({ userData, forceViewMode }: Props): React.ReactElement {
  const data = userData.yearlyXpHistory || [];
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((now.getMonth() + 1) / 3));
  const [selectedHalf, setSelectedHalf] = useState<number>(now.getMonth() < 6 ? 1 : 2);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(forceViewMode || 'year');
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 切换视图参数时清除 Tooltip，防止其“卡”在旧位置
  useEffect(() => {
    setTooltip(null);
  }, [selectedYear, selectedQuarter, selectedHalf, viewMode]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function checkScreenSize(): void {
      const width = window.innerWidth;
      if (width < 640) {
        setViewMode('quarter');
      } else if (width < 1200) {
        setViewMode('half');
      } else {
        setViewMode('year');
      }
    }

    function debouncedCheck(): void {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScreenSize, 150);
    }

    if (forceViewMode) return undefined;

    checkScreenSize();
    window.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, [forceViewMode]);

  useEffect(() => {
    if (!tooltip) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.heatmap-cell')) return;
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tooltip]);

  const { xpMap, timeMap, sortedYears } = useMemo(() => {
    const xpM = new Map<string, number>();
    const timeM = new Map<string, number | undefined>();
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();

    for (const d of data) {
      if (!d.date) continue;
      xpM.set(d.date, d.xp);
      timeM.set(d.date, d.time);
      const yearStr = d.date.split('-')[0];
      const year = parseInt(yearStr);
      if (!isNaN(year) && year > 2010 && year <= currentYear) {
        yearsSet.add(year);
      }
    }

    const sorted = Array.from(yearsSet).sort((a, b) => b - a);
    if (sorted.length === 0) sorted.push(currentYear);

    return { xpMap: xpM, timeMap: timeM, sortedYears: sorted };
  }, [data]);

  const { allDates, weeks, monthLabels, maxXp } = useMemo(() => {
    const startMonth = viewMode === 'quarter'
      ? (selectedQuarter - 1) * 3
      : viewMode === 'half'
        ? (selectedHalf - 1) * 6
        : 0;
    const monthCount = viewMode === 'quarter' ? 3 : viewMode === 'half' ? 6 : 12;
    const startDate = new Date(selectedYear, startMonth, 1);
    const endDate = new Date(selectedYear, startMonth + monthCount, 0);

    const dates: { date: Date; xp: number; time?: number; dateStr: string }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toLocalDateStr(current);
      dates.push({
        date: new Date(current),
        xp: xpMap.get(dateStr) || 0,
        time: timeMap.get(dateStr),
        dateStr
      });
      current.setDate(current.getDate() + 1);
    }

    const max = Math.max(...dates.map(d => d.xp), 50);

    const weeksArr: typeof dates[] = [];
    let currentWeek: typeof dates = [];
    const firstDayOfWeek = dates[0]?.date.getDay() || 0;

    for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
    }

    for (const d of dates) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
      }
      weeksArr.push(currentWeek);
    }

    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, weekIndex) => {
      const validDay = week.find(d => d.xp >= 0);
      if (validDay && validDay.date.getTime() > 0) {
        const month = validDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    const targetWeeks = viewMode === 'quarter' ? 14 : viewMode === 'half' ? 28 : 54;
    while (weeksArr.length < targetWeeks) {
      const emptyWeek: typeof dates = [];
      for (let i = 0; i < 7; i++) {
        emptyWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
      }
      weeksArr.push(emptyWeek);
    }

    return { allDates: dates, weeks: weeksArr, monthLabels: labels, maxXp: max };
  }, [selectedYear, selectedQuarter, selectedHalf, viewMode, xpMap, timeMap]);

  const viewXp = allDates.reduce((sum, d) => sum + (d.xp > 0 ? d.xp : 0), 0);
  const activeDays = allDates.filter(d => d.xp > 0).length;

  const updateTooltipPosition = useCallback((dateStr: string, xp: number, time?: number) => {
    const cellEl = document.querySelector(
      `[data-heatmap-date="${dateStr}"]`
    ) as HTMLElement | null;

    if (!cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    const showBelow = rect.top < 120;
    const x = rect.left + rect.width / 2;
    const y = showBelow ? rect.bottom + 10 : rect.top - 10;

    let alignment: TooltipAlignment = 'center';
    if (x < 100) alignment = 'left';
    else if (x > window.innerWidth - 100) alignment = 'right';

    setTooltip({ date: dateStr, xp, time, x, y, showBelow, alignment });
  }, []);

  useEffect(() => {
    if (!tooltip) return;
    const currentTooltip = tooltip;

    function handleViewportChange() {
      updateTooltipPosition(currentTooltip.date, currentTooltip.xp, currentTooltip.time);
    }

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [tooltip, updateTooltipPosition]);

  function handleDayClick(day: typeof allDates[0], e: React.MouseEvent<HTMLDivElement>): void {
    if (day.xp < 0 || !day.dateStr) return;

    updateTooltipPosition(day.dateStr, day.xp, day.time);
  }

  // 导航到前一天或后一天
  function navigateDay(direction: -1 | 1): void {
    if (!tooltip) return;

    const currentDate = new Date(tooltip.date);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDateStr = toLocalDateStr(currentDate);

    // 查找新日期的数据
    const dayData = allDates.find(d => d.dateStr === newDateStr);
    if (!dayData) return;

    const cellEl = document.querySelector(
      `[data-heatmap-date="${newDateStr}"]`
    ) as HTMLElement | null;

    if (!cellEl) {
      setTooltip({
        date: newDateStr,
        xp: dayData.xp,
        time: dayData.time,
        x: tooltip.x,
        y: tooltip.y,
        showBelow: tooltip.showBelow,
        alignment: tooltip.alignment
      });
      return;
    }

    updateTooltipPosition(newDateStr, dayData.xp, dayData.time);
  }

  // 检查是否可以选择前一天/后一天
  function canNavigate(direction: -1 | 1): boolean {
    if (!tooltip) return false;

    const currentDate = new Date(tooltip.date);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDateStr = toLocalDateStr(currentDate);

    return allDates.some(d => d.dateStr === newDateStr);
  }

  function getTooltipTransform(): string {
    if (!tooltip) return '';
    const { showBelow, alignment } = tooltip;
    const xOffset = alignment === 'left' ? '-20%' : alignment === 'right' ? '-80%' : '-50%';
    const yOffset = showBelow ? '0' : '-100%';
    return `translate(${xOffset}, ${yOffset})`;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-b-4 border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-gray-700 font-bold text-xl">📅 年度学习热力图</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {sortedYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${year === selectedYear
                ? 'bg-[#58cc02] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {year}
            </button>
          ))}
        </div>

        {viewMode === 'quarter' && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${q === selectedQuarter
                  ? 'bg-[#1cb0f6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'half' && (
          <div className="flex items-center gap-1">
            {[1, 2].map(h => (
              <button
                key={h}
                onClick={() => setSelectedHalf(h)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${h === selectedHalf
                  ? 'bg-[#1cb0f6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {h === 1 ? '上半年' : '下半年'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full pb-2">
        <div className="relative w-full">
          {/* 月份标签 */}
          <div className="flex ml-4 mb-1 text-xs text-gray-600 h-4 relative w-full">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="absolute whitespace-nowrap"
                style={{ left: `${(label.weekIndex / weeks.length) * 100}%` }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* 使用 grid 统一布局 */}
          <div
            className="grid gap-[1px] lg:gap-[2px] relative w-full p-1"
            style={{
              gridTemplateColumns: `16px repeat(${weeks.length}, minmax(12px, 1fr))`,
              minWidth: `${Math.max(320, weeks.length * 14 + 28)}px`,
            }}
          >
            {WEEKDAYS.map((label, idx) => (
              <div
                key={`label-${idx}`}
                className="text-[10px] text-gray-500 flex items-center justify-center"
                style={{ gridColumn: 1, gridRow: idx + 1 }}
              >
                {idx % 2 === 1 ? label : ''}
              </div>
            ))}

            {weeks.map((week, weekIdx) => (
              week.map((day, dayIdx) => {
                const isValidDay = day.xp >= 0 && day.dateStr;
                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`heatmap-cell w-full rounded-sm transition-all ${isValidDay ? 'cursor-pointer hover:ring-2 hover:ring-[#58cc02]' : ''} ${tooltip?.date === day.dateStr ? 'ring-2 ring-[#1cb0f6] ring-offset-1 z-10 relative' : ''}`}
                    data-heatmap-date={day.dateStr || undefined}
                    style={{
                      backgroundColor: getColor(day.xp, maxXp),
                      gridColumn: weekIdx + 2,
                      gridRow: dayIdx + 1,
                      paddingBottom: '100%',
                    }}
                    onClick={(e) => handleDayClick(day, e)}
                  />
                );
              })
            ))}
          </div>

          {/* Tooltip with navigation */}
          {tooltip && typeof document !== 'undefined' && createPortal(
            <>
              <div
                ref={tooltipRef}
                className="fixed z-[9999] bg-white text-gray-700 rounded-xl shadow-xl border border-gray-200 p-3 w-[180px]"
                style={{
                  left: `${tooltip.x}px`,
                  top: tooltip.showBelow ? `${tooltip.y}px` : `${tooltip.y}px`,
                  transform: getTooltipTransform()
                }}
              >
                <button
                  onClick={() => setTooltip(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] transition-colors shadow-sm"
                >
                  ✕
                </button>

                <div className="flex items-center justify-between gap-1 mb-2">
                  <button
                    onClick={() => navigateDay(-1)}
                    disabled={!canNavigate(-1)}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs transition-colors"
                  >
                    ←
                  </button>
                  <div className="text-center overflow-hidden flex-1 px-1">
                    <div className="font-bold text-xs truncate leading-tight">{tooltip.date}</div>
                    <div className="text-[10px] text-gray-500 truncate leading-tight">
                      {(() => {
                        const d = new Date(tooltip.date + 'T12:00:00');
                        return isNaN(d.getTime()) ? '未知' : d.toLocaleDateString('zh-CN', { weekday: 'long' });
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => navigateDay(1)}
                    disabled={!canNavigate(1)}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs transition-colors"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-gray-50 rounded-lg py-2 px-1 text-center flex flex-col justify-center min-w-0">
                    <div className="text-base font-bold text-[#58cc02] truncate">{tooltip.xp}</div>
                    <div className="text-[10px] text-gray-500">XP</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2 px-1 text-center flex flex-col justify-center min-w-0">
                    <div className="text-base font-bold text-[#1cb0f6] truncate">
                      {tooltip.time && tooltip.time > 0 ? tooltip.time : 0}
                    </div>
                    <div className="text-[10px] text-gray-500">分钟</div>
                  </div>
                </div>

                <div
                  className={`absolute w-0 h-0 border-l-[6px] border-r-[6px] border-transparent ${tooltip.showBelow
                    ? 'top-[-6px] border-b-[6px] border-b-white'
                    : 'bottom-[-6px] border-t-[6px] border-t-white'
                    }`}
                  style={{
                    left: tooltip.alignment === 'left' ? '20%' : tooltip.alignment === 'right' ? '80%' : '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </>,
            document.body
          )}

          {/* 图例 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-1 sm:gap-0">
            <div className="text-xs text-gray-500">
              {selectedYear}
              {viewMode === 'quarter' && ` Q${selectedQuarter}`}
              {viewMode === 'half' && ` ${selectedHalf === 1 ? '上半年' : '下半年'}`}
              {viewMode === 'year' && ' 年'}
              学习 <span style={{ color: DuoColors.featherGreen }} className="font-bold">{activeDays}</span> 天，
              获得 <span style={{ color: DuoColors.beeYellow }} className="font-bold">{viewXp.toLocaleString()}</span> XP
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>少</span>
              {['#EBEDF0', '#9BE9A8', '#40C463', DuoColors.featherGreen, '#216E39'].map((color, i) => (
                <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: color }} />
              ))}
              <span>多</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
