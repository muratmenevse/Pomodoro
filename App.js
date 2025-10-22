import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { RulerPicker } from 'react-native-ruler-picker';
import { Audio } from 'expo-av';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TomatoCharacter from './components/TomatoCharacter';
import CategorySelectionModal from './components/CategorySelectionModal';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive size calculations
const TOMATO_SIZE = Math.min(SCREEN_WIDTH * 0.4, 180);
const TIMER_FONT_SIZE = Math.min(SCREEN_WIDTH * 0.18, 72);
const BUTTON_FONT_SIZE = Math.min(SCREEN_WIDTH * 0.045, 18);
const SLIDER_LABEL_SIZE = Math.min(SCREEN_WIDTH * 0.04, 16);
const CONTAINER_PADDING = SCREEN_WIDTH * 0.05;

// Category configuration
const CATEGORIES = [
  { name: 'Focus', color: '#00BCD4', defaultMinutes: 25 },
  { name: 'Study', color: '#5B9BD5', defaultMinutes: 45 },
  { name: 'Work', color: '#4CAF50', defaultMinutes: 5 },
  { name: 'Read', color: '#9C27B0', defaultMinutes: 30 },
];

// AsyncStorage key
const CATEGORY_STORAGE_KEY = '@selected_category';

export default function App() {
  // Load Poppins font - must be first
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const DEFAULT_MINUTES = 25;
  const MIN_MINUTES = 5;
  const MAX_MINUTES = 180;

  // Initialize with Work category's default time (5 minutes)
  const initialCategory = CATEGORIES.find(cat => cat.name === 'Work');
  const initialMinutes = initialCategory ? initialCategory.defaultMinutes : DEFAULT_MINUTES;

  const [timeInSeconds, setTimeInSeconds] = useState(initialMinutes * 60);
  const [sliderMinutes, setSliderMinutes] = useState(initialMinutes);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const [sound, setSound] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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

  // Load saved category on app start
  useEffect(() => {
    const loadSavedCategory = async () => {
      try {
        const savedCategory = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
        if (savedCategory && CATEGORIES.find(cat => cat.name === savedCategory)) {
          handleCategoryChange(savedCategory);
        }
      } catch (error) {
        console.log('Error loading category:', error);
      }
    };

    loadSavedCategory();
  }, []);

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

  // Get category color
  const getCategoryColor = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.color : '#FF7A59';
  };

  // Handle category change
  const handleCategoryChange = async (categoryName) => {
    setSelectedCategory(categoryName);
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    if (category) {
      const minutes = category.defaultMinutes;
      setSliderMinutes(minutes);
      setTimeInSeconds(minutes * 60);

      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, categoryName);
      } catch (error) {
        console.log('Error saving category:', error);
      }
    }
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
        <TouchableOpacity style={styles.singleButton} onPress={handleStartFocus}>
          <Text style={styles.buttonText}>Start Focus</Text>
        </TouchableOpacity>
      );
    } else if (isRunning && !isPaused) {
      // Running state: Show "Pause"
      return (
        <TouchableOpacity style={styles.singleButton} onPress={handlePause}>
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
      <TomatoCharacter size={TOMATO_SIZE} />

      {/* Timer Display */}
      <Text style={styles.timerText}>{formatTime(timeInSeconds)}</Text>

      {/* Category Label */}
      <TouchableOpacity
        style={[styles.categoryPill, { backgroundColor: getCategoryColor(selectedCategory) }]}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={styles.categoryLabel}>{selectedCategory}</Text>
      </TouchableOpacity>

      {/* Ruler Picker - only show when not running */}
      {!isRunning && !isPaused && (
        <View style={styles.rulerContainer}>
          <RulerPicker
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={5}
            fractionDigits={0}
            initialValue={sliderMinutes}
            onValueChange={handleSliderChange}
            onValueChangeEnd={handleSliderChange}
            unit=""
            height={100}
            indicatorColor="#FF7A59"
            width={SCREEN_WIDTH}
            indicatorHeight={60}
            valueTextStyle={{ fontSize: 0, height: 0, width: 0 }}
          />
        </View>
      )}

      {/* Buttons */}
      {renderButtons()}

      {/* Category Selection Modal */}
      <CategorySelectionModal
        visible={showCategoryModal}
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelect={handleCategoryChange}
        onClose={() => setShowCategoryModal(false)}
      />

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1ED',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: SCREEN_HEIGHT * 0.12,
  },
  timerText: {
    fontSize: TIMER_FONT_SIZE,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 30,
  },
  categoryLabel: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  singleButton: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: SCREEN_WIDTH * 0.12,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 45,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 10,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: BUTTON_FONT_SIZE,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.85,
    paddingHorizontal: CONTAINER_PADDING,
    marginTop: 45,
  },
  resetButton: {
    backgroundColor: '#5B9BD5',
  },
  rulerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  sliderLabel: {
    fontSize: SLIDER_LABEL_SIZE,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginBottom: 20,
  },
});
