import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteAlarmOnly, saveAlarm } from '../../utils/alarmStore';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function SetAlarmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const uri = params.uri as string;
  const index = params.index ? parseInt(params.index as string) : 0;

  const [hour, setHour] = useState(4);
  const [minute, setMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);
  const [hourPickerPosition, setHourPickerPosition] = useState({ top: 0, left: 0 });
  const [minutePickerPosition, setMinutePickerPosition] = useState({ top: 0, left: 0 });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const increaseHour = () => setHour((prev) => (prev % 12) + 1);
  const decreaseHour = () => setHour((prev) => (prev - 1 <= 0 ? 12 : prev - 1));
  const increaseMinute = () => setMinute((prev) => (prev + 5) % 60);
  const decreaseMinute = () => setMinute((prev) => (prev - 5 + 60) % 60);

  const handleSave = async () => {
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')} ${isAM ? 'AM' : 'PM'}`;

    const alarmData = {
      id: `${Date.now()}`,
      name: `Alarm #${index + 1}`,
      time: formattedTime,
      days: selectedDays.length === 0 ? ['EVERYDAY'] : selectedDays,
      uri,
    };

    await saveAlarm(alarmData);
    router.replace('/(tabs)/home');
  };

  const handleDelete = async () => {
    await deleteAlarmOnly(uri);
    router.push('/(tabs)/home');
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
      if (gestureState.dx > 50) {
        router.push('/(tabs)/home');
      }
    },
  });

  const renderWheelPicker = (data: number[], onSelect: (value: number) => void) => (
    <View style={styles.wheelContainer}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item)}>
            <Text style={styles.wheelItem}>{item.toString().padStart(2, '0')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView {...panResponder.panHandlers} contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Set Time</Text>

        <View style={styles.timeRow}>
          <View
            style={styles.timeColEnhanced}
            onLayout={(event) => {
              const { y, x } = event.nativeEvent.layout;
              setHourPickerPosition({ top: y + 90, left: x });
            }}
          >
            <TouchableOpacity onPress={increaseHour}>
              <Text style={styles.adjustBtn}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHourPicker(true)}>
              <Text style={styles.timeText}>{hour.toString().padStart(2, '0')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={decreaseHour}>
              <Text style={styles.adjustBtn}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.colon}>:</Text>

          <View
            style={styles.timeColEnhanced}
            onLayout={(event) => {
              const { y, x } = event.nativeEvent.layout;
              setMinutePickerPosition({ top: y + 90, left: x });
            }}
          >
            <TouchableOpacity onPress={increaseMinute}>
              <Text style={styles.adjustBtn}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMinutePicker(true)}>
              <Text style={styles.timeText}>{minute.toString().padStart(2, '0')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={decreaseMinute}>
              <Text style={styles.adjustBtn}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ampmContainer}>
          <TouchableOpacity
            style={[styles.ampmToggle, isAM && styles.activeToggle]}
            onPress={() => setIsAM(true)}
          >
            <Text style={[styles.toggleText, isAM && styles.activeText]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ampmToggle, !isAM && styles.activeToggle]}
            onPress={() => setIsAM(false)}
          >
            <Text style={[styles.toggleText, !isAM && styles.activeText]}>PM</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showHourPicker} transparent animationType="fade">
          <View style={[styles.modalOverlay, { top: hourPickerPosition.top, left: hourPickerPosition.left }]}>
            {renderWheelPicker(Array.from({ length: 12 }, (_, i) => i + 1), (value) => {
              setHour(value);
              setShowHourPicker(false);
            })}
          </View>
        </Modal>

        <Modal visible={showMinutePicker} transparent animationType="fade">
          <View style={[styles.modalOverlay, { top: minutePickerPosition.top, left: minutePickerPosition.left }]}>
            {renderWheelPicker(Array.from({ length: 60 }, (_, i) => i), (value) => {
              setMinute(value);
              setShowMinutePicker(false);
            })}
          </View>
        </Modal>

        <Text style={styles.subHeading}>Days</Text>
        <View style={styles.daysContainer}>
          {weekdays.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => toggleDay(day)}
              style={[styles.dayButton, selectedDays.includes(day) && styles.daySelected]}
            >
              <Text style={[styles.dayText, selectedDays.includes(day) && styles.dayTextSelected]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.bigButton} onPress={handleSave}>
            <View style={styles.iconCircle}>
              <Ionicons name="alarm" size={24} color="#fff" />
            </View>
            <Text style={styles.bigButtonText}>SET</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigButton} onPress={handleDelete}>
            <View style={[styles.iconCircle, { backgroundColor: '#fff', borderColor: 'red', borderWidth: 2 }]}>
              <AntDesign name="delete" size={24} color="red" />
            </View>
            <Text style={styles.bigButtonText}>DELETE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flexGrow: 1,
    padding: 24,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeColEnhanced: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 10,
  },
  adjustBtn: {
    color: '#888',
    fontSize: 20,
    marginVertical: 5,
  },
  colon: {
    fontSize: 40,
    color: '#fff',
    marginHorizontal: 5,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  ampmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  ampmToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  toggleText: {
    color: '#aaa',
    fontSize: 16,
  },
  activeToggle: {
    backgroundColor: 'red',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subHeading: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 40,
    justifyContent: 'center',
  },
  dayButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    margin: 6,
  },
  daySelected: {
    backgroundColor: 'red',
  },
  dayText: {
    color: '#000',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  bigButton: {
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: 'red',
    borderRadius: 100,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#000000cc',
    borderRadius: 10,
  },
  wheelContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
    maxHeight: '40%',
    width: 90,
  },
  wheelItem: {
    fontSize: 25,
    textAlign: 'center',
    paddingVertical: 10,
  },
});