import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

/** Applies the theme setting to <html>. "system" leaves it to prefers-color-scheme. */
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = theme;
  }, [theme]);
}
