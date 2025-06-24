import * as Notifications from 'expo-notifications';
import { getAlarms } from './alarmStore';

let triggeredToday: Set<string> = new Set();

export const setupAlarmChecker = () => {
  const interval = setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    const alarms = await getAlarms();

    for (let alarm of alarms) {
      const [time, ampm] = alarm.time?.split(' ') ?? ['--:--', ''];
      const [alarmHourRaw, alarmMinute] = time.split(':').map(Number);

      let alarmHour = alarmHourRaw;
      if (ampm === 'PM' && alarmHour !== 12) alarmHour += 12;
      if (ampm === 'AM' && alarmHour === 12) alarmHour = 0;

      const isToday = alarm.days.includes(currentDay);
      const alarmId = `${alarm.id}-${currentDay}`;

      if (
        isToday &&
        alarmHour === currentHour &&
        alarmMinute === currentMinute &&
        !triggeredToday.has(alarmId)
      ) {
        triggeredToday.add(alarmId);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Alarm',
            body: alarm.name || 'Your alarm is ringing!',
            sound: 'default',
          },
          trigger: null,
        });
      }
    }

    // Reset triggers every day at midnight
    if (currentHour === 0 && currentMinute === 0) {
      triggeredToday.clear();
    }
  }, 60000); // check every 60 seconds

  return () => clearInterval(interval); // for cleanup
};
