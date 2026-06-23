export type Theme = 'light' | 'dark';

const KEY = 'theme';

/** Tema guardado por el usuario; si no hay, usa la preferencia del sistema. */
export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Aplica el tema (clase .dark en <html>) y lo persiste. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(KEY, theme);
}
