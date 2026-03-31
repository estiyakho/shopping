import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useTaskStore } from '@/store/use-task-store';

export function useAutoReset() {
  const hydrated = useTaskStore((state) => state.hydrated);
  const checkAndResetTasks = useTaskStore((state) => state.checkAndResetTasks);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    checkAndResetTasks();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        checkAndResetTasks();
      }
    });

    return () => subscription.remove();
  }, [checkAndResetTasks, hydrated]);
}
