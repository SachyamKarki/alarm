import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const RECORDINGS_KEY = 'stored_recordings';
const ALARMS_KEY = 'stored_alarms';

export interface RecordingData {
  id: string;
  uri: string | number;
  name: string;
  days: string[];
}

// ✅ Default 5 built-in sounds (stored in /assets/default-songs/)
export const defaultRecordings: RecordingData[] = [
  {
    id: 'default-1',
    uri: require('../assets/default-songs/song1.mp3'),
    name: 'Default Audio 1',
    days: [],
  },
  {
    id: 'default-2',
    uri: require('../assets/default-songs/song2.mp3'),
    name: 'Default Audio 2',
    days: [],
  },
  {
    id: 'default-3',
    uri: require('../assets/default-songs/song3.mp3'),
    name: 'Default Audio 3',
    days: [],
  },
  {
    id: 'default-4',
    uri: require('../assets/default-songs/song4.mp3'),
    name: 'Default Audio 4',
    days: [],
  },
  {
    id: 'default-5',
    uri: require('../assets/default-songs/song5.mp3'),
    name: 'Default Audio 5',
    days: [],
  },
];

// ✅ Save new user recording
export async function saveRecording(recording: RecordingData): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(RECORDINGS_KEY);
    const recordings: RecordingData[] = existing ? JSON.parse(existing) : [];
    recordings.push(recording);
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  } catch (error) {
    console.error('Error saving recording:', error);
  }
}

// ✅ Get all recordings (default + user)
export async function getRecordings(): Promise<RecordingData[]> {
  try {
    const data = await AsyncStorage.getItem(RECORDINGS_KEY);
    const userRecordings: RecordingData[] = data ? JSON.parse(data) : [];
    return [...defaultRecordings, ...userRecordings];
  } catch (error) {
    console.error('Error getting recordings:', error);
    return defaultRecordings;
  }
}

// ✅ Delete recording and alarms (prevents deletion of default ones)
export async function deleteRecordingAndAlarms(uri: string): Promise<void> {
  try {
    // Check if it's a default recording
    const isDefault = defaultRecordings.some((r) => r.uri === uri);
    if (isDefault) {
      console.warn('Default recordings cannot be deleted.');
      return;
    }

    // Delete from user recordings
    const recordingData = await AsyncStorage.getItem(RECORDINGS_KEY);
    let recordings: RecordingData[] = recordingData ? JSON.parse(recordingData) : [];
    recordings = recordings.filter(r => r.uri !== uri);
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));

    // Delete related alarms
    const alarmData = await AsyncStorage.getItem(ALARMS_KEY);
    let alarms = alarmData ? JSON.parse(alarmData) : [];
    alarms = alarms.filter((alarm: any) => alarm.uri !== uri);
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));

    // Delete actual audio file (if not bundled)
    if (typeof uri === 'string') {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error('Error deleting recording and alarms:', error);
  }
}

// ✅ Update recording name (blocks default recordings)
export async function updateRecordingName(id: string, newName: string): Promise<void> {
  try {
    if (id.startsWith('default-')) {
      console.warn('Default recordings cannot be renamed.');
      return;
    }

    const existing = await AsyncStorage.getItem(RECORDINGS_KEY);
    const recordings: RecordingData[] = existing ? JSON.parse(existing) : [];
    const updated = recordings.map(r =>
      r.id === id ? { ...r, name: newName } : r
    );
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating recording name:', error);
  }
}

// ✅ Clear all user recordings (not default)
export async function clearRecordings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECORDINGS_KEY);
  } catch (error) {
    console.error('Error clearing recordings:', error);
  }
}
