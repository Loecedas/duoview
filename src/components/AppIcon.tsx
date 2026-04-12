import React from 'react';
import type { IconMode } from './useIconMode';

export type IconName =
  | 'bolt'
  | 'books'
  | 'calendar'
  | 'camera'
  | 'clock'
  | 'crown'
  | 'desktop'
  | 'flame'
  | 'hourglass'
  | 'moon'
  | 'parrot'
  | 'refresh'
  | 'sad'
  | 'search'
  | 'shapes'
  | 'snowflake'
  | 'sun';

interface AppIconProps {
  name: IconName;
  mode?: IconMode;
  className?: string;
  label?: string;
}

const EMOJI_MAP: Record<IconName, string> = {
  bolt: '⚡',
  books: '📚',
  calendar: '📅',
  camera: '📷',
  clock: '⏰',
  crown: '👑',
  desktop: '💻',
  flame: '🔥',
  hourglass: '⏳',
  moon: '🌙',
  parrot: '🦜',
  refresh: '🔄',
  sad: '😢',
  search: '🔍',
  shapes: '🧩',
  snowflake: '❄️',
  sun: '☀️',
};

const DEFAULT_SVG_COLOR_MAP: Record<IconName, string> = {
  bolt: '#f5b301',
  books: '#58cc02',
  calendar: '#ff4b4b',
  camera: '#1cb0f6',
  clock: '#ce82ff',
  crown: '#ce82ff',
  desktop: '#4f46e5',
  flame: '#ff9600',
  hourglass: '#ce82ff',
  moon: '#64748b',
  parrot: '#58cc02',
  refresh: '#58cc02',
  sad: '#ff4b4b',
  search: '#1cb0f6',
  shapes: '#8b5cf6',
  snowflake: '#38bdf8',
  sun: '#f59e0b',
};

const ICON_SHELL_CLASS_NAME =
  'inline-flex h-[1.02em] w-[1.02em] shrink-0 select-none items-center justify-center overflow-visible leading-none align-[-0.08em]';
const SVG_INNER_CLASS_NAME = 'h-full w-full overflow-visible';
const SVG_DEFAULT_SCALE = 'scale(1.26)';
const SVG_SCALE_MAP: Partial<Record<IconName, string>> = {
  flame: 'scale(1.7)',
};

function hasExplicitColorClass(className?: string): boolean {
  if (!className) return false;

  return /(?:^|\s)(?:text-\[#(?:[0-9a-fA-F]{3,8})\]|text-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|white|black)(?:-\d{2,3})?|text-(?:current|inherit))(?:\s|$)/.test(
    className,
  );
}

function createSvg(
  name: IconName,
  children: React.ReactNode,
  className?: string,
  label?: string,
): React.ReactElement {
  const colorStyle = hasExplicitColorClass(className)
    ? undefined
    : { color: DEFAULT_SVG_COLOR_MAP[name] };
  const scaleStyle = {
    transform: SVG_SCALE_MAP[name] ?? SVG_DEFAULT_SCALE,
    transformOrigin: 'center' as const,
  };

  return (
    <span
      className={[ICON_SHELL_CLASS_NAME, className].filter(Boolean).join(' ')}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
        vectorEffect="non-scaling-stroke"
        className={SVG_INNER_CLASS_NAME}
        style={{ ...colorStyle, ...scaleStyle }}
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

function renderSvg(name: IconName, className?: string, label?: string): React.ReactElement {
  switch (name) {
    case 'bolt':
      return createSvg(name, <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />, className, label);
    case 'books':
      return createSvg(
        name,
        <>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v14H7.5A2.5 2.5 0 0 0 5 19.5V5.5Z" />
          <path d="M5 5.5V19.5" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </>,
        className,
        label,
      );
    case 'calendar':
      return createSvg(
        name,
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </>,
        className,
        label,
      );
    case 'camera':
      return createSvg(
        name,
        <>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H9l1.4-2h3.2L15 6h2.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
          <circle cx="12" cy="12.5" r="3.5" />
        </>,
        className,
        label,
      );
    case 'clock':
      return createSvg(
        name,
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3 2" />
        </>,
        className,
        label,
      );
    case 'crown':
      return createSvg(
        name,
        <>
          <path d="m4 18 2-10 5 4 5-7 2 13H4Z" />
          <path d="M6 18h12" />
        </>,
        className,
        label,
      );
    case 'desktop':
      return createSvg(
        name,
        <>
          <rect x="3" y="4" width="18" height="12" rx="2.5" />
          <path d="M9 20h6" />
          <path d="M12 16v4" />
        </>,
        className,
        label,
      );
    case 'flame':
      return createSvg(
        name,
        <path d="M12 3c1.8 2.6 4.5 4.3 4.5 8a4.5 4.5 0 1 1-9 0c0-1.9 1-3.4 2.3-4.9.8 1.6 1.6 2.4 2.2 2.9C12.8 7.4 13 5.7 12 3Z" />,
        className,
        label,
      );
    case 'hourglass':
      return createSvg(
        name,
        <>
          <path d="M7 3h10" />
          <path d="M7 21h10" />
          <path d="M8 3c0 4 4 5 4 9s-4 5-4 9" />
          <path d="M16 3c0 4-4 5-4 9s4 5 4 9" />
        </>,
        className,
        label,
      );
    case 'moon':
      return createSvg(
        name,
        <path d="M15 3.5a7.5 7.5 0 1 0 5.5 12.8A8.5 8.5 0 1 1 15 3.5Z" />,
        className,
        label,
      );
    case 'parrot':
      return createSvg(
        name,
        <>
          <path d="M8.5 13A5.5 5.5 0 1 1 17 8.3V12a4.5 4.5 0 1 1-9 1Z" />
          <path d="M13 10h4l3-2-1 4h-3" />
          <circle cx="12" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
          <path d="M9 18c.5 1.8 1.7 3 4 3" />
        </>,
        className,
        label,
      );
    case 'refresh':
      return createSvg(
        name,
        <>
          <path d="M20 11a8 8 0 0 0-14-4" />
          <path d="M4 5v4h4" />
          <path d="M4 13a8 8 0 0 0 14 4" />
          <path d="M20 19v-4h-4" />
        </>,
        className,
        label,
      );
    case 'sad':
      return createSvg(
        name,
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 15.5c.8-.8 1.8-1.2 3-1.2s2.2.4 3 1.2" />
          <path d="M9.5 10h.01" />
          <path d="M14.5 10h.01" />
        </>,
        className,
        label,
      );
    case 'search':
      return createSvg(
        name,
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </>,
        className,
        label,
      );
    case 'shapes':
      return createSvg(
        name,
        <>
          <circle cx="7" cy="8" r="2.5" />
          <path d="M14 5h5v5h-5z" />
          <path d="m12 18 3.5-6 3.5 6H12Z" />
        </>,
        className,
        label,
      );
    case 'snowflake':
      return createSvg(
        name,
        <>
          <path d="M12 3v18" />
          <path d="m8.5 5.5 7 13" />
          <path d="m15.5 5.5-7 13" />
          <path d="m9 7-2 1" />
          <path d="m15 7 2 1" />
          <path d="m9 17-2-1" />
          <path d="m15 17 2-1" />
        </>,
        className,
        label,
      );
    case 'sun':
      return createSvg(
        name,
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v3" />
          <path d="M12 18.5v3" />
          <path d="m5.5 5.5 2.1 2.1" />
          <path d="m16.4 16.4 2.1 2.1" />
          <path d="M2.5 12h3" />
          <path d="M18.5 12h3" />
          <path d="m5.5 18.5 2.1-2.1" />
          <path d="m16.4 7.6 2.1-2.1" />
        </>,
        className,
        label,
      );
  }
}

export function AppIcon({
  name,
  mode = 'emoji',
  className,
  label,
}: AppIconProps): React.ReactElement {
  if (mode === 'emoji') {
    return (
      <span
        className={[ICON_SHELL_CLASS_NAME, className].filter(Boolean).join(' ')}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        {EMOJI_MAP[name]}
      </span>
    );
  }

  return renderSvg(name, className, label);
}

export default AppIcon;
