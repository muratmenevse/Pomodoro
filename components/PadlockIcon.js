import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * PadlockIcon - Reusable padlock icon for Plus features
 *
 * Props:
 * - size: Size of the icon container (default: 28)
 * - iconSize: Size of the SVG icon (default: 14)
 * - backgroundColor: Background color (default: #9C27B0 - purple)
 * - iconColor: Icon color (default: #FFFFFF - white)
 * - style: Additional styles for the container
 */
export default function PadlockIcon({
  size = 28,
  iconSize = 14,
  backgroundColor = '#9C27B0',
  iconColor = '#FFFFFF',
  style = {},
}) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        <Path
          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
          fill={iconColor}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
