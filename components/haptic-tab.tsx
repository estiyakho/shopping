import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function HapticTab(props: BottomTabBarButtonProps) {
  const colors = useAppTheme();
  const selected = Boolean(props.accessibilityState?.selected);

  const runWithViewTransition = (fn: () => void) => {
    if (Platform.OS !== 'web') {
      fn();
      return;
    }

    const start = (globalThis as any).document?.startViewTransition;
    if (typeof start === 'function') {
      start(() => fn());
      return;
    }

    fn();
  };

  return (
    <PlatformPressable
      {...props}
      style={[styles.pressable, props.style]}
      onPress={(ev) => {
        runWithViewTransition(() => props.onPress?.(ev));
      }}
      onPressIn={(ev) => {
        props.onPressIn?.(ev);
      }}>
      <View
        style={[
          styles.inner,
          selected && [
            {
              backgroundColor: `${colors.accent}2A`,
              borderColor: `${colors.accent}80`,
            },
            styles.selectedShadow,
          ],
        ]}>
        {props.children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  selectedShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
});
