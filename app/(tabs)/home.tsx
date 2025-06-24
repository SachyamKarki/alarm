import { AntDesign } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { setupAlarmChecker } from '../../utils/alarmScheduler';
import { AlarmData, getAlarms } from '../../utils/alarmStore';
import { saveRecording } from '../../utils/recordingStore';

const MAX_RECORDING_DURATION = 5 * 60 * 1000;

export default function RecorderScreen() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [recordings, setRecordings] = useState<AlarmData[]>([]);
  const [activeSwitches, setActiveSwitches] = useState<boolean[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fadeIn = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isFocused = useIsFocused();
  const router = useRouter();

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 600 });
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAlarms = async () => {
      const alarms = await getAlarms();
      setRecordings(alarms);
      setActiveSwitches(Array(alarms.length).fill(true));
      setLoaded(true);
    };
    if (isFocused) {
      loadAlarms();
    }
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [isFocused]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('alarm', {
        name: 'Alarm',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    const clearAlarmInterval = setupAlarmChecker();
    return () => clearAlarmInterval();
  }, []);

  const toggleSwitch = (index: number) => {
    const updated = [...activeSwitches];
    updated[index] = !updated[index];
    setActiveSwitches(updated);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const uri = FileSystem.documentDirectory + `recording-${Date.now()}.m4a`;

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
        },
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setTimeout(stopRecording, MAX_RECORDING_DURATION);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    await recordingRef.current.stopAndUnloadAsync();
    const fullURI = recordingRef.current.getURI();
    recordingRef.current = null;

    if (fullURI) {
      const relativePath = fullURI.replace(FileSystem.documentDirectory || '', '');
      router.push({ pathname: '/setAlarm', params: { uri: relativePath } });
      const timestamp = Date.now();
      await saveRecording({
        id: timestamp.toString(),
        uri: relativePath,
        name: `Recording #${timestamp}`,
        days: [],
      });
    }
  };

  const playAudio = async (relativePath: string | number) => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();

      let sound;
      if (typeof relativePath === 'number') {
        sound = await Audio.Sound.createAsync(relativePath);
      } else {
        const absolutePath = FileSystem.documentDirectory + relativePath;
        const fileInfo = await FileSystem.getInfoAsync(absolutePath);
        if (!fileInfo.exists) {
          console.warn('File not found:', absolutePath);
          return;
        }
        sound = await Audio.Sound.createAsync({ uri: absolutePath });
      }

      soundRef.current = sound.sound;
      await sound.sound.playAsync();
    } catch (e) {
      console.error('Error playing audio:', e);
    }
  };

  const stopAudio = async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
    } catch (e) {}
  };

  return (
    <Animated.View style={[styles.safe, fadeStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Text style={styles.time}>{currentTime}</Text>
        <Text style={styles.date}>{currentDate}</Text>

        <TouchableOpacity
          style={styles.recordButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <AntDesign
            name={isRecording ? 'pausecircle' : 'sound'}
            size={28}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Recording' : 'Record'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.alarmsHeading}>Alarms</Text>
        <ScrollView style={styles.recordingList}>
          {!loaded ? (
            <Text style={styles.noRecordings}>Loading alarms...</Text>
          ) : recordings.length === 0 ? (
            <Text style={styles.noRecordings}>No recordings found.</Text>
          ) : (
            recordings.map((item: AlarmData, index: number) => {
              const [hourMin, ampm] = item.time?.split(' ') ?? ['--:--', ''];
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.item}
                  onPress={() =>
                    router.push({
                      pathname: '/setAlarm',
                      params: { uri: item.uri, index: index.toString() },
                    })
                  }
                  onLongPress={() => playAudio(item.uri)}
                  onPressOut={stopAudio}
                >
                  <View style={styles.row}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                      <Text style={styles.timeText}>{hourMin}</Text>
                      <Text style={styles.ampm}>{ampm}</Text>
                    </View>
                    <View style={styles.rightControls}>
                      <Switch
                        value={activeSwitches[index]}
                        onValueChange={() => toggleSwitch(index)}
                      />
                    </View>
                  </View>
                  <View style={styles.daysContainer}>
                    {item.days.map((day, i) => (
                      <Text key={i} style={styles.dayText}>
                        {day}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    paddingTop: 20,
    alignItems: 'center',
    flex: 1,
    marginTop:60,
  },
  time: {
    fontSize: 42,
    color: '#fff',
    fontWeight: '600',
  },
  date: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 6,
    letterSpacing: 1.2,
  },
  recordButton: {
    flexDirection: 'row',
    backgroundColor: 'red',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 50,
    marginBottom: 50,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  alarmsHeading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  recordingList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  item: {
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    paddingVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '300',
  },
  ampm: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 6,
    marginBottom: 6,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayText: {
    color: '#aaa',
    fontSize: 13,
    marginRight: 8,
  },
  noRecordings: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
});
