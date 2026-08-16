import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DuoColors } from '../../styles/duolingoColors';
import type { UserData } from '../../types';
import { AppIcon } from '../AppIcon';
import type { IconMode } from '../useIconMode';

interface Props {
  userData: UserData;
  iconMode: IconMode;
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

const QUARTER_BREAKPOINT = 560;
const HALF_BREAKPOINT = 1080;

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function toLocalDateStr(d: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(timeZone ? { timeZone } : {})
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

function getResponsiveViewMode(width: number): ViewMode {
  if (width < QUARTER_BREAKPOINT) return 'quarter';
  if (width < HALF_BREAKPOINT) return 'half';
  return 'year';
}

export function HeatmapChart({ userData, iconMode, forceViewMode }: Props): React.ReactElement {
  const data = userData.yearlyXpHistory || [];
  const userTimezone = userData.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarterNum = Math.ceil((now.getMonth() + 1) / 3);
  const currentHalfNum = now.getMonth() < 6 ? 1 : 2;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarterNum);
  const [selectedHalf, setSelectedHalf] = useState<number>(currentHalfNum);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(forceViewMode || 'year');
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const quarterSliderRef = useRef<HTMLDivElement>(null);
  const halfSliderRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isScrollingByClickRef = useRef(false);

  useEffect(() => {
    setTooltip(null);
  }, [selectedYear, selectedQuarter, selectedHalf, viewMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = (nextWidth?: number) => {
      const measuredWidth = nextWidth ?? container.getBoundingClientRect().width;
      setContainerWidth(measuredWidth || window.innerWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      const handleWindowResize = () => updateWidth();
      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      updateWidth(entry?.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (forceViewMode) {
      setViewMode(forceViewMode);
      return;
    }

    if (!containerWidth) return;

    const nextViewMode = getResponsiveViewMode(containerWidth);
    if (viewMode === nextViewMode) return;

    if (nextViewMode === 'quarter') {
      setSelectedQuarter(currentQuarterNum);
    }

    if (nextViewMode === 'half') {
      setSelectedHalf(currentHalfNum);
    }

    setViewMode(nextViewMode);
  }, [containerWidth, forceViewMode, viewMode, currentQuarterNum, currentHalfNum]);

  const isMobileSmallScreen = containerWidth > 0 && containerWidth < QUARTER_BREAKPOINT;
  const isTabletHalfScreen = containerWidth > 0 && containerWidth >= QUARTER_BREAKPOINT && containerWidth < HALF_BREAKPOINT;

  // 整理数据映射
  const { xpMap, timeMap, sortedYears } = useMemo(() => {
    const xpM = new Map<string, number>();
    const timeM = new Map<string, number | undefined>();
    const yearsSet = new Set<number>();

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
  }, [data, currentYear]);

  // 计算小屏幕（425/375）专用的四个季度滑动数据块
  const quartersData = useMemo(() => {
    return [1, 2, 3, 4].map(q => {
      const startMonth = (q - 1) * 3;
      const startDate = new Date(selectedYear, startMonth, 1);
      const endDate = new Date(selectedYear, startMonth + 3, 0);

      const dates: { date: Date; xp: number; time?: number; dateStr: string }[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = toLocalDateStr(current, userTimezone);
        dates.push({
          date: new Date(current),
          xp: xpMap.get(dateStr) || 0,
          time: timeMap.get(dateStr),
          dateStr
        });
        current.setDate(current.getDate() + 1);
      }

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

      while (weeksArr.length < 14) {
        const emptyWeek: typeof dates = [];
        for (let i = 0; i < 7; i++) {
          emptyWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
        }
        weeksArr.push(emptyWeek);
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

      const totalXp = dates.reduce((sum, d) => sum + (d.xp > 0 ? d.xp : 0), 0);
      const activeDays = dates.filter(d => d.xp > 0).length;

      return {
        quarter: q,
        title: `Q${q} 季度`,
        monthRange: `${startMonth + 1}月 - ${startMonth + 3}月`,
        dates,
        weeks: weeksArr,
        monthLabels: labels,
        totalXp,
        activeDays,
      };
    });
  }, [selectedYear, xpMap, timeMap, userTimezone]);

  // 计算中屏幕（560px-960px）专用的两个半年滑动数据块（H1: 1-6月，H2: 7-12月）
  const halvesData = useMemo(() => {
    return [1, 2].map(h => {
      const startMonth = (h - 1) * 6;
      const startDate = new Date(selectedYear, startMonth, 1);
      const endDate = new Date(selectedYear, startMonth + 6, 0);

      const dates: { date: Date; xp: number; time?: number; dateStr: string }[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = toLocalDateStr(current, userTimezone);
        dates.push({
          date: new Date(current),
          xp: xpMap.get(dateStr) || 0,
          time: timeMap.get(dateStr),
          dateStr
        });
        current.setDate(current.getDate() + 1);
      }

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

      while (weeksArr.length < 28) {
        const emptyWeek: typeof dates = [];
        for (let i = 0; i < 7; i++) {
          emptyWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
        }
        weeksArr.push(emptyWeek);
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

      const totalXp = dates.reduce((sum, d) => sum + (d.xp > 0 ? d.xp : 0), 0);
      const activeDays = dates.filter(d => d.xp > 0).length;

      return {
        half: h,
        title: h === 1 ? '上半年' : '下半年',
        monthRange: h === 1 ? '1月 - 6月' : '7月 - 12月',
        dates,
        weeks: weeksArr,
        monthLabels: labels,
        totalXp,
        activeDays,
      };
    });
  }, [selectedYear, xpMap, timeMap, userTimezone]);

  // 全年连续数据（用于大屏 PC 端 >=960px 展示）
  const fullYearData = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 12, 0);

    const dates: { date: Date; xp: number; time?: number; dateStr: string }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toLocalDateStr(current, userTimezone);
      dates.push({
        date: new Date(current),
        xp: xpMap.get(dateStr) || 0,
        time: timeMap.get(dateStr),
        dateStr
      });
      current.setDate(current.getDate() + 1);
    }

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

    const targetWeeks = 54;
    while (weeksArr.length < targetWeeks) {
      const emptyWeek: typeof dates = [];
      for (let i = 0; i < 7; i++) {
        emptyWeek.push({ date: new Date(0), xp: -1, time: undefined, dateStr: '' });
      }
      weeksArr.push(emptyWeek);
    }

    return { allDates: dates, weeks: weeksArr, monthLabels: labels };
  }, [selectedYear, xpMap, timeMap, userTimezone]);

  const allDates = useMemo(() => {
    if (isMobileSmallScreen) return quartersData.flatMap(q => q.dates);
    if (isTabletHalfScreen) return halvesData.flatMap(h => h.dates);
    return fullYearData.allDates;
  }, [isMobileSmallScreen, isTabletHalfScreen, quartersData, halvesData, fullYearData]);

  const maxXp = useMemo(() => {
    return Math.max(...allDates.map(d => d.xp), 50);
  }, [allDates]);

  const viewXp = useMemo(() => {
    return allDates.reduce((sum, d) => sum + (d.xp > 0 ? d.xp : 0), 0);
  }, [allDates]);

  const activeDays = useMemo(() => {
    return allDates.filter(d => d.xp > 0).length;
  }, [allDates]);

  // 小屏滚动到指定季度
  const scrollToQuarter = useCallback((quarterNum: number, smooth = true) => {
    setSelectedQuarter(quarterNum);
    if (!quarterSliderRef.current) return;
    const targetCard = quarterSliderRef.current.querySelector(`[data-quarter-card="${quarterNum}"]`) as HTMLElement | null;
    if (targetCard) {
      isScrollingByClickRef.current = true;
      targetCard.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest',
        inline: 'center'
      });
      setTimeout(() => {
        isScrollingByClickRef.current = false;
      }, 400);
    }
  }, []);

  // 中屏滚动到指定半年
  const scrollToHalf = useCallback((halfNum: number, smooth = true) => {
    setSelectedHalf(halfNum);
    if (!halfSliderRef.current) return;
    const targetCard = halfSliderRef.current.querySelector(`[data-half-card="${halfNum}"]`) as HTMLElement | null;
    if (targetCard) {
      isScrollingByClickRef.current = true;
      targetCard.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest',
        inline: 'center'
      });
      setTimeout(() => {
        isScrollingByClickRef.current = false;
      }, 400);
    }
  }, []);

  // 切换年份时自动定位
  useEffect(() => {
    if (isMobileSmallScreen) {
      const targetQ = selectedYear === currentYear ? currentQuarterNum : 1;
      const timer = setTimeout(() => {
        scrollToQuarter(targetQ, false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (isTabletHalfScreen) {
      const targetH = selectedYear === currentYear ? currentHalfNum : 1;
      const timer = setTimeout(() => {
        scrollToHalf(targetH, false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedYear, isMobileSmallScreen, isTabletHalfScreen, currentYear, currentQuarterNum, currentHalfNum, scrollToQuarter, scrollToHalf]);

  // 监听小屏横向滑动：同步 Q1-Q4，且滑动时自动关闭浮窗
  const handleQuarterSliderScroll = useCallback(() => {
    if (tooltip) {
      setTooltip(null);
    }
    if (isScrollingByClickRef.current || !quarterSliderRef.current) return;
    const slider = quarterSliderRef.current;
    const centerPoint = slider.scrollLeft + slider.clientWidth / 2;

    let closestQuarter = selectedQuarter;
    let minDiff = Infinity;

    [1, 2, 3, 4].forEach(q => {
      const card = slider.querySelector(`[data-quarter-card="${q}"]`) as HTMLElement | null;
      if (card) {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const diff = Math.abs(cardCenter - centerPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestQuarter = q;
        }
      }
    });

    if (closestQuarter !== selectedQuarter) {
      setSelectedQuarter(closestQuarter);
    }
  }, [selectedQuarter, tooltip]);

  // 监听中屏半年横向滑动：同步上半年/下半年，且滑动时自动关闭浮窗
  const handleHalfSliderScroll = useCallback(() => {
    if (tooltip) {
      setTooltip(null);
    }
    if (isScrollingByClickRef.current || !halfSliderRef.current) return;
    const slider = halfSliderRef.current;
    const centerPoint = slider.scrollLeft + slider.clientWidth / 2;

    let closestHalf = selectedHalf;
    let minDiff = Infinity;

    [1, 2].forEach(h => {
      const card = slider.querySelector(`[data-half-card="${h}"]`) as HTMLElement | null;
      if (card) {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const diff = Math.abs(cardCenter - centerPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestHalf = h;
        }
      }
    });

    if (closestHalf !== selectedHalf) {
      setSelectedHalf(closestHalf);
    }
  }, [selectedHalf, tooltip]);

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

  function handleDayClick(day: { date: Date; xp: number; time?: number; dateStr: string }): void {
    if (day.xp < 0 || !day.dateStr) return;
    updateTooltipPosition(day.dateStr, day.xp, day.time);
  }

  function navigateDay(direction: -1 | 1): void {
    if (!tooltip) return;

    const currentDate = new Date(tooltip.date);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDateStr = toLocalDateStr(currentDate, userTimezone);

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

  function canNavigate(direction: -1 | 1): boolean {
    if (!tooltip) return false;

    const currentDate = new Date(tooltip.date);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDateStr = toLocalDateStr(currentDate, userTimezone);

    return allDates.some(d => d.dateStr === newDateStr);
  }

  function getTooltipTransform(): string {
    if (!tooltip) return '';
    const { showBelow, alignment } = tooltip;
    const xOffset = alignment === 'left' ? '-20%' : alignment === 'right' ? '-80%' : '-50%';
    const yOffset = showBelow ? '0' : '-100%';
    return `translate(${xOffset}, ${yOffset})`;
  }

  const showWeekdayLabels = !isMobileSmallScreen;
  const monthLabelOffset = showWeekdayLabels ? 16 : 0;
  const is1024Screen = containerWidth >= 960 && containerWidth <= 1080;
  const gridMinWidth = viewMode === 'year' && !is1024Screen
    ? `${Math.max(720, fullYearData.weeks.length * 14 + monthLabelOffset + 24)}px`
    : undefined;

  return (
    <div ref={containerRef} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-b-4 border-gray-200">
      {/* 头部控制栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="inline-flex items-center gap-2 text-gray-700 font-bold text-lg sm:text-xl">
          <AppIcon name="calendar" mode={iconMode} />
          年度学习热力图
        </h2>

        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* 年份选择 */}
          <div className="flex items-center gap-1.5">
            {sortedYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${year === selectedYear
                  ? 'bg-[#58cc02] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* 425与375小屏幕：显示 Q1~Q4 快捷切换按钮 */}
          {isMobileSmallScreen && (
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              {[1, 2, 3, 4].map(q => (
                <button
                  key={q}
                  onClick={() => scrollToQuarter(q)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${q === selectedQuarter
                    ? 'bg-[#1cb0f6] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          )}

          {/* 平板中屏尺寸（560px <= width < 960px）：半年滑动切换按钮 */}
          {isTabletHalfScreen && (
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              {[1, 2].map(h => (
                <button
                  key={h}
                  onClick={() => scrollToHalf(h)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${h === selectedHalf
                    ? 'bg-[#1cb0f6] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {h === 1 ? '上半年' : '下半年'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 主体热力图区域 */}
      <div className="w-full">
        {isMobileSmallScreen ? (
          /* 【425 和 375 小屏幕】：4 个季度的方块横向滑动 */
          <div className="w-full">
            <div
              ref={quarterSliderRef}
              onScroll={handleQuarterSliderScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-2 scrollbar-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {quartersData.map(qData => (
                <div
                  key={qData.quarter}
                  data-quarter-card={qData.quarter}
                  className="min-w-full snap-center bg-gray-50/70 rounded-xl p-3 border border-gray-200/80 flex flex-col gap-2"
                >
                  {/* 季度头部信息 */}
                  <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-1.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1cb0f6] bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        Q{qData.quarter}
                      </span>
                      <span className="font-bold text-gray-700">{qData.monthRange}</span>
                    </div>
                    <div className="text-gray-500 text-[11px]">
                      学习 <span className="font-bold text-[#58cc02]">{qData.activeDays}</span> 天 ·{' '}
                      <span className="font-bold text-[#eab308]">{qData.totalXp.toLocaleString()}</span> XP
                    </div>
                  </div>

                  {/* 月份刻度 */}
                  <div className="relative h-4 text-[10px] text-gray-400 font-medium pl-4">
                    {qData.monthLabels.map((label, idx) => (
                      <div
                        key={idx}
                        className="absolute whitespace-nowrap"
                        style={{ left: `${(label.weekIndex / qData.weeks.length) * 100}%` }}
                      >
                        {label.month}
                      </div>
                    ))}
                  </div>

                  {/* 14 列紧凑方块网格 */}
                  <div
                    className="grid gap-[2.5px] w-full"
                    style={{
                      gridTemplateColumns: `16px repeat(${qData.weeks.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {WEEKDAYS.map((label, idx) => (
                      <div
                        key={`label-${idx}`}
                        className="text-[9px] text-gray-400 font-medium flex items-center justify-center"
                        style={{ gridColumn: 1, gridRow: idx + 1 }}
                      >
                        {idx % 2 === 1 ? label : ''}
                      </div>
                    ))}

                    {qData.weeks.map((week, weekIdx) => (
                      week.map((day, dayIdx) => {
                        const isValidDay = day.xp >= 0 && day.dateStr;
                        return (
                          <div
                            key={`${weekIdx}-${dayIdx}`}
                            className={`heatmap-cell w-full aspect-square rounded-[3px] transition-all ${
                              isValidDay ? 'cursor-pointer hover:ring-2 hover:ring-[#58cc02]' : ''
                            } ${
                              tooltip?.date === day.dateStr ? 'ring-2 ring-[#1cb0f6] ring-offset-1 z-10 relative' : ''
                            }`}
                            data-heatmap-date={day.dateStr || undefined}
                            style={{
                              backgroundColor: getColor(day.xp, maxXp),
                              gridColumn: weekIdx + 2,
                              gridRow: dayIdx + 1,
                            }}
                            onClick={() => handleDayClick(day)}
                          />
                        );
                      })
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 左右滑动提示 */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 mt-1">
              <span className="flex items-center gap-1 text-[#1cb0f6]">
                ⇄ 左右滑动切换 Q1-Q4 季度
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(q => (
                  <div
                    key={q}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      q === selectedQuarter ? 'w-3 bg-[#1cb0f6]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : isTabletHalfScreen ? (
          /* 【中屏尺寸（560px <= width < 960px）】：分为上半年和下半年两个部分横向滑动的样式 */
          <div className="w-full">
            <div
              ref={halfSliderRef}
              onScroll={handleHalfSliderScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-2 scrollbar-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {halvesData.map(hData => (
                <div
                  key={hData.half}
                  data-half-card={hData.half}
                  className="min-w-full snap-center bg-gray-50/70 rounded-xl p-3 sm:p-4 border border-gray-200/80 flex flex-col gap-2.5"
                >
                  {/* 半年头部信息 */}
                  <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-1.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1cb0f6] bg-blue-50 px-2 py-0.5 rounded text-xs">
                        {hData.title}
                      </span>
                      <span className="font-bold text-gray-700">({hData.monthRange})</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      学习 <span className="font-bold text-[#58cc02]">{hData.activeDays}</span> 天 ·{' '}
                      <span className="font-bold text-[#eab308]">{hData.totalXp.toLocaleString()}</span> XP
                    </div>
                  </div>

                  {/* 半年内容：完整占满卡片宽度，左右两边不留空 */}
                  <div className="w-full flex flex-col gap-1">
                    {/* 月份刻度 */}
                    <div className="relative h-4 text-xs text-gray-500 font-medium pl-4">
                      {hData.monthLabels.map((label, idx) => (
                        <div
                          key={idx}
                          className="absolute whitespace-nowrap text-[11px]"
                          style={{ left: `${(label.weekIndex / hData.weeks.length) * 100}%` }}
                        >
                          {label.month}
                        </div>
                      ))}
                    </div>

                    {/* 28 列方块网格 */}
                    <div
                      className="grid gap-[2px] sm:gap-[2.5px] w-full"
                      style={{
                        gridTemplateColumns: `16px repeat(${hData.weeks.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {WEEKDAYS.map((label, idx) => (
                        <div
                          key={`label-${idx}`}
                          className="text-[10px] text-gray-400 font-medium flex items-center justify-center"
                          style={{ gridColumn: 1, gridRow: idx + 1 }}
                        >
                          {idx % 2 === 1 ? label : ''}
                        </div>
                      ))}

                      {hData.weeks.map((week, weekIdx) => (
                        week.map((day, dayIdx) => {
                          const isValidDay = day.xp >= 0 && day.dateStr;
                          return (
                            <div
                              key={`${weekIdx}-${dayIdx}`}
                              className={`heatmap-cell w-full aspect-square rounded-[3px] transition-all ${
                                isValidDay ? 'cursor-pointer hover:ring-2 hover:ring-[#58cc02]' : ''
                              } ${
                                tooltip?.date === day.dateStr ? 'ring-2 ring-[#1cb0f6] ring-offset-1 z-10 relative' : ''
                              }`}
                              data-heatmap-date={day.dateStr || undefined}
                              style={{
                                backgroundColor: getColor(day.xp, maxXp),
                                gridColumn: weekIdx + 2,
                                gridRow: dayIdx + 1,
                              }}
                              onClick={() => handleDayClick(day)}
                            />
                          );
                        })
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 左右滑动提示 */}
            <div className="flex items-center justify-between text-xs text-gray-400 px-1 mt-1">
              <span className="flex items-center gap-1 text-[#1cb0f6]">
                ⇄ 左右滑动切换上半年 / 下半年
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map(h => (
                  <div
                    key={h}
                    className={`w-2 h-2 rounded-full transition-all ${
                      h === selectedHalf ? 'w-4 bg-[#1cb0f6]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 【大屏尺寸（>=860px，包括 1024*896）】：完整 54 周连续全年热力图平铺，占满整张卡片两边不留空 */
          <div className="w-full pb-2">
            <div className="relative w-full">
              <div className="mb-1 h-4 text-xs text-gray-600" style={{ paddingLeft: `${monthLabelOffset}px` }}>
                <div className="relative h-full w-full">
                  {fullYearData.monthLabels.map((label, idx) => (
                    <div
                      key={idx}
                      className="absolute whitespace-nowrap text-[11px]"
                      style={{ left: `${(label.weekIndex / fullYearData.weeks.length) * 100}%` }}
                    >
                      {label.month}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="grid gap-[1px] lg:gap-[2px] relative w-full p-1"
                style={{
                  gridTemplateColumns: showWeekdayLabels
                    ? `16px repeat(${fullYearData.weeks.length}, minmax(0, 1fr))`
                    : `repeat(${fullYearData.weeks.length}, minmax(0, 1fr))`,
                }}
              >
                {showWeekdayLabels && WEEKDAYS.map((label, idx) => (
                  <div
                    key={`label-${idx}`}
                    className="text-[10px] text-gray-500 flex items-center justify-center"
                    style={{ gridColumn: 1, gridRow: idx + 1 }}
                  >
                    {idx % 2 === 1 ? label : ''}
                  </div>
                ))}

                {fullYearData.weeks.map((week, weekIdx) => (
                  week.map((day, dayIdx) => {
                    const isValidDay = day.xp >= 0 && day.dateStr;
                    return (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className={`heatmap-cell w-full rounded-sm transition-all ${
                          isValidDay ? 'cursor-pointer hover:ring-2 hover:ring-[#58cc02]' : ''
                        } ${
                          tooltip?.date === day.dateStr ? 'ring-2 ring-[#1cb0f6] ring-offset-1 z-10 relative' : ''
                        }`}
                        data-heatmap-date={day.dateStr || undefined}
                        style={{
                          backgroundColor: getColor(day.xp, maxXp),
                          gridColumn: weekIdx + 2,
                          gridRow: dayIdx + 1,
                          paddingBottom: '100%',
                        }}
                        onClick={() => handleDayClick(day)}
                      />
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 悬浮提示 Tooltip */}
        {tooltip && typeof document !== 'undefined' && createPortal(
          <>
            <div
              ref={tooltipRef}
              className="fixed z-[9999] bg-white text-gray-700 rounded-xl shadow-xl border border-gray-200 p-3 w-[180px] transition-all duration-200 ease-out"
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
                className={`absolute w-0 h-0 border-l-[6px] border-r-[6px] border-transparent transition-all duration-200 ease-out ${tooltip.showBelow
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

        {/* 底部年度统计信息与图例 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-1 sm:gap-0 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {selectedYear} 年累计学习{' '}
            <span style={{ color: DuoColors.featherGreen }} className="font-bold">
              {activeDays}
            </span>{' '}
            天， 获得{' '}
            <span style={{ color: DuoColors.beeYellow }} className="font-bold">
              {viewXp.toLocaleString()}
            </span>{' '}
            XP
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
  );
}
