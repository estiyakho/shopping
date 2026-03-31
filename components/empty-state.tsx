import { StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  const colors = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontFamily: AppFonts.semibold,
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
