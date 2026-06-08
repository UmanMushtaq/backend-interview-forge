import { useEffect } from 'react';
import { useProgressState } from './useProgress';
import { updateSettings } from '../lib/storage';
import type { ThemeMode } from '../types';

export function useTheme() {
  const { settings } = useProgressState();
  const theme = settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (next: ThemeMode) => updateSettings({ theme: next });
  const toggle = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  return { theme, setTheme, toggle };
}
