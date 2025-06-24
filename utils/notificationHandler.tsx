import * as Notifications from 'expo-notifications';

// Set global handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Add action listener
export function setupNotificationListeners() {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const action = response.actionIdentifier;
    const notificationId = response.notification.request.identifier;

    if (action === 'SNOOZE') {
      // Schedule snoozed alarm for 5 mins later
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Snoozed Alarm',
          body: 'It’s time again!',
          sound: 'default',
          categoryIdentifier: 'alarm',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 300 }, // 5 mins
      });
    }

    if (action === 'STOP') {
      // Stop and remove notification
      await Notifications.dismissNotificationAsync(notificationId);
      console.log('Alarm stopped and notification dismissed.');
      // You can also stop playing audio here if needed
    }
  });
}
