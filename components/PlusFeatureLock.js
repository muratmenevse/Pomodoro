import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMembership } from '../contexts/MembershipContext';

export default function PlusFeatureLock({ children, feature, onPress, style, lockPosition = 'center' }) {
  const { isPlusMember, setShowUpgradeModal } = useMembership();

  // If user is a Plus member, render children normally
  if (isPlusMember) {
    return <View style={style}>{children}</View>;
  }

  // For free users, wrap with lock overlay
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const isLeftPosition = lockPosition === 'left';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      <View style={[
        styles.contentWrapper,
        isLeftPosition ? styles.contentWrapperLeft : styles.contentWrapperCenter
      ]}>
        {/* Lock icon for left position */}
        {isLeftPosition && (
          <View style={styles.leftLockContainer}>
            <Svg width="18" height="18" viewBox="0 0 24 24">
              <Path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        )}
        {children}
      </View>

      {/* Lock overlay for center position */}
      {!isLeftPosition && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIconContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentWrapperCenter: {
    opacity: 0.5,
  },
  contentWrapperLeft: {
    // No opacity reduction for left position - keeps button looking interactive
  },
  leftLockContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    backgroundColor: 'rgba(156, 39, 176, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});