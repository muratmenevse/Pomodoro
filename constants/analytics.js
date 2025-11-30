/**
 * Analytics Constants
 *
 * Centralized event names and properties for analytics tracking.
 * This ensures consistency across the app and makes it easy to update event names.
 */

// Event names
export const ANALYTICS_EVENTS = {
  // User lifecycle
  APP_OPENED: 'app_opened',
  USER_IDENTIFIED: 'user_identified',

  // Timer events
  TIMER_STARTED: 'timer_started',
  TIMER_COMPLETED: 'timer_completed',
  TIMER_FAILED: 'timer_failed',
  TIMER_RESET: 'timer_reset',

  // Category events
  CATEGORY_SELECTED: 'category_selected',
  CUSTOM_CATEGORY_CREATED: 'custom_category_created',
  CATEGORY_DELETED: 'category_deleted',

  // Premium/Membership events
  PREMIUM_SCREEN_VIEWED: 'premium_screen_viewed',
  PREMIUM_PURCHASE_INITIATED: 'premium_purchase_initiated',
  PREMIUM_PURCHASED: 'premium_purchased',
  PREMIUM_RESTORED: 'premium_restored',

  // Settings events
  SETTINGS_OPENED: 'settings_opened',
  WEEK_START_DAY_CHANGED: 'week_start_day_changed',
  ANALYTICS_CONSENT_CHANGED: 'analytics_consent_changed',

  // Progress/Analytics events
  PROGRESS_VIEWED: 'progress_viewed',
  PROGRESS_VIEW_CHANGED: 'progress_view_changed', // day/week/month
};

// Event property keys
export const ANALYTICS_PROPERTIES = {
  // Timer properties
  DURATION_MINUTES: 'duration_minutes',
  CATEGORY_NAME: 'category_name',
  CATEGORY_COLOR: 'category_color',
  IS_CUSTOM_CATEGORY: 'is_custom_category',
  SESSION_COUNT_TODAY: 'session_count_today',
  TOTAL_FOCUS_MINUTES_TODAY: 'total_focus_minutes_today',
  FAILURE_REASON: 'failure_reason', // 'gave_up', 'interrupted', etc.

  // Premium properties
  TIER: 'tier', // 'monthly', 'yearly', 'lifetime'
  PRICE: 'price',
  CURRENCY: 'currency',
  PURCHASE_METHOD: 'purchase_method', // 'revenueCat', 'restore'

  // Settings properties
  WEEK_START_DAY: 'week_start_day', // 'Sunday', 'Monday'
  SETTING_NAME: 'setting_name',
  SETTING_VALUE: 'setting_value',
  CONSENT_GRANTED: 'consent_granted', // true/false

  // Progress properties
  VIEW_TYPE: 'view_type', // 'day', 'week', 'month'
  SELECTED_CATEGORY: 'selected_category',

  // Device/App properties
  ENVIRONMENT: 'environment', // 'dev', 'production'
  APP_VERSION: 'app_version',
  PLATFORM: 'platform', // 'ios', 'android', 'web'
  DEVICE_MODEL: 'device_model',
  OS_VERSION: 'os_version',
};

// User properties that persist across sessions
export const USER_PROPERTIES = {
  // Membership
  IS_PLUS_MEMBER: 'is_plus_member',
  MEMBERSHIP_TIER: 'membership_tier', // 'free', 'plus'

  // Usage stats
  CUSTOM_CATEGORIES_COUNT: 'custom_categories_count',
  TOTAL_SESSIONS_COMPLETED: 'total_sessions_completed',
  TOTAL_SESSIONS_FAILED: 'total_sessions_failed',
  TOTAL_FOCUS_MINUTES: 'total_focus_minutes',

  // User info
  PLATFORM: 'platform',
  APP_VERSION: 'app_version',
  FIRST_SEEN: 'first_seen', // timestamp
  LAST_SEEN: 'last_seen', // timestamp

  // Privacy
  ANALYTICS_CONSENT_GRANTED: 'analytics_consent_granted',
  ANALYTICS_CONSENT_DATE: 'analytics_consent_date',
};

// Failure reasons for TIMER_FAILED event
export const TIMER_FAILURE_REASONS = {
  GAVE_UP: 'gave_up',
  APP_CLOSED: 'app_closed',
  INTERRUPTED: 'interrupted',
  ERROR: 'error',
};
