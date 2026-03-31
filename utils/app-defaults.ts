import { Category, Settings } from '@/types/task';

export const DEFAULT_CATEGORIES: Category[] = [];

export const DEFAULT_SETTINGS: Settings = {
  statsResetAt: null,
  theme: 'dark',
  amoledTheme: false,
  accentColor: '#8B7CF6',
  timeFormat: '12h',
  firstDayOfWeek: 'saturday',
  snoozeDuration: 10,
  defaultScreen: 'todos',
  language: 'english',
  currency: 'USD',
  hasCompletedNotificationOnboarding: false,
};
