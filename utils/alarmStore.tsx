import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AlarmData {
  id: string;
  uri: string;
  name: string;
  time?: string;
  days: string[];
}

const ALARM_KEY = 'stored_alarms';

// Save a new alarm
export const saveAlarm = async (alarm: AlarmData): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(ALARM_KEY);
    const alarms: AlarmData[] = existing ? JSON.parse(existing) : [];
    alarms.push(alarm);
    await AsyncStorage.setItem(ALARM_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.error('Error saving alarm:', error);
  }
};

// Get all alarms
export const getAlarms = async (): Promise<AlarmData[]> => {
  try {
    const data = await AsyncStorage.getItem(ALARM_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting alarms:', error);
    return [];
  }
};

// Delete alarm(s) by matching URI
export const deleteAlarmOnly = async (uri: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(ALARM_KEY);
    const alarms: AlarmData[] = existing ? JSON.parse(existing) : [];
    const updatedAlarms = alarms.filter(alarm => alarm.uri !== uri);
    await AsyncStorage.setItem(ALARM_KEY, JSON.stringify(updatedAlarms));
  } catch (error) {
    console.error('Error deleting alarm:', error);
  }
};

// Update alarm name using ID
export const updateRecordingName = async (id: string, newName: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(ALARM_KEY);
    const alarms: AlarmData[] = existing ? JSON.parse(existing) : [];
    const updated = alarms.map(alarm =>
      alarm.id === id ? { ...alarm, name: newName } : alarm
    );
    await AsyncStorage.setItem(ALARM_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating recording name:', error);
  }
};

// Clear all alarms
export const clearAlarms = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ALARM_KEY);
  } catch (error) {
    console.error('Error clearing alarms:', error);
  }
};

// Optional: Get all alarms using a specific URI
export const getAlarmsByUri = async (uri: string): Promise<AlarmData[]> => {
  try {
    const allAlarms = await getAlarms();
    return allAlarms.filter(alarm => alarm.uri === uri);
  } catch (error) {
    console.error('Error filtering alarms by URI:', error);
    return [];
  }
};
