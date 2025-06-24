import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  deleteRecordingAndAlarms,
  getRecordings,
  updateRecordingName,
} from '../../utils/recordingStore';

export default function Recordings() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRecordings();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const fetchRecordings = async () => {
    const data = await getRecordings();
    setRecordings(data);
  };

  const handleLongPress = (index: number) => {
    if (recordings[index].id.startsWith('default-')) return;
    setRenamingIndex(index);
    setNewName(recordings[index].name || '');
  };

  const handleRename = async () => {
    if (renamingIndex !== null) {
      const updated = [...recordings];
      updated[renamingIndex].name = newName;
      await updateRecordingName(updated[renamingIndex].id, newName);
      setRecordings(updated);
      setRenamingIndex(null);
    }
  };

  const confirmDelete = (uri: string, id: string) => {
    if (id.startsWith('default-')) {
      Alert.alert('Not allowed', 'Default recordings cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Recording',
      'This will also remove all alarms using this recording. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecordingAndAlarms(uri);
            await fetchRecordings();
          },
        },
      ]
    );
  };

  const togglePlayback = async (uri: string | number, index: number) => {
    try {
      if (playingIndex === index) {
        await soundRef.current?.pauseAsync();
        setPlayingIndex(null);
      } else {
        if (soundRef.current) await soundRef.current.unloadAsync();
        const { sound } = await Audio.Sound.createAsync(
          typeof uri === 'string' ? { uri } : uri
        );
        soundRef.current = sound;
        await sound.playAsync();
        setPlayingIndex(index);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.header}>Recordings</Text>
        <ScrollView style={styles.scroll}>
          {recordings.map((rec, index) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onLongPress={() => handleLongPress(index)}
              activeOpacity={0.8}
            >
              <View style={styles.topRow}>
                <Text style={styles.text}>
                  {rec.name ? rec.name : `Recording #${index + 1}`}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/setAlarm',
                        params: { uri: rec.uri, index: index.toString() },
                      })
                    }
                  >
                    <Feather name="clock" size={22} color="#00FFC2" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => togglePlayback(rec.uri, index)}>
                    <Ionicons
                      name={playingIndex === index ? 'pause-circle' : 'play-circle'}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(rec.uri, rec.id)}>
                    <AntDesign name="delete" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renamingIndex !== null && (
          <View style={styles.renameBox}>
            <TextInput
              style={styles.input}
              placeholder="Enter new name"
              placeholderTextColor="#aaa"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity onPress={handleRename} style={styles.renameButton}>
              <Text style={styles.renameText}>Rename</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'left',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  scroll: {
    paddingBottom: 100,
  },
  item: {
    backgroundColor: '#111',
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    shadowColor: '#333',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 17,
    color: '#fff',
    flex: 1,
    marginRight: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 100,
  },
  renameBox: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 14,
    elevation: 10,
    shadowColor: '#333',
    shadowOpacity: 0.2,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#444',
    marginBottom: 12,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 6,
  },
  renameButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  renameText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
