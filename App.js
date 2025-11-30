import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MembershipProvider } from './contexts/MembershipContext';
import { ModalProvider } from './contexts/ModalContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { AnalyticsConsentProvider } from './contexts/AnalyticsConsentContext';
import ConfirmationModal from './components/ConfirmationModal';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import AppNavigator from './navigation/AppNavigator';
import RevenueCatService from './services/RevenueCatService';
import NotificationService from './services/NotificationService';
import AnalyticsService from './services/AnalyticsService';
import { ANALYTICS_EVENTS, USER_PROPERTIES } from './constants/analytics';

export default function App() {
  const navigationRef = useRef(null);
  const isNavigationReady = useRef(false);

  // Initialize RevenueCat on app start
  useEffect(() => {
    RevenueCatService.configure();
  }, []);

  // Initialize Analytics on app start
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Get PostHog API key from environment
        const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_test_key_dev_only';

        // Get user ID from RevenueCat (may be null on first launch)
        const purchaserInfo = await RevenueCatService.getPurchaserInfo();
        const userId = purchaserInfo?.originalAppUserId || null;

        // Initialize analytics (will respect consent)
        await AnalyticsService.initialize(apiKey, userId);

        // Track app opened event
        await AnalyticsService.trackEvent(ANALYTICS_EVENTS.APP_OPENED, {
          [USER_PROPERTIES.PLATFORM]: Platform.OS,
        });

        console.log('[App] Analytics initialized');
      } catch (error) {
        console.error('[App] Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);

  // Handle notification taps (only on mobile platforms)
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = NotificationService.addNotificationResponseListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      const sessionMinutes = response.notification.request.content.data?.sessionMinutes;
      const totalMinutes = response.notification.request.content.data?.totalMinutes;

      if (screen === 'Success' && navigationRef.current && isNavigationReady.current) {
        navigationRef.current.navigate(screen, {
          sessionMinutes,
          totalMinutes,
        });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        isNavigationReady.current = true;
      }}
    >
      <MembershipProvider>
        <ModalProvider>
          <ConfirmationProvider>
            <AnalyticsConsentProvider>
              <AppNavigator />
              <ConfirmationModal />
              <PrivacyConsentModal />
            </AnalyticsConsentProvider>
          </ConfirmationProvider>
        </ModalProvider>
      </MembershipProvider>
    </NavigationContainer>
  );
}
