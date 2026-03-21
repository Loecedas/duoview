import React from 'react';
import { StatCardColors } from '../../styles/duolingoColors';

const ICON_COLOR_MAP: Record<string, string> = {
  '⚡': StatCardColors.totalXp,
  '📅': StatCardColors.accountAge,
  '📚': StatCardColors.courses,
  '⏱️': StatCardColors.learningTime,
  '🔥': StatCardColors.streak,
  '💎': StatCardColors.gems,
};

const DELAY_CLASSES = ['', 'delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5'] as const;

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  colorClass?: string;
  color?: string;
  seq?: number;
  isLargeText?: boolean;
}

export function StatCard({
  icon,
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
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 border-b-4 border-gray-200 animate-fade-in-up ${delayClass}`}>
      <div
        className="text-2xl mb-1"
        style={iconColor ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' } : undefined}
      >
        {icon}
      </div>
      <div
        className={`${isLargeText ? 'text-2xl' : 'text-lg'} font-extrabold ${!valueColor ? colorClass : ''}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 font-bold">{label}</div>
    </div>
  );
}

export default StatCard;
