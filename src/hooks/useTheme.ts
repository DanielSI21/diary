import { useCallback, useState } from 'react';
import { applyTheme, getInitialTheme, type Theme } from '../utils/theme';

/** Estado del tema (claro/oscuro) con persistencia en localStorage. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
