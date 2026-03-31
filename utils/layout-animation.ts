import { LayoutAnimation, Platform, UIManager } from 'react-native';

// LayoutAnimation setup is required for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function runListAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function runSpringAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
}
