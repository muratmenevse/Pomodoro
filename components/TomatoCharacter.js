import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';

export default function TomatoCharacter({ size = 150 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 150 150">
        {/* Tomato body */}
        <Circle cx="75" cy="85" r="45" fill="#FF6B6B" />
        <Ellipse cx="60" cy="80" rx="20" ry="25" fill="#FF6B6B" />
        <Ellipse cx="90" cy="80" rx="20" ry="25" fill="#FF6B6B" />

        {/* Highlight */}
        <Ellipse cx="60" cy="75" rx="8" ry="12" fill="#FF8787" opacity="0.6" />

        {/* Stem */}
        <Path
          d="M 75 35 Q 70 40, 75 45"
          stroke="#4CAF50"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Leaves */}
        <Path
          d="M 75 38 Q 85 35, 90 40 Q 85 38, 75 40"
          fill="#66BB6A"
        />
        <Path
          d="M 75 38 Q 65 35, 60 40 Q 65 38, 75 40"
          fill="#66BB6A"
        />

        {/* Face - Eyes */}
        <Circle cx="65" cy="85" r="3" fill="#2C3E50" />
        <Circle cx="85" cy="85" r="3" fill="#2C3E50" />

        {/* Smile */}
        <Path
          d="M 65 95 Q 75 100, 85 95"
          stroke="#2C3E50"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Rosy cheeks */}
        <Ellipse cx="55" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />
        <Ellipse cx="95" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />
      </Svg>
    </View>
  );
}
