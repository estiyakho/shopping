import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { DefaultScreen } from '@/types/task';

const ROUTES: Record<DefaultScreen, '/categories' | '/todos' | '/calendar' | '/statistics' | '/settings'> = {
  categories: '/categories',
  todos: '/todos',
  calendar: '/calendar',
  statistics: '/statistics',
  settings: '/settings',
};

export default function IndexScreen() {
  const colors = useAppTheme();
  const hydrated = useTaskStore((state) => state.hydrated);
  const defaultScreen = useTaskStore((state) => state.settings.defaultScreen);

  if (!hydrated) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={ROUTES[defaultScreen]} />;
}
