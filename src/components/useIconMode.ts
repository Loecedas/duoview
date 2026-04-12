import { useEffect, useState } from 'react';

export type IconMode = 'emoji' | 'svg';

const STORAGE_KEY = 'duoview-icon-mode';

function isIconMode(value: string | null): value is IconMode {
  return value === 'emoji' || value === 'svg';
}

function getInitialIconMode(): IconMode {
  if (typeof window === 'undefined') return 'emoji';

  const savedMode = window.localStorage.getItem(STORAGE_KEY);
  return isIconMode(savedMode) ? savedMode : 'emoji';
}

export function useIconMode() {
  const [iconMode, setIconMode] = useState<IconMode>(getInitialIconMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, iconMode);
  }, [iconMode]);

  return {
    iconMode,
    toggleIconMode: () => setIconMode((current) => (current === 'emoji' ? 'svg' : 'emoji')),
  };
}
