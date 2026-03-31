import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useShoppingStore } from '@/store/use-task-store';

export function useAutoReset() {
  const hydrated = useShoppingStore((state) => state.hydrated);
  const checkAndResetItems = useShoppingStore((state) => state.checkAndResetItems);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // Run on mount
    checkAndResetItems();

    // Run when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndResetItems();
      }
    });

    return () => subscription.remove();
  }, [checkAndResetItems, hydrated]);
}
