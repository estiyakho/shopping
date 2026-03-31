import { useMemo } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useShoppingStore } from '@/store/use-task-store';
import { getThemeColors } from '@/utils/theme';

export function useAppTheme() {
  const systemTheme = useColorScheme();
  const settings = useShoppingStore((state) => state.settings);
  const resolvedTheme = settings.theme === 'system' ? (systemTheme ?? 'dark') : settings.theme;

  return useMemo(() => 
    getThemeColors(settings, resolvedTheme === 'light' ? 'light' : 'dark'),
    [settings, resolvedTheme]
  );
}
