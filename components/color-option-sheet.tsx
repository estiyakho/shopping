import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ColorPalette, findPaletteByColor } from '@/utils/color-palettes';

type ColorOptionSheetProps = {
  visible: boolean;
  title: string;
  palettes: ColorPalette[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function ColorOptionSheet({
  visible,
  title,
  palettes,
  selectedValue,
  onClose,
  onSelect,
}: ColorOptionSheetProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const initialPalette = useMemo(() => findPaletteByColor(selectedValue, palettes), [palettes, selectedValue]);
  const [activePaletteLabel, setActivePaletteLabel] = useState(initialPalette.label);
  const maxSheetHeight = Math.max(260, windowHeight - insets.top - insets.bottom - 56);

  useEffect(() => {
    setActivePaletteLabel(initialPalette.label);
  }, [initialPalette.label, visible]);

  const activePalette = palettes.find((palette) => palette.label === activePaletteLabel) ?? initialPalette;

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
              maxHeight: Math.min(maxSheetHeight, windowHeight * 0.82),
            },
          ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
              <Ionicons name="close" size={18} color={colors.textSoft} />
            </Pressable>
          </View>

          <View style={styles.paletteGrid}>
            {palettes.map((palette) => {
              const paletteSelected = palette.label === activePalette.label;
              const paletteColor = palette.shades[3];

              return (
                <Pressable
                  key={palette.label}
                  onPress={() => {
                    setActivePaletteLabel(palette.label);
                    onSelect(paletteColor);
                  }}
                  style={[
                    styles.paletteCard,
                    {
                      backgroundColor: paletteSelected ? `${paletteColor}18` : colors.surface,
                      borderColor: paletteSelected ? paletteColor : colors.border,
                    },
                  ]}>
                  <View style={[styles.paletteSwatch, { backgroundColor: paletteColor }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.shadesPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.shadesHeader}>
              <Text style={[styles.shadesTitle, { color: colors.text }]}>Shades</Text>
              <View style={styles.shadesCaptionWrap}>
                <View style={[styles.shadesCaptionSwatch, { backgroundColor: activePalette.shades[3] }]} />
                <Text style={[styles.shadesCaption, { color: colors.textMuted }]}>{activePalette.label}</Text>
              </View>
            </View>
            <View style={styles.shadesRow}>
              {activePalette.shades.map((shade) => {
                const selected = shade === selectedValue;
                return (
                  <Pressable
                    key={shade}
                    onPress={() => {
                      onSelect(shade);
                      onClose();
                    }}
                    style={[
                      styles.shadeButton,
                      {
                        backgroundColor: shade,
                        borderColor: selected ? colors.text : 'transparent',
                      },
                    ]}>
                    {selected ? <Ionicons name="checkmark" size={18} color={shade === '#E2E8F0' ? '#0F172A' : '#FFFFFF'} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
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
    padding: 16,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  paletteCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  paletteSwatch: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  shadesPanel: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  shadesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shadesCaptionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  shadesCaptionSwatch: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  shadesTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  shadesCaption: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
  },
  shadesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  shadeButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
});
