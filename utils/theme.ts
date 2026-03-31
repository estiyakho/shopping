import { Settings } from '@/types/task';

export function getThemeColors(settings: Settings, resolvedTheme: 'light' | 'dark') {
  const isLight = resolvedTheme === 'light';
  const accent = settings.accentColor;
  const useAmoled = !isLight && settings.amoledTheme;

  return {
    accent,
    background: isLight ? '#F3F6FB' : useAmoled ? '#000000' : '#1E1E1E',
    surface: isLight ? '#FFFFFF' : useAmoled ? '#05070B' : '#252526',
    surfaceMuted: isLight ? '#EDF2F8' : useAmoled ? '#090C12' : '#2D2D30',
    surfaceElevated: isLight ? '#FFFFFF' : useAmoled ? '#0B0F16' : '#2A2D2E',
    border: isLight ? '#D8E1EC' : '#3C3C3C',
    text: isLight ? '#0F172A' : '#E6E6E6',
    textMuted: isLight ? '#64748B' : '#A6A6A6',
    textSoft: isLight ? '#475569' : '#C5C5C5',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    isLight,
  };
}
