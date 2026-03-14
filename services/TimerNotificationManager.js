import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';

const TIMER_NOTIFICATION_ID_KEY = '@active_timer_notification_id';

class TimerNotificationManager {
  constructor() {
    this.notificationId = null;
  }

  /**
   * Schedule a notification for timer completion
   * @param {number} minutes - Duration in minutes until timer completes
   * @param {number} sessionMinutes - Minutes for the session (for display)
   * @param {string} category - Category name for the session
   * @returns {Promise<void>}
   */
  async scheduleCompletion(minutes, sessionMinutes, category) {
    try {
      // Check if sound is enabled
      const soundSetting = await AsyncStorage.getItem('@sound_enabled');
      const soundEnabled = soundSetting !== 'false';

      // Schedule the notification
      const notificationId = await NotificationService.scheduleTimerCompletion(
        minutes,
        sessionMinutes,
        category,
        soundEnabled
      );

      this.notificationId = notificationId;

      // Save to AsyncStorage
      if (notificationId) {
        await AsyncStorage.setItem(TIMER_NOTIFICATION_ID_KEY, notificationId);
      }

      return notificationId;
    } catch (error) {
      console.log('Error scheduling timer notification:', error);
      return null;
    }
  }

  /**
   * Cancel the currently scheduled timer notification
   * @returns {Promise<void>}
   */
  async cancel() {
    try {
      if (this.notificationId) {
        await NotificationService.cancelScheduledTimer(this.notificationId);
        this.notificationId = null;
      }

      // Clear from AsyncStorage
      await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
    } catch (error) {
      console.log('Error canceling timer notification:', error);
    }
  }

  /**
   * Load notification ID from AsyncStorage (for app restart recovery)
   * @returns {Promise<string|null>}
   */
  async loadFromStorage() {
    try {
      const notificationId = await AsyncStorage.getItem(TIMER_NOTIFICATION_ID_KEY);
      this.notificationId = notificationId;
      return notificationId;
    } catch (error) {
      console.log('Error loading notification ID:', error);
      return null;
    }
  }

  /**
   * Clear notification ID from storage
   * @returns {Promise<void>}
   */
  async clearFromStorage() {
    try {
      await AsyncStorage.removeItem(TIMER_NOTIFICATION_ID_KEY);
      this.notificationId = null;
    } catch (error) {
      console.log('Error clearing notification ID:', error);
    }
  }

  /**
   * Get current notification ID
   * @returns {string|null}
   */
  getCurrentId() {
    return this.notificationId;
  }
}

export default new TimerNotificationManager();
