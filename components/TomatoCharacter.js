import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Rect } from 'react-native-svg';
import { CHARACTER_STATES } from './characterStates';

export default function TomatoCharacter({ size = 150, state = CHARACTER_STATES.IDLE }) {
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation loop for focusing state
  useEffect(() => {
    if (state === CHARACTER_STATES.FOCUSING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      breathingAnim.setValue(1);
    }
  }, [state]);

  // Playful bounce and wiggle animation for completed state (continuous loop)
  useEffect(() => {
    if (state === CHARACTER_STATES.COMPLETED) {
      // Continuous bouncing loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: -15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wiggle/rotate animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
      wiggleAnim.setValue(0);
    }
  }, [state]);

  // Render eyes based on state
  const renderEyes = () => {
    if (state === CHARACTER_STATES.COMPLETED) {
      // Happy eyes: ^ ^
      return (
        <G>
          <Path
            d="M 60 85 L 65 82 L 70 85"
            stroke="#2C3E50"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M 80 85 L 85 82 L 90 85"
            stroke="#2C3E50"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      );
    } else if (state === CHARACTER_STATES.FOCUSING) {
      // Focused eyes: smaller, concentrated
      return (
        <G>
          <Circle cx="65" cy="85" r="2" fill="#2C3E50" />
          <Circle cx="85" cy="85" r="2" fill="#2C3E50" />
        </G>
      );
    } else {
      // Normal eyes: • •
      return (
        <G>
          <Circle cx="65" cy="85" r="3" fill="#2C3E50" />
          <Circle cx="85" cy="85" r="3" fill="#2C3E50" />
        </G>
      );
    }
  };

  // Render mouth based on state
  const renderMouth = () => {
    if (state === CHARACTER_STATES.COMPLETED) {
      // Big smile
      return (
        <Path
          d="M 62 95 Q 75 102, 88 95"
          stroke="#2C3E50"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    } else if (state === CHARACTER_STATES.FOCUSING) {
      // Neutral mouth (straight line)
      return (
        <Path
          d="M 65 95 L 85 95"
          stroke="#2C3E50"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    } else {
      // Normal smile
      return (
        <Path
          d="M 65 95 Q 75 100, 85 95"
          stroke="#2C3E50"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
  };

  // Render glasses for focusing state
  const renderGlasses = () => {
    if (state === CHARACTER_STATES.FOCUSING) {
      return (
        <G>
          {/* Left lens */}
          <Rect
            x="58"
            y="80"
            width="14"
            height="10"
            rx="2"
            ry="2"
            fill="none"
            stroke="#FFC107"
            strokeWidth="2"
          />
          {/* Right lens */}
          <Rect
            x="78"
            y="80"
            width="14"
            height="10"
            rx="2"
            ry="2"
            fill="none"
            stroke="#FFC107"
            strokeWidth="2"
          />
          {/* Bridge */}
          <Path
            d="M 72 85 L 78 85"
            stroke="#FFC107"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Left arm */}
          <Path
            d="M 58 85 L 52 86"
            stroke="#FFC107"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Right arm */}
          <Path
            d="M 92 85 L 98 86"
            stroke="#FFC107"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </G>
      );
    }
    return null;
  };

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [
          { translateY: bounceAnim },
          { rotate: wiggleAnim.interpolate({
              inputRange: [-10, 10],
              outputRange: ['-10deg', '10deg']
            })
          }
        ]
      }}
    >
      <Animated.View style={{ transform: [{ scale: breathingAnim }] }}>
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
          {renderEyes()}

          {/* Mouth */}
          {renderMouth()}

          {/* Rosy cheeks */}
          <Ellipse cx="55" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />
          <Ellipse cx="95" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />

          {/* Glasses (only when focusing) */}
          {renderGlasses()}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
