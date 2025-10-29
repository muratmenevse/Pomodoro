import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MembershipProvider } from './contexts/MembershipContext';
import { ModalProvider } from './contexts/ModalContext';
import AppNavigator from './navigation/AppNavigator';
import RevenueCatService from './services/RevenueCatService';

export default function App() {
  // Initialize RevenueCat on app start
  useEffect(() => {
    RevenueCatService.configure();
  }, []);

  return (
    <NavigationContainer>
      <MembershipProvider>
        <ModalProvider>
          <AppNavigator />
        </ModalProvider>
      </MembershipProvider>
    </NavigationContainer>
  );
}
