import React from 'react';
import type { UserData } from '../../types';
import { AppIcon } from '../AppIcon';
import type { IconMode } from '../useIconMode';

interface TodayOverviewProps {
  userData: UserData | null;
  iconMode: IconMode;
  seq?: number;
}

export function TodayOverview({ userData, iconMode, seq = 4 }: TodayOverviewProps): React.ReactElement {
  const todayTime = userData?.dailyTimeHistory?.length
    ? userData.dailyTimeHistory[userData.dailyTimeHistory.length - 1].time || '-'
    : '-';

  function renderTodayStatus(): React.ReactNode {
    if (!userData) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <AppIcon name="clock" mode={iconMode} />
          今日还未学习
        </span>
      );
    }

    // 优先检查是否使用了冻结卡（当 xpToday 为 0 或未定义时）
    if (userData.streakExtendedToday && (!userData.xpToday || userData.xpToday === 0)) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-blue-500">
          <AppIcon name="snowflake" mode={iconMode} />
          使用了连胜冻结卡
        </span>
      );
    }

    if (userData.xpToday && userData.xpToday > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <AppIcon name="flame" mode={iconMode} />
          今日已学习 {userData.xpToday} XP
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <AppIcon name="clock" mode={iconMode} />
        今日还未学习
      </span>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 border-b-4 border-gray-200 animate-fade-in-up delay-${Math.min(seq ?? 4, 5)}`}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-gray-700 font-bold text-lg">今日概览</h2>
        {renderTodayStatus()}
      </div>

      <div className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row max-[425px]:grid max-[425px]:grid-cols-2 gap-2 sm:gap-3 overflow-x-hidden">
          {/* 今日 XP */}
          <div className="max-[425px]:bg-[#f7fff2] bg-gray-50 rounded-xl p-4 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center flex-1 min-w-0 flex flex-col items-center justify-center">
            <div className="text-2xl sm:text-2xl font-black text-[#58cc02] order-1">
              {userData ? (userData.xpToday ?? '-') : '—'}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 sm:mt-0 sm:mb-2 text-gray-700 order-2">
              <div className="hidden sm:block w-3 h-3 rounded-full flex-shrink-0 bg-[#58cc02]" />
              <span className="font-bold text-xs sm:text-xs">今日 XP</span>
            </div>
          </div>

          {/* 今日课程 */}
          <div className="max-[425px]:bg-[#f0f9ff] bg-gray-50 rounded-xl p-4 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center flex-1 min-w-0 flex flex-col items-center justify-center">
            <div className="text-2xl sm:text-2xl font-black text-blue-500 order-1">
              {userData ? (userData.lessonsToday ?? '-') : '—'}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 sm:mt-0 sm:mb-2 text-gray-700 order-2">
              <div className="hidden sm:block w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
              <span className="font-bold text-xs sm:text-xs">今日课程</span>
            </div>
          </div>

          {/* 连胜天数 */}
          <div className="max-[425px]:bg-[#fff8f0] bg-gray-50 rounded-xl p-4 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center flex-1 min-w-0 flex flex-col items-center justify-center">
            <div className="text-2xl sm:text-2xl font-black text-orange-500 order-1">
              {userData ? userData.streak : '—'}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 sm:mt-0 sm:mb-2 text-gray-700 order-2">
              <div className="hidden sm:block w-3 h-3 rounded-full flex-shrink-0 bg-orange-500" />
              <span className="font-bold text-xs sm:text-xs">连胜天数</span>
            </div>
          </div>

          {/* 学习分钟 */}
          <div className="max-[425px]:bg-[#faf5ff] bg-gray-50 rounded-xl p-4 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center flex-1 min-w-0 flex flex-col items-center justify-center">
            <div className="text-2xl sm:text-2xl font-black text-purple-500 order-1">
              {todayTime}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 sm:mt-0 sm:mb-2 text-gray-700 order-2">
              <div className="hidden sm:block w-3 h-3 rounded-full flex-shrink-0 bg-purple-500" />
              <span className="font-bold text-xs sm:text-xs">学习分钟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodayOverview;
