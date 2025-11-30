import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from '../services/AnalyticsService';

/**
 * AnalyticsConsentContext - Manages analytics consent state
 *
 * Handles:
 * - Checking if user has been asked for consent
 * - Storing consent decision
 * - Showing consent modal on first launch
 * - Providing consent state to the app
 */

const CONSENT_STORAGE_KEY = '@analytics_consent';
const CONSENT_ASKED_KEY = '@analytics_consent_asked';

const AnalyticsConsentContext = createContext(null);

export function AnalyticsConsentProvider({ children }) {
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentAsked, setConsentAsked] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent status on mount
  useEffect(() => {
    loadConsentStatus();
  }, []);

  /**
   * Load consent status from storage
   */
  const loadConsentStatus = async () => {
    try {
      // Check if we've asked for consent before
      const asked = await AsyncStorage.getItem(CONSENT_ASKED_KEY);
      const hasAsked = asked === 'true';

      // Check current consent status
      const consentData = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      let granted = false;

      if (consentData) {
        const { granted: consentGranted } = JSON.parse(consentData);
        granted = consentGranted === true;
      }

      setConsentAsked(hasAsked);
      setConsentGranted(granted);

      // Show consent modal if never asked
      if (!hasAsked) {
        setShowConsentModal(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[AnalyticsConsent] Failed to load consent status:', error);
      setIsLoading(false);
    }
  };

  /**
   * Grant analytics consent
   * @param {string} apiKey - PostHog API key
   */
  const grantConsent = useCallback(async (apiKey) => {
    try {
      // Mark that we've asked
      await AsyncStorage.setItem(CONSENT_ASKED_KEY, 'true');

      // Grant consent in AnalyticsService
      await AnalyticsService.grantConsent(apiKey);

      setConsentGranted(true);
      setConsentAsked(true);
      setShowConsentModal(false);

      console.log('[AnalyticsConsent] Consent granted');
    } catch (error) {
      console.error('[AnalyticsConsent] Failed to grant consent:', error);
    }
  }, []);

  /**
   * Decline analytics consent
   */
  const declineConsent = useCallback(async () => {
    try {
      // Mark that we've asked
      await AsyncStorage.setItem(CONSENT_ASKED_KEY, 'true');

      // Store decline decision
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        granted: false,
        date: new Date().toISOString(),
      }));

      setConsentGranted(false);
      setConsentAsked(true);
      setShowConsentModal(false);

      console.log('[AnalyticsConsent] Consent declined');
    } catch (error) {
      console.error('[AnalyticsConsent] Failed to decline consent:', error);
    }
  }, []);

  /**
   * Revoke previously granted consent
   */
  const revokeConsent = useCallback(async () => {
    try {
      await AnalyticsService.revokeConsent();
      setConsentGranted(false);
      console.log('[AnalyticsConsent] Consent revoked');
    } catch (error) {
      console.error('[AnalyticsConsent] Failed to revoke consent:', error);
    }
  }, []);

  /**
   * Re-ask for consent (admin/debug use)
   */
  const resetConsent = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CONSENT_ASKED_KEY);
      await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
      setConsentAsked(false);
      setConsentGranted(false);
      setShowConsentModal(true);
      console.log('[AnalyticsConsent] Consent reset');
    } catch (error) {
      console.error('[AnalyticsConsent] Failed to reset consent:', error);
    }
  }, []);

  const value = {
    consentGranted,
    consentAsked,
    showConsentModal,
    isLoading,
    grantConsent,
    declineConsent,
    revokeConsent,
    resetConsent,
  };

  return (
    <AnalyticsConsentContext.Provider value={value}>
      {children}
    </AnalyticsConsentContext.Provider>
  );
}

/**
 * Hook to access analytics consent context
 * @returns {object} Consent manager API
 */
export function useAnalyticsConsent() {
  const context = useContext(AnalyticsConsentContext);
  if (!context) {
    throw new Error('useAnalyticsConsent must be used within an AnalyticsConsentProvider');
  }
  return context;
}
