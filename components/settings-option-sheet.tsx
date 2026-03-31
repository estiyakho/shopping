import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

type Option<T extends string | number> = {
  label: string;
  value: T;
  color?: string; // Optional dot color
};

type SettingsOptionSheetProps<T extends string | number> = {
  visible: boolean;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  options: Option<T>[];
  selectedValue?: T;
  tone?: 'default' | 'danger';
  onClose: () => void;
  onSelect: (value: T) => void;
};

export function SettingsOptionSheet<T extends string | number>({
  visible,
  title,
  iconName,
  options,
  selectedValue,
  tone = 'default',
  onClose,
  onSelect,
}: SettingsOptionSheetProps<T>) {
  const colors = useAppTheme();
  const accentColor = tone === 'danger' ? colors.danger : colors.accent;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = Math.max(240, windowHeight - insets.top - insets.bottom - 56);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              maxHeight: Math.min(maxSheetHeight, windowHeight * 0.78),
            },
          ]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Ionicons color={accentColor} name={iconName} size={22} />
            </View>
            <Text style={[styles.title, { color: tone === 'danger' ? colors.danger : colors.text }]}>{title}</Text>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = selectedValue !== undefined && option.value === selectedValue;

              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={styles.option}>
                  <View style={styles.optionContent}>
                    {option.color ? (
                      <View style={[styles.optionDot, { backgroundColor: option.color }]} />
                    ) : null}
                    <Text style={[styles.optionLabel, { color: selected ? accentColor : colors.textSoft }]}>
                      {option.label}
                    </Text>
                  </View>
                  <View style={styles.checkWrap}>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={accentColor} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '76%',
    overflow: 'hidden',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  title: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 18,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  optionDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  optionLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 17,
    marginTop: -1, // Visual alignment
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});
