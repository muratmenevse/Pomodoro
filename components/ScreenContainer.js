import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { MODAL_CONSTANTS, COMMON_MODAL_STYLES } from '../constants/modalStyles';
import { useMembership } from '../contexts/MembershipContext';
import MembershipBadge from './MembershipBadge';

/**
 * ScreenContainer - Container for React Navigation screens with consistent styling
 * Similar to StandardModal but without the Modal wrapper (navigation handles that)
 */
export default function ScreenContainer({
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  scrollable = true,
  headerStyle = {},
  contentStyle = {},
  showMembershipBadge = null,
  isPlusFeature = false,
}) {
  const { isPlusMember } = useMembership();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Auto-show badge if isPlusFeature and user is Plus member
  const shouldShowBadge = showMembershipBadge || (isPlusFeature && isPlusMember);

  const ContentWrapper = scrollable ? ScrollView : View;
  const scrollProps = scrollable ? {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: styles.scrollContent,
  } : {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, headerStyle, { zIndex: 10 }]}>
        {/* Title and Subtitle */}
        {(title || subtitle) && (
          <View style={styles.titleContainer}>{title && <Text style={styles.title}>{title}</Text>}{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
        )}

        {/* Membership Badge */}
        {shouldShowBadge && (
          <View style={styles.badgeContainer}>
            <MembershipBadge />
          </View>
        )}

        {/* Close Button */}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ContentWrapper style={[styles.content, contentStyle, { zIndex: 1 }]} {...scrollProps}>
        {children}
      </ContentWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: COMMON_MODAL_STYLES.container,
  header: COMMON_MODAL_STYLES.header,
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: COMMON_MODAL_STYLES.title,
  subtitle: COMMON_MODAL_STYLES.subtitle,
  badgeContainer: {
    position: 'absolute',
    left: MODAL_CONSTANTS.HEADER_PADDING_HORIZONTAL,
    top: MODAL_CONSTANTS.HEADER_PADDING_TOP + 5,
  },
  closeButton: COMMON_MODAL_STYLES.closeButton,
  closeButtonText: COMMON_MODAL_STYLES.closeButtonText,
  content: COMMON_MODAL_STYLES.content,
  scrollContent: COMMON_MODAL_STYLES.scrollContent,
});
