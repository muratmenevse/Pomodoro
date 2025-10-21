import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import TomatoCharacter from './components/TomatoCharacter';

export default function App() {
  // Load Poppins font - must be first
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const DEFAULT_MINUTES = 25;
  const MIN_MINUTES = 1;
  const MAX_MINUTES = 180;
  const [timeInSeconds, setTimeInSeconds] = useState(DEFAULT_MINUTES * 60);
  const [sliderMinutes, setSliderMinutes] = useState(DEFAULT_MINUTES);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const [sound, setSound] = useState(null);

  // Load and play notification sound
  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        // Using a free notification sound URL
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  // Show completion alert
  const showCompletionAlert = () => {
    Alert.alert(
      'Focus Complete! 🎉',
      'Great job! You completed your focus session.',
      [
        {
          text: 'OK',
          onPress: () => {
            setTimeInSeconds(DEFAULT_MINUTES * 60);
            setSliderMinutes(DEFAULT_MINUTES);
          },
        },
      ]
    );
  };

  // Cleanup sound
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Countdown logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            playNotificationSound();
            showCompletionAlert();
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
  }, [isRunning, isPaused]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartFocus = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeInSeconds(DEFAULT_MINUTES * 60);
    setSliderMinutes(DEFAULT_MINUTES);
  };

  const handleSliderChange = (value) => {
    const minutes = Math.round(value);
    setSliderMinutes(minutes);
    setTimeInSeconds(minutes * 60);
  };

  // Render buttons based on state
  const renderButtons = () => {
    if (!isRunning && !isPaused) {
      // Initial state: Show "Start Focus"
      return (
        <TouchableOpacity style={styles.button} onPress={handleStartFocus}>
          <Text style={styles.buttonText}>Start Focus</Text>
        </TouchableOpacity>
      );
    } else if (isRunning && !isPaused) {
      // Running state: Show "Pause"
      return (
        <TouchableOpacity style={styles.button} onPress={handlePause}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
      );
    } else {
      // Paused state: Show "Resume" and "Reset"
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleResume}>
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Show loading screen while fonts load
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tomato Character */}
      <TomatoCharacter size={180} />

      {/* Timer Display */}
      <Text style={styles.timerText}>{formatTime(timeInSeconds)}</Text>

      {/* Slider - only show when not running */}
      {!isRunning && !isPaused && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Set your focus time</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_MINUTES}
            maximumValue={MAX_MINUTES}
            value={sliderMinutes}
            onValueChange={handleSliderChange}
            step={1}
            minimumTrackTintColor="#FF7A59"
            maximumTrackTintColor="#D1D1D6"
            thumbTintColor="#FF7A59"
          />
        </View>
      )}

      {/* Buttons */}
      {renderButtons()}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1ED',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 72,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 40,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  resetButton: {
    backgroundColor: '#5B9BD5',
  },
  sliderContainer: {
    width: '85%',
    alignItems: 'center',
    marginBottom: 40,
  },
  sliderLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF7A59',
    marginTop: 10,
  },
});
