export type ShoppingItemStatus = 'todo' | 'done' | 'not-available';

export type ResetInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AppTheme = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type FirstDayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';
export type SnoozeDuration = 5 | 10 | 15 | 30;
export type DefaultScreen = 'categories' | 'todos' | 'calendar' | 'statistics' | 'settings';
export type Language = 'english' | 'spanish' | 'french';

export type Category = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  orderIndex?: number;
};

export type ShoppingItem = {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  status: ShoppingItemStatus;
  createdAt: string;
  isArchived?: boolean;
  resetInterval?: ResetInterval;
  lastResetAt?: string;
  history?: ShoppingItemHistoryEntry[];
  orderIndex?: number;
  price?: number;
};

export type Settings = {
  statsResetAt: string | null;
  theme: AppTheme;
  amoledTheme: boolean;
  accentColor: string;
  timeFormat: TimeFormat;
  firstDayOfWeek: FirstDayOfWeek;
  snoozeDuration: SnoozeDuration;
  defaultScreen: DefaultScreen;
  language: Language;
  currency: 'USD' | 'BDT';
  hasCompletedNotificationOnboarding: boolean;
};

export type ScheduledShoppingItem = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date (YYYY-MM-DD)
  time?: string; // ISO time or HH:mm
  notificationId?: string;
  snoozeId?: string;
  createdAt: string;
};

export type ShoppingItemHistoryEntry = {
  id: string;
  taskId: string;
  title: string;
  categoryId?: string; // Track which category this item was in when completed
  date: string; // ISO date (YYYY-MM-DD)
  completedAt: string; // ISO string 
  price?: number;
};

