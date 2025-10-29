import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import PlusMenuItem from './PlusMenuItem';

export default function HamburgerMenu({ visible, onClose, onSettings, onProgress, onPlusClick, onTest, testPlusMode = false }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Menu */}
        <View style={styles.menu}>
          <PlusMenuItem
            label="Progress"
            isPlusFeature={true}
            testPlusMode={testPlusMode}
            onPress={() => {
              onClose();
              onProgress();
            }}
            onPlusClick={() => {
              onClose();
              onPlusClick();
            }}
          />

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              onSettings();
            }}
          >
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>

          {/* Test menu - only in development */}
          {__DEV__ && (
            <>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onTest();
                }}
              >
                <Text style={[styles.menuItemText, styles.testMenuText]}>Test</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    top: 65,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(139, 139, 139, 0.2)',
    marginHorizontal: 10,
  },
  testMenuText: {
    color: '#9C27B0',
  },
});
