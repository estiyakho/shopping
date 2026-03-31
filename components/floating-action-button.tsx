import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

type FloatingActionButtonProps = {
  onPress: () => void;
  iconName?: ComponentProps<typeof Ionicons>['name'];
};

export function FloatingActionButton({ onPress, iconName = 'add' }: FloatingActionButtonProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent, bottom: Math.max(24, insets.bottom + 16) },
        pressed && styles.buttonPressed,
      ]}>
      <Ionicons name={iconName} size={26} color={colors.isLight ? "#0F172A" : "#F8FAFC"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 18,
    elevation: 8,
    height: 54,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: 54,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
