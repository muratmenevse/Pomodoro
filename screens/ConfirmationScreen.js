import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import ScreenContainer from '../components/ScreenContainer';

/**
 * ConfirmationScreen - Reusable confirmation dialog
 *
 * Route params:
 * - title: Title of the confirmation dialog (default: "Confirm")
 * - message: Message/question to display
 * - confirmText: Text for confirm button (default: "Confirm")
 * - cancelText: Text for cancel button (default: "Cancel")
 * - onConfirm: Function to call when user confirms
 * - confirmStyle: 'default' (purple) or 'destructive' (red) (default: 'default')
 */
export default function ConfirmationScreen({ navigation, route }) {
  const {
    title = 'Confirm',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    confirmStyle = 'default',
  } = route.params || {};

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    navigation.goBack();
  };

  return (
    <ScreenContainer
      onClose={() => navigation.goBack()}
      title={title}
      scrollable={false}
      showCloseButton={false}
    >
      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{message}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>{cancelText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            confirmStyle === 'destructive' && styles.destructiveButton,
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(139, 139, 139, 0.15)',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#9C27B0',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#FF0000',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
