import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const COMPLETED_SESSIONS_KEY = '@completed_sessions';

class NotificationService {
  /**
   * Request notification permissions from the user
   * Should be called when app starts
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF7A59',
          sound: 'successSound.m4a',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Calculate total focused minutes for today
   * @returns {Promise<number>} Total minutes focused today
   */
  async getTodaysFocusedMinutes() {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: 2025-10-29
      const sessionsData = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);

      if (!sessionsData) {
        return 0;
      }

      const sessions = JSON.parse(sessionsData);
      const todaySessions = sessions[today] || [];

      // Sum up all minutes from today's sessions
      const totalMinutes = todaySessions.reduce((sum, session) => {
        return sum + (session.minutes || 0);
      }, 0);

      return totalMinutes;
    } catch (error) {
      console.error('Error calculating today\'s focused minutes:', error);
      return 0;
    }
  }

  /**
   * Send a success notification when Pomodoro completes
   * @param {number} sessionMinutes - Minutes of the just-completed session
   */
  async sendSuccessNotification(sessionMinutes) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nice Job!',
          body: `You focused for ${sessionMinutes} minutes`,
          sound: 'successSound.m4a',
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.HIGH,
          // For iOS and Android large icon
          attachments: [
            {
              identifier: 'tomato-icon',
              url: 'notification-icon', // Will be resolved from assets
            },
          ],
          data: {
            screen: 'Success',
            sessionMinutes,
          },
        },
        trigger: null, // Send immediately
      });

      console.log('Success notification sent');
    } catch (error) {
      console.error('Error sending success notification:', error);
    }
  }

  /**
   * Schedule a notification for when timer completes
   * @param {number} minutes - Duration in minutes until timer completes
   * @param {number} sessionMinutes - Minutes for the session (for display)
   * @param {string} categoryName - Category name for the session
   * @returns {Promise<string>} Notification ID for cancellation
   */
  async scheduleTimerCompletion(minutes, sessionMinutes, categoryName) {
    try {
      // Calculate exact completion time
      const triggerDate = new Date(Date.now() + minutes * 60 * 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nice Job!',
          body: `You focused for ${sessionMinutes} minutes`,
          sound: 'successSound.m4a',
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            screen: 'Success',
            sessionMinutes,
            category: categoryName,
          },
        },
        trigger: { type: 'date', date: triggerDate },
      });

      console.log(`Timer notification scheduled for ${triggerDate.toLocaleTimeString()}, ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling timer notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled timer notification
   * @param {string} notificationId - ID of notification to cancel
   */
  async cancelScheduledTimer(notificationId) {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`Cancelled notification: ${notificationId}`);
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Add a notification response listener
   * Call this to handle when user taps on a notification
   * @param {Function} callback - Function to call with notification response
   * @returns {Object} Subscription object (call .remove() to unsubscribe)
   */
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
