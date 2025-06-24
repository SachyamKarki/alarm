import MaskedView from '@react-native-masked-view/masked-view';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Image, StatusBar, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export default function Index() {
  const router = useRouter();

  const scale = useSharedValue(0.3);
  const translateY = useSharedValue(-300);
  const carOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.6);
  const textTranslateY = useSharedValue(20);

  // Add persistent background style
  const bgStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const carStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: carOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }, { translateY: textTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }, { translateY: textTranslateY.value + 10 }],
  }));

  useEffect(() => {
    let sound: Audio.Sound;

    // Hide status bar on mount
    StatusBar.setHidden(true, 'fade');

    const playSound = async () => {
      try {
        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require('../assets/default-songs/loading.mp3'),
          { shouldPlay: true }
        );
        sound = loadedSound;
        await sound.setVolumeAsync(0.5);
      } catch (e) {
        console.error('Sound error:', e);
      }
    };

    playSound();

    // Block Android back button during splash
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );

    // Entrance animations
    carOpacity.value = withTiming(1, { duration: 1000 });
    translateY.value = withTiming(0, { duration: 1800, easing: Easing.out(Easing.exp) });
    scale.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.exp) });

    // Pop-in text
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 800 });
      textScale.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.exp),
      });
      textTranslateY.value = withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.exp),
      });
    }, 1000);

    // Exit sequence
    const exitTimeout = setTimeout(() => {
      const textFadeDuration = 800;
      const carZoomDuration = 700;

      // Fade out text BEFORE car zoom
      textOpacity.value = withTiming(0, { duration: textFadeDuration, easing: Easing.inOut(Easing.ease) });
      textTranslateY.value = withTiming(20, { duration: textFadeDuration, easing: Easing.out(Easing.exp) });
      textScale.value = withTiming(0.9, { duration: textFadeDuration, easing: Easing.out(Easing.exp) });

      // Then zoom car after short wait
      setTimeout(() => {
        scale.value = withTiming(1.6, { duration: carZoomDuration, easing: Easing.out(Easing.exp) });
        translateY.value = withTiming(80, { duration: carZoomDuration, easing: Easing.out(Easing.exp) });
        carOpacity.value = withTiming(0, { duration: carZoomDuration, easing: Easing.inOut(Easing.ease) });

        // Then fade screen
        setTimeout(() => {
          screenOpacity.value = withTiming(0, { duration: 800 });

          if (sound) {
            sound.setVolumeAsync(0.1);
            setTimeout(async () => {
              await sound.stopAsync();
              await sound.unloadAsync();
            }, 600);
          }

          setTimeout(() => {
            // Show status bar before navigating
            StatusBar.setHidden(false, 'fade');
            router.replace('/(tabs)/home');
          }, 1000);
        }, carZoomDuration);
      }, textFadeDuration + 100);
    }, 3000);

    return () => {
      // Clean up
      backHandler.remove();
      clearTimeout(exitTimeout);
      if (sound) sound.unloadAsync();
    };
  }, []);

  return (
    <>
      {/* Persistent black background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.background, bgStyle]} />
      
      <Animated.View style={[styles.container, screenStyle]}>
        <Animated.View style={carStyle}>
          <Image
            source={require('../assets/images/loading2.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Gradient LFG */}
        <MaskedView
          maskElement={
            <Animated.Text style={[styles.title, textStyle]}>
              LFG
            </Animated.Text>
          }
        >
          <LinearGradient
            colors={['orange', 'yellow', 'orange']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Animated.Text style={[styles.title, { opacity: 0 }]}>
              LFG
            </Animated.Text>
          </LinearGradient>
        </MaskedView>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Made for Car Enthusiasts
        </Animated.Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000', // Changed to transparent
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 260,
    height: 260,
  },
  title: {
    marginTop: 20,
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    marginTop: 6,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});