import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { NavigationContainer } from '@react-navigation/native';
import { MembershipProvider } from './contexts/MembershipContext';
import { ModalProvider } from './contexts/ModalContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import ConfirmationModal from './components/ConfirmationModal';
import AppNavigator from './navigation/AppNavigator';
import RevenueCatService from './services/RevenueCatService';
import NotificationService from './services/NotificationService';
import AnalyticsService from './services/AnalyticsService';
import { ANALYTICS_EVENTS, USER_PROPERTIES, POSTHOG_CONFIG } from './constants/analytics';

export default function App() {
  const navigationRef = useRef(null);
  const isNavigationReady = useRef(false);

  // Initialize RevenueCat and Analytics on app start
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await Promise.all([
          (async () => {
            // Configure RevenueCat first
            await RevenueCatService.configure();

            // Get PostHog API key from config
            const apiKey = POSTHOG_CONFIG.API_KEY;

            // Now get user ID from RevenueCat (should have real ID)
            const purchaserInfo = await RevenueCatService.getPurchaserInfo();
            const userId = purchaserInfo?.originalAppUserId || null;

            // Initialize analytics
            await AnalyticsService.initialize(apiKey, userId);

            // Track app opened event
            await AnalyticsService.trackEvent(ANALYTICS_EVENTS.APP_OPENED, {
              [USER_PROPERTIES.PLATFORM]: Platform.OS,
            });

            console.log('[App] Services initialized');
          })(),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
      } catch (error) {
        console.error('[App] Failed to initialize services:', error);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Splash may already be hidden
        }
      }
    };

    initializeServices();
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
              <AppNavigator />
              <ConfirmationModal />
          </ConfirmationProvider>
        </ModalProvider>
      </MembershipProvider>
    </NavigationContainer>
  );
}
