import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SettingsOptionSheet } from "./settings-option-sheet";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";

type MonthSelectionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedValue: Date;
};

export function MonthSelectionSheet({
  visible,
  onClose,
  onSelect,
  selectedValue,
}: MonthSelectionSheetProps) {
  const colors = useAppTheme();
  const accent = colors.accent;

  const options = useMemo(() => {
    const list = [];
    const now = new Date();
    // Current month and previous 11 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      list.push({
        label,
        value: d.toISOString(), // Use ISO string as a stable value for comparison
        date: d,
      });
    }
    return list;
  }, []);

  const currentMonthISO = new Date(
    selectedValue.getFullYear(),
    selectedValue.getMonth(),
    1
  ).toISOString();

  return (
    <SettingsOptionSheet
      visible={visible}
      title="Select Month"
      iconName="calendar-outline"
      options={options.map((opt) => ({ label: opt.label, value: opt.value }))}
      selectedValue={currentMonthISO}
      onClose={onClose}
      onSelect={(val) => {
        const selected = options.find((o) => o.value === val);
        if (selected) {
          onSelect(selected.date);
        }
      }}
    />
  );
}
