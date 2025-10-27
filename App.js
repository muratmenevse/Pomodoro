import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { RulerPicker } from 'react-native-ruler-picker';
import { Audio } from 'expo-av';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TomatoCharacter from './components/TomatoCharacter';
import CategorySelectionModal from './components/CategorySelectionModal';
import AddCategoryModal from './components/AddCategoryModal';
import ConfirmationModal from './components/ConfirmationModal';
import { CHARACTER_STATES } from './components/characterStates';
import { useModalManager } from './contexts/ModalContext';
import CharacterTestScreen from './screens/CharacterTestScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProgressScreen from './screens/ProgressScreen';
import { MembershipProvider, useMembership } from './contexts/MembershipContext';
import { ModalProvider } from './contexts/ModalContext';
import UpgradePromptModal from './components/UpgradePromptModal';
import HamburgerMenu from './components/HamburgerMenu';
import TestSettingsModal from './components/TestSettingsModal';
import RevenueCatService from './services/RevenueCatService';
import Svg, { Path } from 'react-native-svg';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive size calculations with min/max bounds
const TOMATO_SIZE = Math.max(110, Math.min(SCREEN_WIDTH * 0.4, 260));
const TIMER_FONT_SIZE = Math.max(44, Math.min(SCREEN_WIDTH * 0.18, 96));
const BUTTON_FONT_SIZE = Math.max(16, Math.min(SCREEN_WIDTH * 0.045, 22));
const BUTTON_PADDING_HORIZONTAL = Math.max(24, Math.min(SCREEN_WIDTH * 0.12, 60));
const SLIDER_LABEL_SIZE = Math.max(14, Math.min(SCREEN_WIDTH * 0.04, 16));
const CONTAINER_PADDING = SCREEN_WIDTH * 0.05;

// Responsive vertical spacing (reduces on small screens)
const CONTAINER_PADDING_TOP = Math.max(SCREEN_HEIGHT * 0.08, Math.min(SCREEN_HEIGHT * 0.12, 100));
const RULER_MARGIN_VERTICAL = SCREEN_HEIGHT < 700 ? 20 : 40;
const BUTTON_MARGIN_TOP = SCREEN_HEIGHT < 700 ? 25 : 45;

// Default category configuration
const DEFAULT_CATEGORIES = [
  { name: 'Focus', color: '#00BCD4', defaultMinutes: 25 },
  { name: 'Study', color: '#5B9BD5', defaultMinutes: 45 },
  { name: 'Work', color: '#4CAF50', defaultMinutes: 5 },
  { name: 'Read', color: '#9C27B0', defaultMinutes: 30 },
];

// AsyncStorage keys
const CATEGORY_STORAGE_KEY = '@selected_category';
const CATEGORY_TIMES_KEY = '@category_times';
const COMPLETED_SESSIONS_KEY = '@completed_sessions';
const TEST_PAGES_KEY = '@test_pages';

function MainApp() {
  // Get membership context
  const { testPlusMode, customCategories } = useMembership();
  const { openModal } = useModalManager();

  // Load Poppins font - must be first
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const DEFAULT_MINUTES = 25;
  const MIN_MINUTES = 5;
  const MAX_MINUTES = 180;
  const STEP_INTERVAL = 5;

  // Initialize with Work category's default time (5 minutes)
  const initialCategory = DEFAULT_CATEGORIES.find(cat => cat.name === 'Work');
  const initialMinutes = initialCategory ? initialCategory.defaultMinutes : DEFAULT_MINUTES;

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Combine default categories with custom categories for lookups
  const allCategories = useMemo(() => {
    return [...categories, ...customCategories];
  }, [categories, customCategories]);

  const [timeInSeconds, setTimeInSeconds] = useState(initialMinutes * 60);
  const [sliderMinutes, setSliderMinutes] = useState(initialMinutes);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const [sound, setSound] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [showTestScreen, setShowTestScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showProgressScreen, setShowProgressScreen] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showTestSettingsModal, setShowTestSettingsModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStartMinutes, setSessionStartMinutes] = useState(initialMinutes);

  // Test mode state for test pages (dev only)
  const [showTestPages, setShowTestPages] = useState(false);

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

  // Cleanup sound
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Load saved category times and selected category on app start
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load saved category times
        const savedTimesJson = await AsyncStorage.getItem(CATEGORY_TIMES_KEY);
        if (savedTimesJson) {
          const savedTimes = JSON.parse(savedTimesJson);
          // Update categories with saved times
          const updatedCategories = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            defaultMinutes: savedTimes[cat.name] !== undefined ? savedTimes[cat.name] : cat.defaultMinutes
          }));
          setCategories(updatedCategories);
        }

        // Load saved selected category
        const savedCategory = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
        if (savedCategory && allCategories.find(cat => cat.name === savedCategory)) {
          handleCategoryChange(savedCategory);
        }
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Load test pages setting (dev only)
  useEffect(() => {
    if (__DEV__) {
      const loadTestSettings = async () => {
        try {
          const testPages = await AsyncStorage.getItem(TEST_PAGES_KEY);
          if (testPages !== null) {
            setShowTestPages(JSON.parse(testPages));
          }
        } catch (error) {
          console.log('Error loading test pages setting:', error);
        }
      };

      loadTestSettings();
    }
  }, []);

  // Save test pages setting when changed (dev only)
  useEffect(() => {
    if (__DEV__) {
      const saveTestSettings = async () => {
        try {
          await AsyncStorage.setItem(TEST_PAGES_KEY, JSON.stringify(showTestPages));
        } catch (error) {
          console.log('Error saving test pages setting:', error);
        }
      };
      saveTestSettings();
    }
  }, [showTestPages]);

  // Countdown logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsCompleted(true);
            playNotificationSound();
            // Save completed session
            saveCompletedSession(selectedCategory, sessionStartMinutes);
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
    const category = allCategories.find(cat => cat.name === categoryName);
    return category ? category.color : '#FF7A59';
  };

  // Handle category change
  const handleCategoryChange = async (categoryName) => {
    setSelectedCategory(categoryName);
    const category = allCategories.find(cat => cat.name === categoryName);
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

  // Save completed session to AsyncStorage
  const saveCompletedSession = async (category, minutes) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: 2025-10-24
      const session = {
        category,
        minutes,
        timestamp: Date.now(),
      };

      // Load existing sessions
      const existingData = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);
      const sessions = existingData ? JSON.parse(existingData) : {};

      // Add today's session
      if (!sessions[today]) {
        sessions[today] = [];
      }
      sessions[today].push(session);

      // Save back to AsyncStorage
      await AsyncStorage.setItem(COMPLETED_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.log('Error saving completed session:', error);
    }
  };

  const handleStartFocus = () => {
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
    setSessionStartMinutes(sliderMinutes); // Track session duration
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
    setIsCompleted(false);
    setTimeInSeconds(DEFAULT_MINUTES * 60);
    setSliderMinutes(DEFAULT_MINUTES);
  };

  const handleSliderChange = async (value) => {
    const minutes = Math.max(MIN_MINUTES, Math.round(value / STEP_INTERVAL) * STEP_INTERVAL);
    setSliderMinutes(minutes);
    setTimeInSeconds(minutes * 60);
    setIsCompleted(false);

    // Update the current category's defaultMinutes
    const updatedCategories = categories.map(cat =>
      cat.name === selectedCategory
        ? { ...cat, defaultMinutes: minutes }
        : cat
    );
    setCategories(updatedCategories);

    // Save to AsyncStorage
    try {
      const categoryTimes = {};
      updatedCategories.forEach(cat => {
        categoryTimes[cat.name] = cat.defaultMinutes;
      });
      await AsyncStorage.setItem(CATEGORY_TIMES_KEY, JSON.stringify(categoryTimes));
    } catch (error) {
      console.log('Error saving category times:', error);
    }
  };

  // Get character state based on timer state
  const getCharacterState = () => {
    if (isCompleted) {
      return CHARACTER_STATES.COMPLETED;
    }
    if (isRunning && !isPaused) {
      return CHARACTER_STATES.FOCUSING;
    }
    return CHARACTER_STATES.IDLE;
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
      // Running state: Show minimalist "Pause"
      return (
        <TouchableOpacity style={styles.pauseMinimalist} onPress={handlePause}>
          <Text style={styles.pauseText}>Pause</Text>
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
    <View style={[
      styles.container,
      (isRunning || isPaused) && styles.containerFocusMode
    ]}>
      {/* Hamburger Menu Button - hide during focus mode */}
      {!(isRunning || isPaused) && (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowHamburgerMenu(true)}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
              fill="#8B8B8B"
            />
          </Svg>
        </TouchableOpacity>
      )}

      {/* Tomato Character */}
      <TomatoCharacter size={TOMATO_SIZE} state={getCharacterState()} />

      {/* Timer Display */}
      <Text style={styles.timerText}>{formatTime(timeInSeconds)}</Text>

      {/* Category Label */}
      <TouchableOpacity
        style={[styles.categoryPill, { backgroundColor: getCategoryColor(selectedCategory) }]}
        onPress={() => openModal('CategorySelection', {
          categories,
          selectedCategory,
          onSelect: handleCategoryChange,
          testPlusMode,
        })}
      >
        <Text style={styles.categoryLabel}>{selectedCategory}</Text>
      </TouchableOpacity>

      {/* Ruler Picker - only show when not running */}
      {!isRunning && !isPaused && (
        <View style={styles.rulerContainer}>
          <RulerPicker
            min={0}
            max={MAX_MINUTES}
            step={STEP_INTERVAL}
            fractionDigits={0}
            initialValue={sliderMinutes}
            onValueChange={handleSliderChange}
            onValueChangeEnd={handleSliderChange}
            shortStepHeight={30}
            longStepHeight={60}
            unit=""
            height={100}
            indicatorColor="#FF7A59"
            width={SCREEN_WIDTH}
            indicatorHeight={80}
            stepWidth={8}
            valueTextStyle={{ fontSize: 0, height: 0, width: 0 }}
            gapBetweenSteps={20}
          />
        </View>
      )}

      {/* Buttons */}
      {renderButtons()}

      {/* Test Animations Button - only when test pages enabled and not in focus mode */}
      {__DEV__ && showTestPages && !(isRunning || isPaused) && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={() => setShowTestScreen(true)}
        >
          <Text style={styles.devButtonText}>🎨 Test Animations</Text>
        </TouchableOpacity>
      )}

      {/* Modal Components */}
      <CategorySelectionModal />
      <AddCategoryModal />
      <ConfirmationModal />

      <StatusBar style="dark" />

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal />

      {/* Settings Screen Modal */}
      <SettingsScreen
        visible={showSettingsScreen}
        onClose={() => setShowSettingsScreen(false)}
      />

      {/* Character Test Screen Modal */}
      <CharacterTestScreen
        visible={showTestScreen}
        onClose={() => setShowTestScreen(false)}
      />

      {/* Hamburger Menu */}
      <HamburgerMenu
        visible={showHamburgerMenu}
        onClose={() => setShowHamburgerMenu(false)}
        onSettings={() => setShowSettingsScreen(true)}
        onProgress={() => setShowProgressScreen(true)}
        onTest={() => setShowTestSettingsModal(true)}
        testPlusMode={testPlusMode}
      />

      {/* Progress Screen Modal */}
      <ProgressScreen
        visible={showProgressScreen}
        onClose={() => setShowProgressScreen(false)}
        categories={categories}
        testPlusMode={testPlusMode}
      />

      {/* Test Settings Modal (dev only) */}
      {__DEV__ && (
        <TestSettingsModal
          visible={showTestSettingsModal}
          onClose={() => setShowTestSettingsModal(false)}
          showTestPages={showTestPages}
          setShowTestPages={setShowTestPages}
        />
      )}
    </View>
  );
}

// Main App component wrapped with providers
export default function App() {
  // Initialize RevenueCat on app start
  useEffect(() => {
    RevenueCatService.configure();
  }, []);

  return (
    <MembershipProvider>
      <ModalProvider>
        <MainApp />
      </ModalProvider>
    </MembershipProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1ED',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: CONTAINER_PADDING_TOP,
  },
  containerFocusMode: {
    justifyContent: 'center',
    paddingTop: 0,
    marginTop: -40,
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
    fontSize: Math.max(12, Math.min(SCREEN_WIDTH * 0.035, 16)),
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  singleButton: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: BUTTON_MARGIN_TOP,
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
    paddingHorizontal: Math.max(16, BUTTON_PADDING_HORIZONTAL * 0.6),
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
    marginTop: BUTTON_MARGIN_TOP,
  },
  resetButton: {
    backgroundColor: '#5B9BD5',
  },
  rulerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: RULER_MARGIN_VERTICAL,
    marginBottom: RULER_MARGIN_VERTICAL,
  },
  sliderLabel: {
    fontSize: SLIDER_LABEL_SIZE,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginBottom: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pauseMinimalist: {
    marginTop: BUTTON_MARGIN_TOP,
    marginBottom: 10,
    alignItems: 'center',
  },
  pauseText: {
    color: '#8B8B8B',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  devButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
