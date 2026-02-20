import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MEMBERSHIP_TIERS,
  MEMBERSHIP_LIMITS,
  MEMBERSHIP_STORAGE_KEYS,
  PLUS_FEATURES
} from '../constants/membership';
import RevenueCatService from '../services/RevenueCatService';

// Create the context
const MembershipContext = createContext(null);

// Custom hook to use membership context
export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};

// Provider component
export const MembershipProvider = ({ children }) => {
  const [membershipTier, setMembershipTier] = useState(MEMBERSHIP_TIERS.FREE);
  const [isLoading, setIsLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState([]);
  const [testPlusMode, setTestPlusModeState] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);

  // Load membership status on mount
  useEffect(() => {
    loadMembershipStatus();
    loadCustomCategories();
    loadTestMode();
  }, []);

  // Load membership status from AsyncStorage
  const loadMembershipStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(MEMBERSHIP_STORAGE_KEYS.MEMBERSHIP_STATUS);
      if (status) {
        setMembershipTier(status);
      }
      const expiry = await AsyncStorage.getItem(MEMBERSHIP_STORAGE_KEYS.MEMBERSHIP_EXPIRY);
      if (expiry) {
        setExpirationDate(expiry);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading membership status:', error);
      setIsLoading(false);
    }
  };

  // Load custom categories from AsyncStorage
  const loadCustomCategories = async () => {
    try {
      const categoriesJson = await AsyncStorage.getItem(MEMBERSHIP_STORAGE_KEYS.CUSTOM_CATEGORIES);
      if (categoriesJson) {
        const categories = JSON.parse(categoriesJson);
        setCustomCategories(categories);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  // Load test mode from AsyncStorage (dev only)
  const loadTestMode = async () => {
    if (__DEV__) {
      try {
        const testMode = await AsyncStorage.getItem('@test_plus_mode');
        if (testMode !== null) {
          const enabled = JSON.parse(testMode);
          setTestPlusModeState(enabled);
          if (enabled) {
            setExpirationDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
          }
        }
      } catch (error) {
        console.error('Error loading test mode:', error);
      }
    }
  };

  // Sync membership status with RevenueCat
  const syncWithRevenueCat = async () => {
    if (!RevenueCatService.isConfigured) return;
    try {
      const hasPlus = await RevenueCatService.hasPlusAccess();
      const newTier = hasPlus ? MEMBERSHIP_TIERS.PLUS : MEMBERSHIP_TIERS.FREE;
      await saveMembershipStatus(newTier);

      const expDate = await RevenueCatService.getPlusExpirationDate();
      if (expDate) {
        await AsyncStorage.setItem(MEMBERSHIP_STORAGE_KEYS.MEMBERSHIP_EXPIRY, expDate);
        setExpirationDate(expDate);
      } else {
        await AsyncStorage.removeItem(MEMBERSHIP_STORAGE_KEYS.MEMBERSHIP_EXPIRY);
        setExpirationDate(null);
      }

    } catch (error) {
      console.error('Error syncing membership with RevenueCat:', error);
    }
  };

  // Sync on foreground + delayed initial sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncWithRevenueCat();
      }
    });

    const timeout = setTimeout(syncWithRevenueCat, 5000);

    return () => {
      subscription.remove();
      clearTimeout(timeout);
    };
  }, []);

  // Save membership status to AsyncStorage
  const saveMembershipStatus = async (tier) => {
    try {
      await AsyncStorage.setItem(MEMBERSHIP_STORAGE_KEYS.MEMBERSHIP_STATUS, tier);
      setMembershipTier(tier);
    } catch (error) {
      console.error('Error saving membership status:', error);
    }
  };

  // Save custom categories to AsyncStorage
  const saveCustomCategories = async (categories) => {
    try {
      await AsyncStorage.setItem(
        MEMBERSHIP_STORAGE_KEYS.CUSTOM_CATEGORIES,
        JSON.stringify(categories)
      );
      setCustomCategories(categories);
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  };

  // Set test plus mode (dev only)
  const setTestPlusMode = async (enabled) => {
    if (__DEV__) {
      try {
        await AsyncStorage.setItem('@test_plus_mode', JSON.stringify(enabled));
        setTestPlusModeState(enabled);
        // Set mock expiration date for test mode
        if (enabled) {
          const mockExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          setExpirationDate(mockExpiry);
        } else {
          setExpirationDate(null);
        }
      } catch (error) {
        console.error('Error saving test mode:', error);
      }
    }
  };

  // Check if user has Plus membership (considers test mode in dev)
  const isPlusMember = __DEV__ && testPlusMode ? true : (membershipTier === MEMBERSHIP_TIERS.PLUS);

  // Get current membership limits
  const getMembershipLimits = () => {
    return isPlusMember ? MEMBERSHIP_LIMITS.PLUS : MEMBERSHIP_LIMITS.FREE;
  };

  // Check if a specific feature is available
  const hasFeature = (featureName) => {
    if (isPlusMember) return true;

    // Free users don't have access to Plus features
    return false;
  };

  // Check if user can add more categories
  const canAddCategory = () => {
    const limits = getMembershipLimits();
    return limits.CAN_CREATE_CATEGORIES;
  };

  // Upgrade to Plus (this will be connected to RevenueCat later)
  const upgradeToPlus = async () => {
    // For now, just mock the upgrade
    // Later this will trigger RevenueCat purchase flow
    await saveMembershipStatus(MEMBERSHIP_TIERS.PLUS);
    return true;
  };

  // Restore purchases (will be connected to RevenueCat)
  const restorePurchases = async () => {
    // Mock restore for now
    // Later this will check with RevenueCat
    console.log('Restoring purchases...');
    return false;
  };

  // Add a custom category
  const addCustomCategory = async (category) => {
    if (!isPlusMember) {
      return false;
    }

    const newCategories = [...customCategories, category];
    await saveCustomCategories(newCategories);
    return true;
  };

  // Migrate category data in historical sessions (name and/or color)
  const migrateSessionCategory = async (oldName, updates) => {
    try {
      const sessionsJson = await AsyncStorage.getItem('@completed_sessions');
      if (!sessionsJson) return;

      const sessions = JSON.parse(sessionsJson);
      let modified = false;

      // Update all sessions with old category name
      for (const date in sessions) {
        sessions[date] = sessions[date].map(session => {
          if (session.category === oldName) {
            modified = true;
            const updatedSession = { ...session };
            // Update name if changed
            if (updates.name && updates.name !== oldName) {
              updatedSession.category = updates.name;
            }
            // Update color if provided
            if (updates.color) {
              updatedSession.color = updates.color;
            }
            return updatedSession;
          }
          return session;
        });
      }

      // Save back only if changes were made
      if (modified) {
        await AsyncStorage.setItem('@completed_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error migrating session category data:', error);
    }
  };

  // Update a custom category
  const updateCustomCategory = async (categoryName, updates) => {
    if (!isPlusMember) {
      return false;
    }

    const updatedCategories = customCategories.map(cat =>
      cat.name === categoryName ? { ...cat, ...updates } : cat
    );
    await saveCustomCategories(updatedCategories);

    // If category name or color changed, update all historical sessions
    if ((updates.name && updates.name !== categoryName) || updates.color) {
      await migrateSessionCategory(categoryName, updates);
    }

    // If category name changed, update selected category if it matches
    if (updates.name && updates.name !== categoryName) {
      // Update @selected_category if it matches the old name
      try {
        const selectedCategory = await AsyncStorage.getItem('@selected_category');
        if (selectedCategory === categoryName) {
          await AsyncStorage.setItem('@selected_category', updates.name);
        }
      } catch (error) {
        console.error('Error updating selected category:', error);
      }
    }

    return true;
  };

  // Update custom category time (doesn't require Plus check since it's just updating existing)
  const updateCustomCategoryTime = async (categoryName, minutes) => {
    const updatedCategories = customCategories.map(cat =>
      cat.name === categoryName ? { ...cat, defaultMinutes: minutes } : cat
    );
    await saveCustomCategories(updatedCategories);
    return true;
  };

  // Delete a custom category
  const deleteCustomCategory = async (categoryName) => {
    if (!isPlusMember) {
      return false;
    }

    const filteredCategories = customCategories.filter(cat => cat.name !== categoryName);
    await saveCustomCategories(filteredCategories);
    return true;
  };

  const value = {
    // State
    membershipTier,
    isPlusMember,
    isLoading,
    customCategories,
    testPlusMode,
    expirationDate,

    // Functions
    setTestPlusMode,
    hasFeature,
    canAddCategory,
    getMembershipLimits,
    upgradeToPlus,
    restorePurchases,
    addCustomCategory,
    updateCustomCategory,
    updateCustomCategoryTime,
    deleteCustomCategory,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};