import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { requestNotificationPermissions } from '@/utils/notifications';

type NotificationOnboardingModalProps = {
  visible: boolean;
  onComplete: () => void;
};

export function NotificationOnboardingModal({ visible, onComplete }: NotificationOnboardingModalProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxCardHeight = Math.max(320, windowHeight - insets.top - insets.bottom - 48);

  const handleAllow = async () => {
    await requestNotificationPermissions();
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal animationType="none" transparent visible={visible} statusBarTranslucent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(400)} 
          exiting={FadeOut.duration(300)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2, 6, 23, 0.85)' }]}
        />

        <Animated.View 
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(150)}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              maxHeight: Math.min(maxCardHeight, windowHeight * 0.9),
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.accent}16` }]}>
              <Ionicons color={colors.accent} name="notifications-outline" size={48} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Stay on Schedule</Text>
            <Text style={[styles.description, { color: colors.textSoft }]}>
              Enable notifications to receive timely reminders for your scheduled tasks and never miss a deadline again.
            </Text>

            <View style={styles.features}>
              <Feature icon="alarm-outline" text="Smart Reminders" color={colors.accent} />
              <Feature icon="refresh-outline" text="Automatic Snooze" color={colors.accent} />
              <Feature icon="checkmark-done-outline" text="Task Updates" color={colors.accent} />
            </View>

            <View style={styles.actions}>
              <Pressable 
                onPress={handleAllow}
                style={({ pressed }) => [
                  styles.primaryButton, 
                  { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={styles.primaryButtonText}>Enable Reminders</Text>
              </Pressable>
              
              <Pressable 
                onPress={handleSkip}
                style={({ pressed }) => [
                  styles.secondaryButton, 
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Maybe Later</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Feature({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  const colors = useAppTheme();
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}16` }]}>
        <Ionicons color={color} name={icon} size={18} />
      </View>
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardContent: {
    padding: 28,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 30,
    height: 86,
    justifyContent: 'center',
    marginBottom: 24,
    width: 86,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: AppFonts.medium,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  features: {
    alignSelf: 'stretch',
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  featureText: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontFamily: AppFonts.bold,
    fontSize: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
});
