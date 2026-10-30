const THEME_STORAGE_KEY = 'capstone-color-scheme';

export async function readThemePreference() {
  return localStorage.getItem(THEME_STORAGE_KEY);
}

export async function writeThemePreference(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
