import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState, Children, isValidElement, cloneElement } from 'react';

import { ColorOptionSheet } from '@/components/color-option-sheet';
import { AppFonts } from '@/constants/fonts';
import { ModernConfirmationModal } from '@/components/modern-confirmation-modal';
import { SettingsOptionSheet } from '@/components/settings-option-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import {
  DefaultScreen,
  FirstDayOfWeek,
  Language,
  ResetInterval,
  SnoozeDuration,
  TimeFormat,
} from '@/types/task';
import { COLOR_PALETTES } from '@/utils/color-palettes';
import { formatRelativeResetLabel } from '@/utils/reset';

type SheetKey =
  | null
  | 'theme'
  | 'accentColor'
  | 'timeFormat'
  | 'firstDayOfWeek'
  | 'snoozeDuration'
  | 'defaultScreen'
  | 'language'
  | 'resetInterval'
  | 'resetNow';

type RowTone = 'default' | 'danger';

const TIME_FORMATS: { label: string; value: TimeFormat }[] = [
  { label: '12-Hour', value: '12h' },
  { label: '24-Hour', value: '24h' },
];
const FIRST_DAYS: { label: string; value: FirstDayOfWeek }[] = [
  { label: 'Sunday', value: 'sunday' },
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
];
const SNOOZE_DURATIONS: { label: string; value: SnoozeDuration }[] = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];
const DEFAULT_SCREENS: { label: string; value: DefaultScreen }[] = [
  { label: 'Categories', value: 'categories' },
  { label: 'All Todos', value: 'todos' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Settings', value: 'settings' },
];
const LANGUAGES: { label: string; value: Language }[] = [
  { label: 'English', value: 'english' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'French', value: 'french' },
];
const RESET_OPTIONS: { label: string; value: ResetInterval }[] = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];
const THEMES = [
  { label: 'Light', value: 'light' as const },
  { label: 'Dark', value: 'dark' as const },
  { label: 'System', value: 'system' as const },
];
const RESET_ACTIONS = [
  { label: 'Reset Data', value: 'data' as const },
  { label: 'Reset Stats', value: 'stats' as const },
  { label: 'Reset Settings', value: 'settings' as const },
];

function Row({
  label,
  value,
  onPress,
  iconName,
  valueNode,
  tone = 'default',
  isLast,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  valueNode?: ReactNode;
  tone?: RowTone;
  isLast?: boolean;
}) {
  const colors = useAppTheme();
  const iconColor = tone === 'danger' ? colors.danger : colors.accent;
  const labelColor = tone === 'danger' ? colors.danger : colors.text;
  const valueColor = tone === 'danger' ? '#FCA5A5' : colors.textMuted;

  return (
    <Pressable onPress={onPress} style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}> 
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, { backgroundColor: `${iconColor}16` }]}>
          <Ionicons color={iconColor} name={iconName} size={18} />
        </View>
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      </View>
      <View style={styles.rowValueWrap}>
        {valueNode ?? <Text style={[styles.rowValue, { color: valueColor }]}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={valueColor} />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  iconName,
  isLast,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  isLast?: boolean;
}) {
  const colors = useAppTheme();

  return (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}> 
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, { backgroundColor: `${colors.accent}16` }]}>
          <Ionicons color={colors.accent} name={iconName} size={18} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor="#F8FAFC"
        trackColor={{ false: '#3F3F46', true: colors.accent }}
        value={value}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const colors = useAppTheme();
  
  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as any, { 
        isLast: index === Children.count(children) - 1 
      });
    }
    return child;
  });

  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionHeading, { color: colors.accent }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {childrenWithProps}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const tasksCount = useTaskStore((state) => state.tasks.length);
  const categoriesCount = useTaskStore((state) => state.categories.length);
  const settings = useTaskStore((state) => state.settings);
  const updateSettings = useTaskStore((state) => state.updateSettings);
  const setResetInterval = useTaskStore((state) => state.setResetInterval);
  const resetData = useTaskStore((state) => state.resetData);
  const resetStats = useTaskStore((state) => state.resetStats);
  const resetSettings = useTaskStore((state) => state.resetSettings);
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    action: () => {},
  });

  const openSheet = (sheet: SheetKey) => setActiveSheet(sheet);
  const closeSheet = () => setActiveSheet(null);

  const handleResetSelection = (value: 'data' | 'stats' | 'settings') => {
    const config =
      value === 'data'
        ? {
            title: 'Reset data?',
            message: 'This clears tasks and categories from the device.',
            action: resetData,
          }
        : value === 'stats'
          ? {
              title: 'Reset stats?',
              message: 'This clears the current statistics baseline without deleting tasks.',
              action: resetStats,
            }
          : {
              title: 'Reset settings?',
              message: 'This restores app preferences to their defaults.',
              action: resetSettings,
            };

    setConfirmConfig({
      visible: true,
      title: config.title,
      message: config.message,
      action: config.action,
    });
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 10) }]}> 
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 20) }]} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <Section title="Appearance">
          <Row label="Theme" value={THEMES.find((item) => item.value === settings.theme)?.label ?? 'Dark'} onPress={() => openSheet('theme')} iconName="sunny-outline" />
          <ToggleRow label="AMOLED Theme" value={settings.amoledTheme} onValueChange={(value) => updateSettings({ amoledTheme: value })} iconName="phone-portrait-outline" />
          <Row
            label="Accent Color"
            onPress={() => openSheet('accentColor')}
            iconName="color-palette-outline"
            valueNode={<View style={[styles.colorPreview, { backgroundColor: settings.accentColor }]} />}
          />
        </Section>

        <Section title="Date & Time">
          <Row label="Time Format" value={TIME_FORMATS.find((item) => item.value === settings.timeFormat)?.label ?? '12-Hour'} onPress={() => openSheet('timeFormat')} iconName="time-outline" />
          <Row label="First Day of the Week" value={FIRST_DAYS.find((item) => item.value === settings.firstDayOfWeek)?.label ?? 'Saturday'} onPress={() => openSheet('firstDayOfWeek')} iconName="calendar-clear-outline" />
          <Row label="Snooze Duration" value={`${settings.snoozeDuration} min`} onPress={() => openSheet('snoozeDuration')} iconName="alarm-outline" />
        </Section>

        <Section title="App Preferences">
          <Row label="Default Screen" value={DEFAULT_SCREENS.find((item) => item.value === settings.defaultScreen)?.label ?? 'All Todos'} onPress={() => openSheet('defaultScreen')} iconName="layers-outline" />
          <Row label="Language" value={LANGUAGES.find((item) => item.value === settings.language)?.label ?? 'English'} onPress={() => openSheet('language')} iconName="language-outline" />
        </Section>

        <Section title="Data Management">
          <Row label="Reset Interval" value={formatRelativeResetLabel(settings.resetInterval)} onPress={() => openSheet('resetInterval')} iconName="refresh-circle-outline" />
          <Row 
            label="Stored Items" 
            value={`${tasksCount + categoriesCount}`}
            iconName="archive-outline"
            onPress={() => {}} // No-op row for consistency
          />
          <Row label="Reset Now" value="" onPress={() => openSheet('resetNow')} iconName="trash-outline" tone="danger" />
        </Section>
      </ScrollView>

      <SettingsOptionSheet visible={activeSheet === 'theme'} title="Theme" iconName="sunny-outline" options={THEMES} selectedValue={settings.theme} onClose={closeSheet} onSelect={(value) => updateSettings({ theme: value })} />
      <ColorOptionSheet visible={activeSheet === 'accentColor'} title="Accent Color" palettes={COLOR_PALETTES} selectedValue={settings.accentColor} onClose={closeSheet} onSelect={(value) => updateSettings({ accentColor: value })} />
      <SettingsOptionSheet visible={activeSheet === 'timeFormat'} title="Time Format" iconName="time-outline" options={TIME_FORMATS} selectedValue={settings.timeFormat} onClose={closeSheet} onSelect={(value) => updateSettings({ timeFormat: value })} />
      <SettingsOptionSheet visible={activeSheet === 'firstDayOfWeek'} title="First Day of the Week" iconName="calendar-clear-outline" options={FIRST_DAYS} selectedValue={settings.firstDayOfWeek} onClose={closeSheet} onSelect={(value) => updateSettings({ firstDayOfWeek: value })} />
      <SettingsOptionSheet visible={activeSheet === 'snoozeDuration'} title="Snooze Duration" iconName="alarm-outline" options={SNOOZE_DURATIONS} selectedValue={settings.snoozeDuration} onClose={closeSheet} onSelect={(value) => updateSettings({ snoozeDuration: value })} />
      <SettingsOptionSheet visible={activeSheet === 'defaultScreen'} title="Default Screen" iconName="layers-outline" options={DEFAULT_SCREENS} selectedValue={settings.defaultScreen} onClose={closeSheet} onSelect={(value) => updateSettings({ defaultScreen: value })} />
      <SettingsOptionSheet visible={activeSheet === 'language'} title="Language" iconName="language-outline" options={LANGUAGES} selectedValue={settings.language} onClose={closeSheet} onSelect={(value) => updateSettings({ language: value })} />
      <SettingsOptionSheet visible={activeSheet === 'resetInterval'} title="Reset Interval" iconName="refresh-circle-outline" options={RESET_OPTIONS} selectedValue={settings.resetInterval} onClose={closeSheet} onSelect={(value) => setResetInterval(value)} />
      <SettingsOptionSheet visible={activeSheet === 'resetNow'} title="Reset Now" iconName="trash-outline" options={RESET_ACTIONS} tone="danger" onClose={closeSheet} onSelect={handleResetSelection} />

      <ModernConfirmationModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.action}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
        iconName="trash-outline"
        confirmText="Confirm Reset"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { 
    fontFamily: AppFonts.bold, 
    fontSize: 34, 
    marginBottom: 24,
    marginTop: 4,
  },
  sectionWrap: { marginBottom: 18 },
  sectionHeading: { fontFamily: AppFonts.bold, fontSize: 16, marginBottom: 10 },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 70,
    paddingHorizontal: 16,
  },
  rowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  rowIconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  rowLabel: { fontFamily: AppFonts.semibold, fontSize: 16 },
  rowValueWrap: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rowValue: { fontFamily: AppFonts.medium, fontSize: 15 },
  colorPreview: {
    borderRadius: 10,
    height: 20,
    width: 20,
  },
});
