import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleReminderNotification(
  title: string,
  body: string,
  date: string,
  time: string,
  snoozeMinutes: number
) {
  const scheduledDate = new Date(`${date}T${time}`);
  
  // Don't schedule if date is in the past
  if (scheduledDate.getTime() <= Date.now()) {
    return { notificationId: undefined, snoozeId: undefined };
  }

  // Schedule Primary Notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 Reminder: ${title}`,
      body: body || 'You have a scheduled reminder.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledDate,
    },
  });

  // Schedule Snooze (Backup) Notification
  let snoozeId: string | undefined;
  if (snoozeMinutes > 0) {
    const snoozeDate = new Date(scheduledDate.getTime() + snoozeMinutes * 60000);
    snoozeId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏳ Snooze: ${title}`,
        body: body || 'Following up on your reminder.',
        sound: true,
      },
      trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
    },
    });
  }

  return { notificationId, snoozeId };
}

export async function cancelNotification(id?: string) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
