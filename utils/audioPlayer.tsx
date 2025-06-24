import { Audio } from 'expo-av';
import { defaultRecordings } from './recordingStore';

let defaultSound: Audio.Sound | null = null;

export async function playDefaultAudioById(defaultId: string): Promise<void> {
  try {
    const defaultItem = defaultRecordings.find(r => r.id === defaultId);
    if (!defaultItem) {
      console.warn('Default audio not found');
      return;
    }

    if (defaultSound) {
      await defaultSound.unloadAsync();
      defaultSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(defaultItem.uri as any); // ✅ Fix here
    defaultSound = sound;
    await sound.playAsync();
  } catch (error) {
    console.error('Error playing default audio:', error);
  }
}

export async function stopDefaultAudio(): Promise<void> {
  if (defaultSound) {
    try {
      await defaultSound.stopAsync();
    } catch (e) {}
    await defaultSound.unloadAsync();
    defaultSound = null;
  }
}
