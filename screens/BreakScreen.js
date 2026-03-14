import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';

const TOMATO_SIZE = Math.max(110, Math.min(Dimensions.get('window').width * 0.4, 260));
const NORMAL_BREAK_DURATION = 300; // 5 minutes in seconds
const TEST_BREAK_DURATION = 10; // 10 seconds for testing

export default function BreakScreen({ navigation, route }) {
  const { test10SecondMode = false } = route.params || {};

  // Determine break duration based on test mode (only in dev)
  const breakDuration = (__DEV__ && test10SecondMode) ? TEST_BREAK_DURATION : NORMAL_BREAK_DURATION;

  const [timeInSeconds, setTimeInSeconds] = useState(breakDuration);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(Date.now() + breakDuration * 1000);
  const completedRef = useRef(false);
  const notificationIdRef = useRef(null);
  const wasInBackgroundRef = useRef(false);
  const [sound, setSound] = useState();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Play notification sound
  const playNotificationSound = async () => {
    try {
      const soundEnabled = await AsyncStorage.getItem('@sound_enabled');
      if (soundEnabled === 'false') return;

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/successSound.m4a')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  // Wall-clock countdown logic
  useEffect(() => {
    endTimeRef.current = Date.now() + breakDuration * 1000;
    setTimeInSeconds(breakDuration);

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        if (completedRef.current) return;
        completedRef.current = true;
        setTimeInSeconds(0);
        // Only play expo-av sound if break completed in foreground
        // If app was in background, the scheduled notification already played the sound
        if (!wasInBackgroundRef.current) {
          if (notificationIdRef.current) {
            Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
          }
          playNotificationSound();
        }
        wasInBackgroundRef.current = false;
        setTimeout(() => handleClose(), 0);
      } else {
        setTimeInSeconds(remaining);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [breakDuration]);

  // Track app background state so interval knows whether to play sound
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        wasInBackgroundRef.current = true;
      } else if (nextAppState === 'active' && wasInBackgroundRef.current) {
        // Keep flag true only if break expired while in background
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining > 0) {
          wasInBackgroundRef.current = false;
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Recalculate remaining time when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          if (completedRef.current) return;
          completedRef.current = true;
          setTimeInSeconds(0);
          // Background return: notification already played sound, just navigate
          setTimeout(() => handleClose(), 0);
        } else {
          setTimeInSeconds(remaining);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Schedule push notification with sound for break completion
  useEffect(() => {
    const schedule = async () => {
      try {
        const soundEnabled = await AsyncStorage.getItem('@sound_enabled');
        const triggerDate = new Date(endTimeRef.current);
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Break is over!',
            body: 'Time to focus',
            ...(soundEnabled !== 'false' && { sound: 'successSound.m4a' }),
          },
          trigger: { type: 'date', date: triggerDate },
        });
        notificationIdRef.current = id;
      } catch (error) {
        console.log('Error scheduling break notification:', error);
      }
    };
    schedule();

    return () => {
      if (notificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      }
    };
  }, [breakDuration]);

  // Cleanup sound on unmount
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScreenContainer
      onClose={handleClose}
      title=""
      showCloseButton={false}
      scrollable={false}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Relaxed Tomato Character with Coffee */}
        <View style={styles.characterContainer}>
          <TomatoCharacter
            state={CHARACTER_STATES.BREAK}
            size={TOMATO_SIZE}
          />
        </View>

        {/* Timer Display */}
        <Text style={styles.timerText}>{formatTime(timeInSeconds)}</Text>

        {/* Stop Break Button */}
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.stopButtonText}>Stop Break</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterContainer: {
    marginBottom: 50,
    marginTop: -90,
  },
  timerText: {
    fontSize: 64,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 50,
    letterSpacing: 2,
  },
  stopButton: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
