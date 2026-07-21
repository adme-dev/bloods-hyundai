export const ADMIN_THEME_STORAGE_KEY = 'bloods-admin-theme';

export const ADMIN_THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type AdminThemePreference = typeof ADMIN_THEME_PREFERENCES[number];
export type ResolvedAdminTheme = Exclude<AdminThemePreference, 'system'>;

export function normalizeAdminThemePreference(value: unknown): AdminThemePreference {
  return ADMIN_THEME_PREFERENCES.includes(value as AdminThemePreference)
    ? value as AdminThemePreference
    : 'system';
}

export function resolveAdminTheme(
  preference: AdminThemePreference,
  systemPrefersDark: boolean,
): ResolvedAdminTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
