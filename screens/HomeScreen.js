import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, AppState, Platform } from 'react-native';
import { RulerPicker } from 'react-native-ruler-picker';
import { Audio } from 'expo-av';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';
import { MembershipProvider, useMembership } from '../contexts/MembershipContext';
import HamburgerMenu from '../components/HamburgerMenu';
import TestSettingsModal from '../components/TestSettingsModal';
import RevenueCatService from '../services/RevenueCatService';
import TimerNotificationManager from '../services/TimerNotificationManager';
import NotificationService from '../services/NotificationService';
import Svg, { Path } from 'react-native-svg';
import { useTimer } from '../hooks/useTimer';

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
  { name: 'Focus', color: '#00BCD4', defaultMinutes: 25, isEditable: false },
];

// AsyncStorage keys
const CATEGORY_STORAGE_KEY = '@selected_category';
const CATEGORY_TIMES_KEY = '@category_times';
const CATEGORIES_LIST_KEY = '@categories_list';
const COMPLETED_SESSIONS_KEY = '@completed_sessions';
const TEST_PAGES_KEY = '@test_pages';
const TEST_10_SECOND_MODE_KEY = '@test_10_second_mode';
const TIMER_END_TIME_KEY = '@active_timer_end_time';
const TIMER_SESSION_MINUTES_KEY = '@active_timer_session_minutes';
const TIMER_CATEGORY_KEY = '@active_timer_category';

// Timer configuration objects (Strategy Pattern)
const TIMER_CONFIGS = {
  normal: {
    minMinutes: 5,
    maxMinutes: 180,
    stepInterval: 5,
    defaultMinutes: 25,
    useSlider: true,
    displayText: null,
  },
  test10Second: {
    minMinutes: 10 / 60,  // 10 seconds in minutes
    maxMinutes: 10 / 60,
    stepInterval: 0,
    defaultMinutes: 10 / 60,
    useSlider: false,
    displayText: 'Test Mode',
  },
};

// Factory function to get appropriate timer configuration
const getTimerConfig = (test10SecondMode) => {
  return (test10SecondMode && __DEV__)
    ? TIMER_CONFIGS.test10Second
    : TIMER_CONFIGS.normal;
};

export default function HomeScreen({ navigation }) {
  // Get membership context
  const { testPlusMode, customCategories, updateCustomCategoryTime } = useMembership();

  // Load Poppins font - must be first
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Initialize with Focus category's default time (25 minutes)
  const initialCategory = DEFAULT_CATEGORIES.find(cat => cat.name === 'Focus');
  const initialMinutes = initialCategory ? initialCategory.defaultMinutes : TIMER_CONFIGS.normal.defaultMinutes;

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Combine default categories with custom categories for lookups
  const allCategories = useMemo(() => {
    return [...categories, ...customCategories];
  }, [categories, customCategories]);

  const [sound, setSound] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Focus');
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showTestSettingsModal, setShowTestSettingsModal] = useState(false);

  // Test mode state for test pages (dev only)
  const [showTestPages, setShowTestPages] = useState(false);
  const [test10SecondMode, setTest10SecondMode] = useState(false);

  // Get timer configuration based on mode (Configuration Object Pattern)
  const timerConfig = useMemo(
    () => getTimerConfig(test10SecondMode),
    [test10SecondMode]
  );

  // Cleanup sound
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Request notification permissions on mount
  useEffect(() => {
    NotificationService.requestPermissions();
  }, []);

  // Monitor app state to check timer completion when returning to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, check if timer was running
        try {
          const endTimeStr = await AsyncStorage.getItem(TIMER_END_TIME_KEY);
          if (endTimeStr) {
            const endTime = parseInt(endTimeStr, 10);
            const now = Date.now();

            if (now >= endTime) {
              // Timer completed while app was in background
              const sessionMinutesStr = await AsyncStorage.getItem(TIMER_SESSION_MINUTES_KEY);
              const categoryName = await AsyncStorage.getItem(TIMER_CATEGORY_KEY);
              const sessionMinutes = sessionMinutesStr ? parseInt(sessionMinutesStr, 10) : sliderMinutes;

              // Save completed session
              await saveCompletedSession(categoryName || selectedCategory, sessionMinutes);

              // Clear timer state
              await AsyncStorage.multiRemove([
                TIMER_END_TIME_KEY,
                TIMER_SESSION_MINUTES_KEY,
                TIMER_CATEGORY_KEY
              ]);

              // Clear notification (only on mobile platforms)
              if (Platform.OS !== 'web') {
                await TimerNotificationManager.clearFromStorage();
              }

              // Update UI and navigate (deferred to avoid render-time state updates)
              setTimeout(() => {
                setIsRunning(false);
                setIsCompleted(true);

                // Close any open modals (like "Give Up" confirmation) before showing Success screen
                const state = navigation.getState();
                if (state.routes.length > 1) {
                  navigation.popToTop();
                }
                navigation.navigate('Success', { test10SecondMode });
              }, 0);
            } else {
              // Timer still running, update display with remaining time
              const remainingSeconds = Math.ceil((endTime - now) / 1000);
              setTimeout(() => {
                setTimeInSeconds(remainingSeconds);
                setIsRunning(true);
              }, 0);
            }
          }
        } catch (error) {
          console.log('Error checking timer state:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Load saved category times and selected category on app start
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load saved categories list (includes deleted state)
        const savedCategoriesJson = await AsyncStorage.getItem(CATEGORIES_LIST_KEY);
        if (savedCategoriesJson) {
          const savedCategories = JSON.parse(savedCategoriesJson);
          setCategories(savedCategories);
        } else {
          // Fallback: Load saved category times if categories list doesn't exist
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
  }, [customCategories]);

  // Load test pages setting (dev only)
  useEffect(() => {
    if (__DEV__) {
      const loadTestSettings = async () => {
        try {
          const testPages = await AsyncStorage.getItem(TEST_PAGES_KEY);
          if (testPages !== null) {
            setShowTestPages(JSON.parse(testPages));
          }

          const test10Second = await AsyncStorage.getItem(TEST_10_SECOND_MODE_KEY);
          if (test10Second !== null) {
            setTest10SecondMode(JSON.parse(test10Second));
          }
        } catch (error) {
          console.log('Error loading test settings:', error);
        }
      };

      loadTestSettings();
    }
  }, []);

  // Save test settings when changed (dev only)
  useEffect(() => {
    if (__DEV__) {
      const saveTestSettings = async () => {
        try {
          await AsyncStorage.setItem(TEST_PAGES_KEY, JSON.stringify(showTestPages));
          await AsyncStorage.setItem(TEST_10_SECOND_MODE_KEY, JSON.stringify(test10SecondMode));
        } catch (error) {
          console.log('Error saving test settings:', error);
        }
      };
      saveTestSettings();
    }
  }, [showTestPages, test10SecondMode]);

  // Helper functions needed by useTimer hook

  // Load and play notification sound
  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/successSound.m4a')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
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

  // Delete a default category (only editable ones)
  const deleteDefaultCategory = async (categoryName) => {
    const categoryToDelete = categories.find(cat => cat.name === categoryName);

    // Only allow deleting editable categories
    if (!categoryToDelete || !categoryToDelete.isEditable) {
      return false;
    }

    // Remove from categories array
    const updatedCategories = categories.filter(cat => cat.name !== categoryName);
    setCategories(updatedCategories);

    // Save the full categories list to AsyncStorage (preserves deleted state)
    try {
      await AsyncStorage.setItem(CATEGORIES_LIST_KEY, JSON.stringify(updatedCategories));

      // Also update category times for backward compatibility
      const categoryTimes = {};
      updatedCategories.forEach(cat => {
        categoryTimes[cat.name] = cat.defaultMinutes;
      });
      await AsyncStorage.setItem(CATEGORY_TIMES_KEY, JSON.stringify(categoryTimes));
    } catch (error) {
      console.log('Error saving categories:', error);
    }

    // If deleted category was selected, switch to first available category
    if (selectedCategory === categoryName) {
      const firstCategory = updatedCategories[0] || customCategories[0];
      if (firstCategory) {
        handleCategoryChange(firstCategory.name);
      }
    }

    return true;
  };

  // Save completed session to AsyncStorage
  const saveCompletedSession = async (category, minutes) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: 2025-10-24
      const categoryColor = getCategoryColor(category);
      const session = {
        category,
        color: categoryColor,
        minutes,
        timestamp: Date.now(),
        status: 'completed',
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

  const saveFailedSession = async (category, minutes) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const categoryColor = getCategoryColor(category);
      const session = {
        category,
        color: categoryColor,
        minutes,
        timestamp: Date.now(),
        status: 'failed',
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
      console.log('Error saving failed session:', error);
    }
  };

  // Use custom timer hook for all timer logic (fixes race condition bug)
  const {
    timeInSeconds,
    sliderMinutes,
    isRunning,
    isCompleted,
    sessionStartMinutes,
    sliderKey,
    formatTime,
    handleStartFocus,
    handleReset,
    handleSliderChange,
    setIsCompleted,
    setTimeInSeconds,
    setSliderMinutes,
    setIsRunning,
  } = useTimer({
    initialMinutes,
    timerConfig,
    allCategories,
    selectedCategory,
    categories,
    customCategories,
    setCategories,
    updateCustomCategoryTime,
    saveCompletedSession,
    playNotificationSound,
    navigation,
    test10SecondMode,
  });

  const handleGiveUp = () => {
    navigation.navigate('Confirmation', {
      title: 'Are you sure you want to give up?',
      message: 'If you quit now, your progress won\'t be saved',
      confirmText: 'Give Up',
      cancelText: 'No',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        // Save failed session before resetting
        await saveFailedSession(selectedCategory, sliderMinutes);
        await handleReset();
        navigation.navigate('Fail');
      },
    });
  };

  // Get character state based on timer state
  const getCharacterState = () => {
    if (isCompleted) {
      return CHARACTER_STATES.COMPLETED;
    }
    if (isRunning) {
      return CHARACTER_STATES.FOCUSING;
    }
    return CHARACTER_STATES.IDLE;
  };

  // Render buttons based on state
  const renderButtons = () => {
    if (!isRunning) {
      // Initial state: Show "Start Focus"
      return (
        <TouchableOpacity style={styles.singleButton} onPress={handleStartFocus}>
          <Text style={styles.buttonText}>Start Focus</Text>
        </TouchableOpacity>
      );
    } else {
      // Running state: Show minimalist "Give Up"
      return (
        <TouchableOpacity style={styles.pauseMinimalist} onPress={handleGiveUp}>
          <Text style={styles.pauseText}>Give Up</Text>
        </TouchableOpacity>
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
      isRunning && styles.containerFocusMode
    ]}>
      {/* Hamburger Menu Button - hide during focus mode */}
      {!isRunning && (
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
      <Text style={[styles.timerText, isRunning && styles.timerTextFocusMode]}>{formatTime(timeInSeconds)}</Text>

      {/* Category Label */}
      {!isRunning && (
        <TouchableOpacity
          style={[styles.categoryPill, { backgroundColor: getCategoryColor(selectedCategory) }]}
          onPress={() => navigation.navigate('CategorySelection', {
            categories,
            selectedCategory,
            onSelect: handleCategoryChange,
            testPlusMode,
            deleteDefaultCategory,
            onPlusClick: () => navigation.navigate('Upgrade'),
          })}
        >
          <Text style={styles.categoryLabel}>{selectedCategory}</Text>
        </TouchableOpacity>
      )}

      {/* Ruler Picker or Test Mode indicator - only show when not running */}
      {!isRunning && (
        <View style={styles.rulerContainer}>
          {timerConfig.useSlider ? (
            <RulerPicker
              key={sliderKey}
              min={timerConfig.minMinutes}
              max={timerConfig.maxMinutes}
              step={timerConfig.stepInterval}
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
          ) : (
            <View style={styles.testModeContainer}>
              <Text style={styles.testModeText}>{timerConfig.displayText}</Text>
            </View>
          )}
        </View>
      )}

      {/* Buttons */}
      {renderButtons()}

      {/* Test Animations Button - only when test pages enabled and not in focus mode */}
      {__DEV__ && showTestPages && !isRunning && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={() => navigation.navigate('CharacterTest')}
        >
          <Text style={styles.devButtonText}>🎨 Test Animations</Text>
        </TouchableOpacity>
      )}

      <StatusBar style="dark" />

      {/* Hamburger Menu */}
      <HamburgerMenu
        visible={showHamburgerMenu}
        onClose={() => setShowHamburgerMenu(false)}
        onSettings={() => {
          setShowHamburgerMenu(false);
          navigation.navigate('Settings');
        }}
        onProgress={() => {
          setShowHamburgerMenu(false);
          navigation.navigate('Progress', { categories, testPlusMode });
        }}
        onPlusClick={() => {
          setShowHamburgerMenu(false);
          navigation.navigate('Upgrade');
        }}
        onTest={() => setShowTestSettingsModal(true)}
        testPlusMode={testPlusMode}
      />

      {/* Test Settings Modal (dev only) */}
      {__DEV__ && (
        <TestSettingsModal
          visible={showTestSettingsModal}
          onClose={() => setShowTestSettingsModal(false)}
          showTestPages={showTestPages}
          setShowTestPages={setShowTestPages}
          test10SecondMode={test10SecondMode}
          setTest10SecondMode={setTest10SecondMode}
        />
      )}
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
    paddingTop: CONTAINER_PADDING_TOP,
  },
  containerFocusMode: {
    justifyContent: 'center',
    paddingTop: 0,
    marginTop: 0,
  },
  timerText: {
    fontSize: TIMER_FONT_SIZE,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  timerTextFocusMode: {
    fontSize: TIMER_FONT_SIZE * 1.15,
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
    marginTop: BUTTON_MARGIN_TOP + 90,
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
  testModeContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testModeText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9C27B0',
  },
});
