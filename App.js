import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MembershipProvider } from './contexts/MembershipContext';
import { ModalProvider } from './contexts/ModalContext';
import AppNavigator from './navigation/AppNavigator';
import RevenueCatService from './services/RevenueCatService';
import NotificationService from './services/NotificationService';

export default function App() {
  const navigationRef = useRef(null);
  const isNavigationReady = useRef(false);

  // Initialize RevenueCat on app start
  useEffect(() => {
    RevenueCatService.configure();
  }, []);

  // Handle notification taps
  useEffect(() => {
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
          <AppNavigator />
        </ModalProvider>
      </MembershipProvider>
    </NavigationContainer>
  );
}
