import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useShoppingStore } from '@/store/use-task-store';

export function useAutoReset() {
  const hydrated = useShoppingStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    // Auto-reset has been removed. This hook is kept as a stub
    // for future use but currently does nothing.
    const subscription = AppState.addEventListener('change', () => {});
    return () => subscription.remove();
  }, [hydrated]);
}
