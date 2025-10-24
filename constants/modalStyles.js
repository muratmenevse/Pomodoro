import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Modal Layout Constants
export const MODAL_CONSTANTS = {
  // Header dimensions
  HEADER_HEIGHT: 100,
  HEADER_PADDING_TOP: 60,
  HEADER_PADDING_HORIZONTAL: 20,
  HEADER_PADDING_BOTTOM: 20,

  // Close button
  CLOSE_BUTTON_SIZE: 44,  // Touch target size (accessibility)
  CLOSE_BUTTON_ICON_SIZE: 28,  // Visual size of X
  CLOSE_BUTTON_TOP: 60,
  CLOSE_BUTTON_RIGHT: 20,

  // Content padding
  CONTENT_PADDING_HORIZONTAL: 20,
  CONTENT_PADDING_TOP: 20,
  CONTENT_PADDING_BOTTOM: 20,

  // Typography
  TITLE_FONT_SIZE: 24,
  SUBTITLE_FONT_SIZE: 16,
  LABEL_FONT_SIZE: 14,

  // Colors
  BACKGROUND_COLOR: '#F5F1ED',
  TEXT_COLOR: '#2C3E50',
  TEXT_COLOR_SECONDARY: '#8B8B8B',
  CLOSE_BUTTON_COLOR: '#2C3E50',

  // Animation
  ANIMATION_TYPE: 'slide',
  TRANSPARENT: false,
};

// Common modal styles to be reused
export const COMMON_MODAL_STYLES = {
  container: {
    flex: 1,
    backgroundColor: MODAL_CONSTANTS.BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: MODAL_CONSTANTS.HEADER_PADDING_TOP,
    paddingHorizontal: MODAL_CONSTANTS.HEADER_PADDING_HORIZONTAL,
    paddingBottom: MODAL_CONSTANTS.HEADER_PADDING_BOTTOM,
  },
  title: {
    fontSize: MODAL_CONSTANTS.TITLE_FONT_SIZE,
    fontFamily: 'Poppins_600SemiBold',
    color: MODAL_CONSTANTS.TEXT_COLOR,
  },
  subtitle: {
    fontSize: MODAL_CONSTANTS.SUBTITLE_FONT_SIZE,
    fontFamily: 'Poppins_400Regular',
    color: MODAL_CONSTANTS.TEXT_COLOR_SECONDARY,
  },
  closeButton: {
    position: 'absolute',
    right: MODAL_CONSTANTS.CLOSE_BUTTON_RIGHT,
    top: MODAL_CONSTANTS.CLOSE_BUTTON_TOP,
    width: MODAL_CONSTANTS.CLOSE_BUTTON_SIZE,
    height: MODAL_CONSTANTS.CLOSE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  closeButtonText: {
    fontSize: MODAL_CONSTANTS.CLOSE_BUTTON_ICON_SIZE,
    color: MODAL_CONSTANTS.CLOSE_BUTTON_COLOR,
  },
  content: {
    flex: 1,
    paddingHorizontal: MODAL_CONSTANTS.CONTENT_PADDING_HORIZONTAL,
  },
  scrollContent: {
    paddingTop: MODAL_CONSTANTS.CONTENT_PADDING_TOP,
    paddingBottom: MODAL_CONSTANTS.CONTENT_PADDING_BOTTOM,
  },
};

// Form modal specific styles
export const FORM_MODAL_STYLES = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: MODAL_CONSTANTS.HEADER_PADDING_TOP,
    paddingHorizontal: MODAL_CONSTANTS.HEADER_PADDING_HORIZONTAL,
    paddingBottom: MODAL_CONSTANTS.HEADER_PADDING_BOTTOM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 139, 139, 0.2)',
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: MODAL_CONSTANTS.TEXT_COLOR_SECONDARY,
  },
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9C27B0',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: MODAL_CONSTANTS.TEXT_COLOR,
  },
};