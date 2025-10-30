import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

/**
 * ConfirmationScreen - Popup modal confirmation dialog
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
    Poppins_700Bold,
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
    <View style={styles.overlay}>
      {/* Dark Background - tappable to close */}
      <Pressable
        style={styles.backdrop}
        onPress={() => navigation.goBack()}
      />

      {/* Popup Modal Card */}
      <View style={styles.modalCard}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirmStyle === 'destructive' && styles.destructiveButton,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#FF4444',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
