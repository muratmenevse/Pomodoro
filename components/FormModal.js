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
import { MODAL_CONSTANTS, FORM_MODAL_STYLES } from '../constants/modalStyles';

/**
 * FormModal - Modal component for forms with Cancel/Save actions
 *
 * Props:
 * - visible: Boolean to control modal visibility
 * - onCancel: Function to call when cancelling
 * - onSave: Function to call when saving
 * - title: Main title text
 * - children: Form content to render inside the modal
 * - saveText: Custom save button text (default: "Save")
 * - cancelText: Custom cancel button text (default: "Cancel")
 * - saveDisabled: Disable save button (default: false)
 * - scrollable: Make content scrollable (default: true)
 * - contentStyle: Custom content container style
 */
export default function FormModal({
  visible,
  onCancel,
  onSave,
  title,
  children,
  saveText = 'Save',
  cancelText = 'Cancel',
  saveDisabled = false,
  scrollable = true,
  contentStyle = {},
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
    keyboardShouldPersistTaps: 'handled',
  } : {};

  return (
    <Modal
      visible={visible}
      animationType={MODAL_CONSTANTS.ANIMATION_TYPE}
      transparent={MODAL_CONSTANTS.TRANSPARENT}
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>

          <TouchableOpacity
            style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saveDisabled}
          >
            <Text style={[styles.saveButtonText, saveDisabled && styles.saveButtonTextDisabled]}>
              {saveText}
            </Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: MODAL_CONSTANTS.BACKGROUND_COLOR,
  },
  header: FORM_MODAL_STYLES.header,
  title: FORM_MODAL_STYLES.title,
  cancelButton: FORM_MODAL_STYLES.cancelButton,
  cancelButtonText: FORM_MODAL_STYLES.cancelButtonText,
  saveButton: FORM_MODAL_STYLES.saveButton,
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: FORM_MODAL_STYLES.saveButtonText,
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: MODAL_CONSTANTS.CONTENT_PADDING_HORIZONTAL,
    paddingTop: MODAL_CONSTANTS.CONTENT_PADDING_TOP,
  },
});