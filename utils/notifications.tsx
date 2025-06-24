import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set global handler for incoming notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Setup notification channel for Android + request permissions for Web
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'Alarm Notifications',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (Platform.OS === 'web') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Web notification permission not granted.');
    }
  }
}

// Trigger notification across platforms
export async function showAlarmNotification(title: string, body: string) {
  if (Platform.OS === 'web') {
    // Web-specific browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } else {
      console.warn('Web notification not shown. Permission not granted or unsupported.');
    }
  } else {
    // Android/iOS using expo-notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null, // Trigger immediately
    });
  }
}
