import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inconsolata_400Regular,
  Inconsolata_500Medium,
  Inconsolata_600SemiBold,
  Inconsolata_700Bold,
  useFonts,
} from '@expo-google-fonts/inconsolata';
import { Stack } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { useEffect, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAutoReset } from '@/hooks/use-auto-reset';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaskStore } from '@/store/use-task-store';
import { getThemeColors } from '@/utils/theme';
import { applyInconsolataDefaults } from '@/utils/typography';
import { NotificationOnboardingModal } from '@/components/notification-onboarding-modal';



export const unstable_settings = {
  initialRouteName: '(tabs)',
};

type AppLayoutProps = {
  backgroundColor: string;
  children: ReactNode;
};

function AppLayout({ backgroundColor, children }: AppLayoutProps) {
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const doc = (globalThis as any).document;
    doc?.documentElement && (doc.documentElement.style.backgroundColor = backgroundColor);
    doc?.body && (doc.body.style.backgroundColor = backgroundColor);
  }, [backgroundColor]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
      <SafeAreaProvider style={{ backgroundColor }}>
        {children}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useAutoReset();

  const colorScheme = useColorScheme();
  const settings = useTaskStore((state) => state.settings);
  const hydrated = useTaskStore((state) => state.hydrated);
  const updateSettings = useTaskStore((state) => state.updateSettings);
  const resolvedTheme = settings.theme === 'system' ? colorScheme : settings.theme;
  const palette = useMemo(
    () => getThemeColors(settings, resolvedTheme === 'light' ? 'light' : 'dark'),
    [resolvedTheme, settings]
  );

  const navigationTheme = useMemo(
    () => ({
      dark: resolvedTheme === 'dark',
      colors: {
        ...(resolvedTheme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
        background: palette.background,
        card: palette.surface,
        border: palette.border,
        primary: palette.accent,
        text: palette.text,
      },
      fonts: resolvedTheme === 'light' ? DefaultTheme.fonts : DarkTheme.fonts,
    }),
    [palette, resolvedTheme]
  );

  const [loaded] = useFonts({
    Inconsolata_400Regular,
    Inconsolata_500Medium,
    Inconsolata_600SemiBold,
    Inconsolata_700Bold,
  });

  useEffect(() => {
    if (!loaded || !hydrated) {
      return;
    }

    applyInconsolataDefaults();
  }, [loaded, hydrated]);

  if (!loaded || !hydrated) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <AppLayout backgroundColor={palette.background}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: palette.background },
          }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <SystemBars style={resolvedTheme === 'light' ? 'dark' : 'light'} />
        <NotificationOnboardingModal 
          visible={!settings.hasCompletedNotificationOnboarding}
          onComplete={() => updateSettings({ hasCompletedNotificationOnboarding: true })}
        />
      </AppLayout>
    </ThemeProvider>
  );
}

