import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_PROPERTIES,
  USER_PROPERTIES,
  TIMER_FAILURE_REASONS,
} from '../constants/analytics';

/**
 * AnalyticsService - Centralized analytics tracking with PostHog
 *
 * Features:
 * - Privacy-first: Only tracks after user consent
 * - Low coupling: PostHog is an implementation detail
 * - Graceful degradation: Works in dev mode without API key
 * - Singleton pattern: Follows RevenueCatService architecture
 *
 * Usage:
 *   import AnalyticsService from '../services/AnalyticsService';
 *   await AnalyticsService.initialize(apiKey, userId);
 *   AnalyticsService.trackTimerStarted(25, 'Focus');
 */

const CONSENT_STORAGE_KEY = '@analytics_consent';
const USER_ID_STORAGE_KEY = '@analytics_user_id';

class AnalyticsService {
  constructor() {
    this.posthog = null;
    this.isConfigured = false;
    this.consentGranted = false;
    this.userId = null;
    this.queuedEvents = []; // Store events before consent
  }

  /**
   * Initialize PostHog with API key and consent status
   * @param {string} apiKey - PostHog API key (from env)
   * @param {string} userId - User ID (from RevenueCat or device)
   * @param {boolean} forceConsentCheck - Force checking consent from storage
   */
  async initialize(apiKey, userId = null, forceConsentCheck = true) {
    try {
      // Check consent status from storage
      if (forceConsentCheck) {
        const consentStatus = await this.getConsentStatus();
        this.consentGranted = consentStatus;
      }

      // Store user ID
      if (userId) {
        this.userId = userId;
        await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);
      } else {
        // Try to load from storage
        const storedUserId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        this.userId = storedUserId;
      }

      // Only configure PostHog if consent is granted
      if (!this.consentGranted) {
        console.log('[Analytics] Waiting for user consent');
        return;
      }

      // Configure PostHog
      if (!apiKey) {
        console.warn('[Analytics] No API key provided');
        return;
      }

      try {
        this.posthog = new PostHog(apiKey, {
          host: 'https://us.posthog.com', // PostHog Cloud US
        });
        this.isConfigured = true;
      } catch (initError) {
        console.warn('[Analytics] PostHog init failed:', initError.message);
        this.isConfigured = true; // Still allow mock tracking
        this.posthog = null;
        return;
      }

      // Identify user if we have an ID
      if (this.userId) {
        await this.identify(this.userId);
      }

      // Flush queued events
      await this.flushQueuedEvents();

      console.log('[Analytics] PostHog initialized successfully');
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Grant analytics consent and initialize if needed
   * @param {string} apiKey - PostHog API key
   */
  async grantConsent(apiKey) {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        granted: true,
        date: new Date().toISOString(),
      }));

      this.consentGranted = true;

      // Track consent granted event
      this.trackEvent(ANALYTICS_EVENTS.ANALYTICS_CONSENT_CHANGED, {
        [ANALYTICS_PROPERTIES.CONSENT_GRANTED]: true,
      });

      // Initialize PostHog now that consent is granted
      if (!this.isConfigured && apiKey) {
        await this.initialize(apiKey, this.userId, false);
      }

      console.log('[Analytics] Consent granted');
    } catch (error) {
      console.error('[Analytics] Failed to grant consent:', error);
    }
  }

  /**
   * Revoke analytics consent and clear data
   */
  async revokeConsent() {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        granted: false,
        date: new Date().toISOString(),
      }));

      this.consentGranted = false;

      // Track consent revoked event before shutting down
      if (this.isConfigured) {
        this.trackEvent(ANALYTICS_EVENTS.ANALYTICS_CONSENT_CHANGED, {
          [ANALYTICS_PROPERTIES.CONSENT_GRANTED]: false,
        });

        // Reset PostHog
        if (this.posthog) {
          await this.posthog.reset();
        }
      }

      this.isConfigured = false;
      this.posthog = null;
      this.queuedEvents = [];

      console.log('[Analytics] Consent revoked');
    } catch (error) {
      console.error('[Analytics] Failed to revoke consent:', error);
    }
  }

  /**
   * Get consent status from storage
   * @returns {Promise<boolean>}
   */
  async getConsentStatus() {
    try {
      const consentData = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (!consentData) return false;

      const { granted } = JSON.parse(consentData);
      return granted === true;
    } catch (error) {
      console.error('[Analytics] Failed to get consent status:', error);
      return false;
    }
  }

  /**
   * Identify a user with properties
   * @param {string} userId - Unique user identifier
   * @param {object} properties - User properties
   */
  async identify(userId, properties = {}) {
    if (!this.consentGranted) {
      console.log('[Analytics] Skipping identify - no consent');
      return;
    }

    try {
      this.userId = userId;
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);

      if (this.isConfigured && this.posthog) {
        await this.posthog.identify(userId, properties);
        console.log(`[Analytics] User identified: ${userId}`);
      } else if (__DEV__) {
        console.log(`[Analytics] [MOCK] Identify: ${userId}`, properties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to identify user:', error);
    }
  }

  /**
   * Set user properties
   * @param {object} properties - User properties to set
   */
  async setUserProperties(properties) {
    if (!this.consentGranted) return;

    try {
      if (this.isConfigured && this.posthog && this.userId) {
        await this.posthog.identify(this.userId, properties);
      } else if (__DEV__) {
        console.log('[Analytics] [MOCK] Set user properties:', properties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  /**
   * Track an analytics event
   * @param {string} eventName - Event name (use ANALYTICS_EVENTS constants)
   * @param {object} properties - Event properties
   */
  async trackEvent(eventName, properties = {}) {
    if (!this.consentGranted) {
      // Queue event for later if consent not granted yet
      this.queuedEvents.push({ eventName, properties, timestamp: Date.now() });
      return;
    }

    try {
      // Add standard properties
      const enrichedProperties = {
        ...properties,
        [ANALYTICS_PROPERTIES.PLATFORM]: Platform.OS,
        timestamp: Date.now(),
      };

      if (this.isConfigured && this.posthog) {
        await this.posthog.capture(eventName, enrichedProperties);
      } else if (__DEV__) {
        console.log(`[Analytics] [MOCK] Event: ${eventName}`, enrichedProperties);
      }
    } catch (error) {
      console.error(`[Analytics] Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * Flush queued events (called after consent is granted)
   */
  async flushQueuedEvents() {
    if (this.queuedEvents.length === 0) return;

    console.log(`[Analytics] Flushing ${this.queuedEvents.length} queued events`);

    for (const { eventName, properties } of this.queuedEvents) {
      await this.trackEvent(eventName, properties);
    }

    this.queuedEvents = [];
  }

  /**
   * Reset analytics (logout)
   */
  async reset() {
    try {
      if (this.isConfigured && this.posthog) {
        await this.posthog.reset();
      }
      this.userId = null;
      await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
      console.log('[Analytics] Reset complete');
    } catch (error) {
      console.error('[Analytics] Failed to reset:', error);
    }
  }

  // ==================== Convenience Methods ====================

  /**
   * Track timer started event
   */
  async trackTimerStarted(minutes, category) {
    await this.trackEvent(ANALYTICS_EVENTS.TIMER_STARTED, {
      [ANALYTICS_PROPERTIES.DURATION_MINUTES]: minutes,
      [ANALYTICS_PROPERTIES.CATEGORY_NAME]: category,
    });
  }

  /**
   * Track timer completed event
   */
  async trackTimerCompleted(minutes, category) {
    await this.trackEvent(ANALYTICS_EVENTS.TIMER_COMPLETED, {
      [ANALYTICS_PROPERTIES.DURATION_MINUTES]: minutes,
      [ANALYTICS_PROPERTIES.CATEGORY_NAME]: category,
    });
  }

  /**
   * Track timer failed event
   */
  async trackTimerFailed(minutes, category, reason = TIMER_FAILURE_REASONS.GAVE_UP) {
    await this.trackEvent(ANALYTICS_EVENTS.TIMER_FAILED, {
      [ANALYTICS_PROPERTIES.DURATION_MINUTES]: minutes,
      [ANALYTICS_PROPERTIES.CATEGORY_NAME]: category,
      [ANALYTICS_PROPERTIES.FAILURE_REASON]: reason,
    });
  }

  /**
   * Track category selected event
   */
  async trackCategorySelected(categoryName, isCustom = false) {
    await this.trackEvent(ANALYTICS_EVENTS.CATEGORY_SELECTED, {
      [ANALYTICS_PROPERTIES.CATEGORY_NAME]: categoryName,
      [ANALYTICS_PROPERTIES.IS_CUSTOM_CATEGORY]: isCustom,
    });
  }

  /**
   * Track custom category created event
   */
  async trackCustomCategoryCreated(categoryName, color) {
    await this.trackEvent(ANALYTICS_EVENTS.CUSTOM_CATEGORY_CREATED, {
      [ANALYTICS_PROPERTIES.CATEGORY_NAME]: categoryName,
      [ANALYTICS_PROPERTIES.CATEGORY_COLOR]: color,
    });
  }

  /**
   * Track premium screen viewed event
   */
  async trackPremiumViewed() {
    await this.trackEvent(ANALYTICS_EVENTS.PREMIUM_SCREEN_VIEWED);
  }

  /**
   * Track premium purchase initiated event
   */
  async trackPremiumPurchaseInitiated(tier) {
    await this.trackEvent(ANALYTICS_EVENTS.PREMIUM_PURCHASE_INITIATED, {
      [ANALYTICS_PROPERTIES.TIER]: tier,
    });
  }

  /**
   * Track premium purchased event
   */
  async trackPremiumPurchased(tier, price, currency = 'USD') {
    await this.trackEvent(ANALYTICS_EVENTS.PREMIUM_PURCHASED, {
      [ANALYTICS_PROPERTIES.TIER]: tier,
      [ANALYTICS_PROPERTIES.PRICE]: price,
      [ANALYTICS_PROPERTIES.CURRENCY]: currency,
    });

    // Update user properties
    await this.setUserProperties({
      [USER_PROPERTIES.IS_PLUS_MEMBER]: true,
      [USER_PROPERTIES.MEMBERSHIP_TIER]: 'plus',
    });
  }

  /**
   * Track progress viewed event
   */
  async trackProgressViewed(viewType = 'week') {
    await this.trackEvent(ANALYTICS_EVENTS.PROGRESS_VIEWED, {
      [ANALYTICS_PROPERTIES.VIEW_TYPE]: viewType,
    });
  }

  /**
   * Track settings opened event
   */
  async trackSettingsOpened() {
    await this.trackEvent(ANALYTICS_EVENTS.SETTINGS_OPENED);
  }
}

// Export singleton instance
export default new AnalyticsService();
