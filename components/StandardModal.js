import React from 'react';
import {
  Modal,
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
 * StandardModal - Reusable modal component with consistent styling
 *
 * Props:
 * - visible: Boolean to control modal visibility
 * - onClose: Function to call when closing the modal
 * - title: Main title text
 * - subtitle: Optional subtitle text
 * - children: Content to render inside the modal
 * - showCloseButton: Show/hide close button (default: true)
 * - scrollable: Make content scrollable (default: true)
 * - headerStyle: Custom header style
 * - contentStyle: Custom content container style
 * - showMembershipBadge: Optional membership badge component (manual override)
 * - isPlusFeature: Auto-show Plus badge if user is Plus member (default: false)
 */
export default function StandardModal({
  visible,
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
    <Modal
      visible={visible}
      animationType={MODAL_CONSTANTS.ANIMATION_TYPE}
      transparent={MODAL_CONSTANTS.TRANSPARENT}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, headerStyle, { zIndex: 10 }]}>
          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Membership Badge if provided or auto-enabled */}
          {shouldShowBadge && (
            showMembershipBadge || <MembershipBadge style={styles.membershipBadge} />
          )}

          {/* Close Button */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ContentWrapper style={[styles.content, contentStyle, { zIndex: 1 }]} {...scrollProps}>
          {children}
        </ContentWrapper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: COMMON_MODAL_STYLES.container,
  header: COMMON_MODAL_STYLES.header,
  titleContainer: {
    alignItems: 'center',
  },
  title: COMMON_MODAL_STYLES.title,
  subtitle: COMMON_MODAL_STYLES.subtitle,
  closeButton: COMMON_MODAL_STYLES.closeButton,
  closeButtonText: COMMON_MODAL_STYLES.closeButtonText,
  content: COMMON_MODAL_STYLES.content,
  scrollContent: COMMON_MODAL_STYLES.scrollContent,
  membershipBadge: {
    marginLeft: 10,
  },
});