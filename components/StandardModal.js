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
 * - showMembershipBadge: Optional membership badge component
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
}) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
        <View style={[styles.header, headerStyle]}>
          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Membership Badge if provided */}
          {showMembershipBadge}

          {/* Close Button */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ContentWrapper style={[styles.content, contentStyle]} {...scrollProps}>
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
});