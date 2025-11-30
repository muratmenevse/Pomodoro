// Membership tiers
export const MEMBERSHIP_TIERS = {
  FREE: 'free',
  PLUS: 'plus',
};

// Feature flags for Plus membership
export const PLUS_FEATURES = {
  CUSTOM_CATEGORIES: 'custom_categories',
  ANALYTICS: 'analytics',
  THEMES: 'themes',
  CLOUD_SYNC: 'cloud_sync',
  UNLIMITED_HISTORY: 'unlimited_history',
};

// Limits for free vs plus users
export const MEMBERSHIP_LIMITS = {
  FREE: {
    MAX_CATEGORIES: 4, // Default categories only
    MAX_HISTORY_DAYS: 7,
    CAN_CREATE_CATEGORIES: false,
    CAN_EDIT_CATEGORIES: false,
    CAN_DELETE_CATEGORIES: false,
  },
  PLUS: {
    MAX_CATEGORIES: 50, // Practically unlimited
    MAX_HISTORY_DAYS: 365,
    CAN_CREATE_CATEGORIES: true,
    CAN_EDIT_CATEGORIES: true,
    CAN_DELETE_CATEGORIES: true,
  },
};

// RevenueCat configuration
export const REVENUECAT_CONFIG = {
  // Production keys
  API_KEY_IOS: 'appl_hIsxVYhqWkJahprSkVUzxfWfpKG',
  API_KEY_ANDROID: 'your_android_api_key_here',
  // Test/Sandbox key (used in development)
  API_KEY_TEST: 'test_lGFEyVHcoBmiKOzJoBMJJLBMSrS',
  ENTITLEMENT_ID: 'plus',
  PRODUCT_IDS: {
    MONTHLY: 'pomodoro_plus_monthly',
    YEARLY: 'pomodoro_plus_yearly',
  },
};

// AsyncStorage keys for membership
export const MEMBERSHIP_STORAGE_KEYS = {
  MEMBERSHIP_STATUS: '@membership_status',
  MEMBERSHIP_EXPIRY: '@membership_expiry',
  CUSTOM_CATEGORIES: '@custom_categories',
  PURCHASE_HISTORY: '@purchase_history',
};