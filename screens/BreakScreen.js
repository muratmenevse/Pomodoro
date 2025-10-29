import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import ScreenContainer from '../components/ScreenContainer';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';

const NORMAL_BREAK_DURATION = 300; // 5 minutes in seconds
const TEST_BREAK_DURATION = 10; // 10 seconds for testing

export default function BreakScreen({ navigation, route }) {
  const { onClose, test10SecondMode = false } = route.params || {};

  // Determine break duration based on test mode (only in dev)
  const breakDuration = (__DEV__ && test10SecondMode) ? TEST_BREAK_DURATION : NORMAL_BREAK_DURATION;

  const [timeInSeconds, setTimeInSeconds] = useState(breakDuration);
  const intervalRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Reset timer when screen mounts
  useEffect(() => {
    setTimeInSeconds(breakDuration);
  }, [breakDuration]);

  // Countdown logic
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeInSeconds((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current);
          handleClose(); // Return to main menu when break completes
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleClose = () => {
    navigation.goBack();
    if (onClose) onClose();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScreenContainer
      onClose={handleClose}
      title=""
      showCloseButton={false}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Relaxed Tomato Character with Coffee */}
        <View style={styles.characterContainer}>
          <TomatoCharacter
            state={CHARACTER_STATES.BREAK}
            size={140}
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
    marginBottom: 30,
    marginTop: 100,
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
