import { Tabs } from 'expo-router';
import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

const TabBarLabel = memo(({ color, children, baseLabelSize }: { color: string; children: string; baseLabelSize: number }) => {
  const label = children;
  const fontSize = label === 'Statistics' ? baseLabelSize - 1.8 : label === 'Categories' ? baseLabelSize - 1.25 : baseLabelSize;
  const fontFamily = label === 'Categories' || label === 'All Todos' ? AppFonts.bold : AppFonts.semibold;

  return (
    <Text
      numberOfLines={1}
      style={{
        color,
        fontFamily,
        fontSize,
        includeFontPadding: false,
        lineHeight: fontSize + 2,
        textAlign: 'center',
      }}>
      {children}
    </Text>
  );
});

export default function TabLayout() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const compact = width < 390;
  const baseLabelSize = width < 360 ? 8.75 : compact ? 9.5 : 10;
  const iconSize = width < 360 ? 20 : 22;
  const horizontalPadding = width < 360 ? 6 : compact ? 8 : 10;
  const bottomPadding = Math.max(insets.bottom, 24);
  const tabBarHeight = 55 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSoft,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarItemStyle: {
          alignItems: 'center',
          borderRadius: 999,
          flex: 1,
          justifyContent: 'center',
          marginHorizontal: 1,
          marginVertical: 4,
          minWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          marginBottom: 1,
          marginTop: -4,
        },
        tabBarLabel: ({ color, children }) => (
          <TabBarLabel color={color} baseLabelSize={baseLabelSize}>{String(children)}</TabBarLabel>
        ),
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingHorizontal: horizontalPadding,
          paddingTop: 2,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <Ionicons name="folder-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'All Todos',
          tabBarIcon: ({ color }) => <Ionicons name="checkbox-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
