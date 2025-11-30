import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useAnalyticsConsent } from '../contexts/AnalyticsConsentContext';

// PostHog API key - get from environment variable
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_test_key_dev_only';

/**
 * PrivacyConsentModal - GDPR-compliant consent dialog for analytics
 *
 * Shows on first app launch to request user consent for analytics tracking.
 * Follows your app's design patterns (similar to ConfirmationScreen).
 */
export default function PrivacyConsentModal() {
  const { showConsentModal, grantConsent, declineConsent } = useAnalyticsConsent();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded || !showConsentModal) {
    return null;
  }

  const handleAccept = async () => {
    await grantConsent(POSTHOG_API_KEY);
  };

  const handleDecline = async () => {
    await declineConsent();
  };

  return (
    <Modal
      visible={showConsentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        {/* Dark Background */}
        <Pressable
          style={styles.backdrop}
          onPress={handleDecline} // Allow closing by tapping background
        />

        {/* Popup Modal Card */}
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.title}>Help Us Improve</Text>

            {/* Message */}
            <Text style={styles.message}>
              We'd like to collect anonymous usage data to improve your experience and understand how the app is used.
            </Text>

            {/* What we collect */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>What we collect:</Text>
              <Text style={styles.bulletPoint}>• App usage and feature interactions</Text>
              <Text style={styles.bulletPoint}>• Timer completion statistics</Text>
              <Text style={styles.bulletPoint}>• Device type and app version</Text>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>What we DON'T collect:</Text>
              <Text style={styles.bulletPoint}>• Personal information</Text>
              <Text style={styles.bulletPoint}>• Category names or custom content</Text>
              <Text style={styles.bulletPoint}>• Exact times or dates</Text>
            </View>

            {/* Privacy note */}
            <Text style={styles.privacyNote}>
              Your data is anonymous and helps us make the app better. You can change this anytime in Settings.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>No Thanks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    lineHeight: 20,
    paddingLeft: 8,
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9C27B0',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'rgba(139, 139, 139, 0.15)',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#9C27B0',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
