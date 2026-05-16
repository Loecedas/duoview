import React from 'react';
import { StatCardColors } from '../../styles/duolingoColors';
import { AppIcon } from '../AppIcon';
import type { IconMode } from '../useIconMode';
import type { IconName } from '../AppIcon';

const ICON_COLOR_MAP: Record<IconName, string> = {
  bolt: StatCardColors.totalXp,
  books: StatCardColors.courses,
  calendar: StatCardColors.accountAge,
  camera: StatCardColors.gems,
  clock: StatCardColors.learningTime,
  crown: StatCardColors.gems,
  desktop: StatCardColors.totalXp,
  flame: StatCardColors.streak,
  hourglass: StatCardColors.learningTime,
  moon: StatCardColors.accountAge,
  parrot: StatCardColors.courses,
  refresh: StatCardColors.courses,
  sad: StatCardColors.accountAge,
  search: StatCardColors.totalXp,
  shapes: StatCardColors.learningTime,
  snowflake: StatCardColors.accountAge,
  sun: StatCardColors.totalXp,
};

const DELAY_CLASSES = ['', 'delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5'] as const;

interface StatCardProps {
  icon: IconName;
  iconMode: IconMode;
  value: string | number;
  label: string;
  colorClass?: string;
  color?: string;
  seq?: number;
  isLargeText?: boolean;
}


export function StatCard({
  icon,
  iconMode,
  value,
  label,
  colorClass,
  color,
  seq = 1,
  isLargeText = true,
}: StatCardProps): React.ReactElement {
  const iconColor = ICON_COLOR_MAP[icon];
  const valueColor = color || iconColor;
  const delayClass = DELAY_CLASSES[Math.min(seq, 5)];

  return (
    <div className={`bg-white rounded-2xl p-3 sm:p-4 shadow-sm border-2 border-b-4 border-gray-200 animate-fade-in-up ${delayClass}`}>
      <div
        className="text-xl sm:text-2xl mb-1"
        style={iconColor ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' } : undefined}
      >
        <AppIcon name={icon} mode={iconMode} />
      </div>
      <div
        className={`${isLargeText ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'} font-extrabold ${!valueColor ? colorClass : ''}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 font-bold truncate">{label}</div>
    </div>
  );
}

export default StatCard;
