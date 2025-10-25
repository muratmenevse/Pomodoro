import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import PadlockIcon from './PadlockIcon';

/**
 * PlusMenuItem - Menu item component with automatic Plus feature gating
 *
 * Props:
 * - label: Text to display
 * - onPress: Function to call when clicked (only if user has access)
 * - isPlusFeature: Whether this is a Plus-only feature (default: false)
 * - testPlusMode: Override for testing (default: false)
 * - style: Additional styles for the container
 */
export default function PlusMenuItem({
  label,
  onPress,
  isPlusFeature = false,
  testPlusMode = false,
  style = {},
}) {
  const { isPlusMember: actualIsPlusMember, setShowUpgradeModal } = useMembership();
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;

  // Determine if we should show the padlock (Plus feature + not a Plus member)
  const showPadlock = isPlusFeature && !isPlusMember;

  // Handle press: if Plus feature and not member, show upgrade modal
  const handlePress = () => {
    if (showPadlock) {
      setShowUpgradeModal(true);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.menuItem, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {showPadlock && (
          <PadlockIcon
            size={28}
            iconSize={14}
            style={styles.padlock}
          />
        )}
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  padlock: {
    marginRight: 10,
  },
});
