import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupNotificationChannel } from '../utils/notifications';

export default function Layout() {
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  return (
    <SafeAreaProvider>
      {/* Global StatusBar config */}
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 🔧 This wrapper ensures black background between transitions */}
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
