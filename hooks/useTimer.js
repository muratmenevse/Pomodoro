import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerNotificationManager from '../services/TimerNotificationManager';

// AsyncStorage keys
const TIMER_END_TIME_KEY = '@active_timer_end_time';
const TIMER_SESSION_MINUTES_KEY = '@active_timer_session_minutes';
const TIMER_CATEGORY_KEY = '@active_timer_category';
const CATEGORIES_LIST_KEY = '@categories_list';
const CATEGORY_TIMES_KEY = '@category_times';

/**
 * Custom hook for managing Pomodoro timer state and logic
 *
 * This hook encapsulates all timer-related state and behavior, including:
 * - Timer countdown
 * - Start/stop/reset functionality
 * - Category-based timer defaults
 * - Focus effect to reset timer on navigation
 *
 * @param {Object} params - Hook parameters
 * @param {number} params.initialMinutes - Initial timer duration
 * @param {Object} params.timerConfig - Timer configuration object
 * @param {Array} params.allCategories - All available categories
 * @param {string} params.selectedCategory - Currently selected category name
 * @param {Array} params.categories - Default categories array
 * @param {Array} params.customCategories - Custom categories array
 * @param {Function} params.setCategories - Function to update categories
 * @param {Function} params.updateCustomCategoryTime - Function to update custom category time
 * @param {Function} params.saveCompletedSession - Function to save completed session
 * @param {Function} params.playNotificationSound - Function to play notification sound
 * @param {Object} params.navigation - React Navigation object
 * @param {boolean} params.test10SecondMode - Whether test mode is enabled
 */
export function useTimer({
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
}) {
  // Timer state
  const [timeInSeconds, setTimeInSeconds] = useState(initialMinutes * 60);
  const [sliderMinutes, setSliderMinutes] = useState(initialMinutes);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStartMinutes, setSessionStartMinutes] = useState(initialMinutes);
  const [sliderKey, setSliderKey] = useState(0); // Key to force RulerPicker remount

  // Refs
  const intervalRef = useRef(null);
  const isFocusedRef = useRef(true); // Track if screen is focused

  // Update timer display when test mode changes
  useEffect(() => {
    if (!isRunning) {
      const minutes = timerConfig.defaultMinutes;
      setTimeInSeconds(minutes * 60);
      setSliderMinutes(minutes);
    }
  }, [test10SecondMode, timerConfig.defaultMinutes, isRunning]);

  // Update timer when categories change or selected category changes
  // BUT NOT when screen is being focused (to avoid race condition)
  useEffect(() => {
    if (!isRunning && !isFocusedRef.current) {
      const currentCategory = allCategories.find(cat => cat.name === selectedCategory);
      const minutes = currentCategory ? currentCategory.defaultMinutes : timerConfig.defaultMinutes;
      setTimeInSeconds(minutes * 60);
      setSliderMinutes(minutes);
    }
  }, [selectedCategory, allCategories, timerConfig.defaultMinutes, isRunning]);

  // Reset timer when returning to homepage - runs on every focus
  // This is the ONLY place that should reset timer on navigation
  useFocusEffect(
    useCallback(() => {
      // Mark that we're in a focus event
      isFocusedRef.current = true;

      setIsCompleted(false);
      // Use selected category's current default time
      const currentCategory = allCategories.find(cat => cat.name === selectedCategory);
      const minutes = currentCategory ? currentCategory.defaultMinutes : timerConfig.defaultMinutes;
      setTimeInSeconds(minutes * 60);
      setSliderMinutes(minutes);
      setSliderKey(prev => prev + 1); // Force RulerPicker to remount

      // After a brief delay, mark focus event as complete
      // This allows the category useEffect to run again for actual category changes
      setTimeout(() => {
        isFocusedRef.current = false;
      }, 100);

      return () => {
        // Cleanup when screen loses focus
        isFocusedRef.current = false;
      };
    }, [selectedCategory, allCategories, timerConfig.defaultMinutes])
  );

  // Countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsCompleted(true);
            playNotificationSound();
            // Save completed session
            saveCompletedSession(selectedCategory, sessionStartMinutes);

            // Clear timer state from AsyncStorage since timer completed
            AsyncStorage.multiRemove([
              TIMER_END_TIME_KEY,
              TIMER_SESSION_MINUTES_KEY,
              TIMER_CATEGORY_KEY
            ]).catch(err => console.log('Error clearing timer state:', err));

            // Cancel scheduled notification since timer completed in foreground
            TimerNotificationManager.cancel().catch(err => console.log('Error canceling notification:', err));

            // Navigate to success screen (deferred to avoid render-time navigation)
            setTimeout(() => {
              navigation.navigate('Success', { test10SecondMode });
            }, 0);
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
  }, [isRunning, playNotificationSound, saveCompletedSession, selectedCategory, sessionStartMinutes, navigation, test10SecondMode]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start timer
  const handleStartFocus = async () => {
    setIsRunning(true);
    setIsCompleted(false);

    // Use timer config to determine duration
    const minutes = timerConfig.useSlider ? sliderMinutes : timerConfig.defaultMinutes;
    setSessionStartMinutes(minutes);
    setTimeInSeconds(minutes * 60);

    // Update category default time (only if not in test mode and time has changed)
    if (!test10SecondMode) {
      const currentCategory = allCategories.find(cat => cat.name === selectedCategory);
      if (currentCategory && minutes !== currentCategory.defaultMinutes) {
        // Check if this is a custom category
        const isCustomCategory = customCategories.some(cat => cat.name === selectedCategory);

        if (isCustomCategory) {
          // Update custom category time
          await updateCustomCategoryTime(selectedCategory, minutes);
        } else {
          // Update default category's defaultMinutes
          const updatedCategories = categories.map(cat =>
            cat.name === selectedCategory
              ? { ...cat, defaultMinutes: minutes }
              : cat
          );
          setCategories(updatedCategories);

          // Save to AsyncStorage (both full list and times for backward compatibility)
          try {
            await AsyncStorage.setItem(CATEGORIES_LIST_KEY, JSON.stringify(updatedCategories));

            const categoryTimes = {};
            updatedCategories.forEach(cat => {
              categoryTimes[cat.name] = cat.defaultMinutes;
            });
            await AsyncStorage.setItem(CATEGORY_TIMES_KEY, JSON.stringify(categoryTimes));
          } catch (error) {
            console.log('Error saving category times:', error);
          }
        }
      }
    }

    // Schedule notification for completion time
    await TimerNotificationManager.scheduleCompletion(minutes, minutes, selectedCategory);

    // Save timer state to AsyncStorage for background recovery
    const endTime = Date.now() + (minutes * 60 * 1000);
    try {
      await AsyncStorage.setItem(TIMER_END_TIME_KEY, endTime.toString());
      await AsyncStorage.setItem(TIMER_SESSION_MINUTES_KEY, minutes.toString());
      await AsyncStorage.setItem(TIMER_CATEGORY_KEY, selectedCategory);
    } catch (error) {
      console.log('Error saving timer state:', error);
    }
  };

  // Reset timer
  const handleReset = async () => {
    setIsRunning(false);
    setIsCompleted(false);

    // Use selected category's current default time
    const currentCategory = allCategories.find(cat => cat.name === selectedCategory);
    const minutes = currentCategory ? currentCategory.defaultMinutes : timerConfig.defaultMinutes;
    setTimeInSeconds(minutes * 60);
    setSliderMinutes(minutes);

    // Cancel scheduled notification
    await TimerNotificationManager.cancel();

    // Clear timer state from AsyncStorage
    try {
      await AsyncStorage.multiRemove([
        TIMER_END_TIME_KEY,
        TIMER_SESSION_MINUTES_KEY,
        TIMER_CATEGORY_KEY
      ]);
    } catch (error) {
      console.log('Error clearing timer state:', error);
    }
  };

  // Handle slider changes
  const handleSliderChange = (value) => {
    const minutes = Math.max(timerConfig.minMinutes, Math.round(value / timerConfig.stepInterval) * timerConfig.stepInterval);
    setSliderMinutes(minutes);
    setTimeInSeconds(minutes * 60);
    setIsCompleted(false);
  };

  return {
    // State
    timeInSeconds,
    sliderMinutes,
    isRunning,
    isCompleted,
    sessionStartMinutes,
    sliderKey,

    // Functions
    formatTime,
    handleStartFocus,
    handleReset,
    handleSliderChange,
    setIsCompleted,
    setTimeInSeconds,
    setSliderMinutes,
    setIsRunning,
  };
}
