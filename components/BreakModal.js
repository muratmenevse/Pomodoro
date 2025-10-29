import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import StandardModal from './StandardModal';
import TomatoCharacter from './TomatoCharacter';
import { CHARACTER_STATES } from './characterStates';

const BREAK_DURATION = 300; // 5 minutes in seconds

export default function BreakModal({ visible, onClose }) {
  const [timeInSeconds, setTimeInSeconds] = useState(BREAK_DURATION);
  const intervalRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Reset timer when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeInSeconds(BREAK_DURATION);
    }
  }, [visible]);

  // Countdown logic
  useEffect(() => {
    if (visible) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            onClose(); // Return to main menu when break completes
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, onClose]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
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
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.stopButtonText}>Stop Break</Text>
        </TouchableOpacity>
      </View>
    </StandardModal>
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
