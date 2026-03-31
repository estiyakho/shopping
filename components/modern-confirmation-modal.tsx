import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

type ModernConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
  iconName?: keyof typeof Ionicons.glyphMap;
};

export function ModernConfirmationModal({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  tone = 'default',
  iconName = 'alert-circle-outline',
}: ModernConfirmationModalProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  
  const accentColor = tone === 'danger' ? colors.danger : colors.accent;
  const modalMaxHeight = Math.max(240, windowHeight - insets.top - insets.bottom - 48);
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2, 6, 23, 0.75)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View 
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(150)}
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.surfaceElevated, 
              borderColor: colors.border,
              maxHeight: Math.min(modalMaxHeight, windowHeight * 0.82),
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}16` }]}>
            <Ionicons color={accentColor} name={iconName} size={32} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

          <View style={styles.buttonContainer}>
            <Pressable 
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.button, 
                styles.cancelButton, 
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1 
                }
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{cancelText}</Text>
            </Pressable>

            <Pressable 
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.button, 
                styles.confirmButton, 
                { 
                  backgroundColor: accentColor,
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: accentColor,
                }
              ]}
            >
              <Text style={[styles.confirmButtonText, { color: colors.isLight ? '#0F172A' : '#FFFFFF' }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: AppFonts.medium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    height: 54,
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  confirmButtonText: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
});
