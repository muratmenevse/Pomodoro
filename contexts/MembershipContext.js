import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MEMBERSHIP_TIERS,
  MEMBERSHIP_LIMITS,
  MEMBERSHIP_STORAGE_KEYS,
  PLUS_FEATURES
} from '../constants/membership';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [testPlusMode, setTestPlusModeState] = useState(false);

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
          setTestPlusModeState(JSON.parse(testMode));
        }
      } catch (error) {
        console.error('Error loading test mode:', error);
      }
    }
  };

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
      setShowUpgradeModal(true);
      return false;
    }

    const newCategories = [...customCategories, category];
    await saveCustomCategories(newCategories);
    return true;
  };

  // Update a custom category
  const updateCustomCategory = async (categoryName, updates) => {
    if (!isPlusMember) {
      setShowUpgradeModal(true);
      return false;
    }

    const updatedCategories = customCategories.map(cat =>
      cat.name === categoryName ? { ...cat, ...updates } : cat
    );
    await saveCustomCategories(updatedCategories);
    return true;
  };

  // Delete a custom category
  const deleteCustomCategory = async (categoryName) => {
    if (!isPlusMember) {
      setShowUpgradeModal(true);
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
    showUpgradeModal,
    testPlusMode,

    // Functions
    setShowUpgradeModal,
    setTestPlusMode,
    hasFeature,
    canAddCategory,
    getMembershipLimits,
    upgradeToPlus,
    restorePurchases,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};