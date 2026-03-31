import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Category } from '@/types/task';

type CategoryOptionSheetProps = {
  visible: boolean;
  categories: Category[];
  selectedValue?: string;
  onClose: () => void;
  onSelect: (categoryId?: string) => void;
};

export function CategoryOptionSheet({
  visible,
  categories,
  selectedValue,
  onClose,
  onSelect,
}: CategoryOptionSheetProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = Math.max(260, windowHeight - insets.top - insets.bottom - 56);

  return (
    <Modal 
      animationType="fade" 
      transparent 
      visible={visible} 
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              maxHeight: Math.min(maxSheetHeight, windowHeight * 0.76),
            },
          ]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.accent}22` }]}>
              <Ionicons color={colors.accent} name="grid-outline" size={22} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Select Category</Text>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Pressable
              onPress={() => {
                onSelect(undefined);
                onClose();
              }}
              style={styles.option}>
              <View style={[styles.colorDot, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderWidth: 1 }]} />
              <Text style={[styles.optionLabel, { color: !selectedValue ? colors.accent : colors.textSoft }]}>
                None
              </Text>
              <View style={styles.checkWrap}>
                {!selectedValue ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
              </View>
            </Pressable>

            {categories.map((cat) => {
              const selected = cat.id === selectedValue;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    onSelect(cat.id);
                    onClose();
                  }}
                  style={styles.option}>
                  <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.optionLabel, { color: selected ? colors.accent : colors.textSoft }]}>
                    {cat.name}
                  </Text>
                  <View style={styles.checkWrap}>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    borderRadius: 32,
    borderWidth: 1,
    maxHeight: '70%',
    overflow: 'hidden',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 20,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLabel: {
    flex: 1,
    fontFamily: AppFonts.semibold,
    fontSize: 17,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});
