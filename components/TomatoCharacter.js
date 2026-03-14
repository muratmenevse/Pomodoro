import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Rect } from 'react-native-svg';
import { CHARACTER_STATES } from './characterStates';

export default function TomatoCharacter({ size = 150, state = CHARACTER_STATES.IDLE }) {
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const steamAnim = useRef(new Animated.Value(0)).current;
  const wiltAnim = useRef(new Animated.Value(0)).current;

  // Animation instance refs for cleanup
  const breathingAnimRef = useRef(null);
  const bounceAnimRef = useRef(null);
  const wiggleAnimRef = useRef(null);
  const swayAnimRef = useRef(null);
  const steamAnimRef = useRef(null);
  const wiltAnimRef = useRef(null);

  // Breathing animation loop for focusing state
  useEffect(() => {
    if (state === CHARACTER_STATES.FOCUSING) {
      breathingAnimRef.current = Animated.loop(
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
      );
      breathingAnimRef.current.start();
    } else {
      if (breathingAnimRef.current) {
        breathingAnimRef.current.stop();
      }
      breathingAnim.setValue(1);
    }

    return () => {
      if (breathingAnimRef.current) {
        breathingAnimRef.current.stop();
      }
    };
  }, [state]);

  // Playful bounce and wiggle animation for completed state (continuous loop)
  useEffect(() => {
    if (state === CHARACTER_STATES.COMPLETED) {
      // Scale bounce values proportionally to size (default size is 150)
      const sizeRatio = size / 150;
      const bigBounce = -25 * sizeRatio;
      const smallBounce = -15 * sizeRatio;

      // Continuous bouncing loop
      bounceAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: bigBounce,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: smallBounce,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      bounceAnimRef.current.start();

      // Wiggle/rotate animation
      wiggleAnimRef.current = Animated.loop(
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
      );
      wiggleAnimRef.current.start();
    } else {
      if (bounceAnimRef.current) {
        bounceAnimRef.current.stop();
      }
      if (wiggleAnimRef.current) {
        wiggleAnimRef.current.stop();
      }
      bounceAnim.setValue(0);
      wiggleAnim.setValue(0);
    }

    return () => {
      if (bounceAnimRef.current) {
        bounceAnimRef.current.stop();
      }
      if (wiggleAnimRef.current) {
        wiggleAnimRef.current.stop();
      }
    };
  }, [state, size]);

  // Gentle sway and steam animation for break state
  useEffect(() => {
    if (state === CHARACTER_STATES.BREAK) {
      // Reset to start position
      swayAnim.setValue(0);
      steamAnim.setValue(0);

      // Gentle side-to-side sway using sine wave for perfectly smooth motion
      swayAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      swayAnimRef.current.start();

      // Steam rising animation
      steamAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(steamAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(steamAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      steamAnimRef.current.start();
    } else {
      if (swayAnimRef.current) {
        swayAnimRef.current.stop();
      }
      if (steamAnimRef.current) {
        steamAnimRef.current.stop();
      }
      swayAnim.setValue(0);
      steamAnim.setValue(0);
    }

    return () => {
      if (swayAnimRef.current) {
        swayAnimRef.current.stop();
      }
      if (steamAnimRef.current) {
        steamAnimRef.current.stop();
      }
    };
  }, [state]);

  // Wilting animation for rotten state (slow droop)
  useEffect(() => {
    if (state === CHARACTER_STATES.ROTTEN) {
      wiltAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(wiltAnim, {
            toValue: 3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(wiltAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      wiltAnimRef.current.start();
    } else {
      if (wiltAnimRef.current) {
        wiltAnimRef.current.stop();
      }
      wiltAnim.setValue(0);
    }

    return () => {
      if (wiltAnimRef.current) {
        wiltAnimRef.current.stop();
      }
    };
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
    } else if (state === CHARACTER_STATES.BREAK) {
      // Relaxed eyes: slightly larger, content
      return (
        <G>
          <Circle cx="65" cy="85" r="3.5" fill="#2C3E50" />
          <Circle cx="85" cy="85" r="3.5" fill="#2C3E50" />
        </G>
      );
    } else if (state === CHARACTER_STATES.ROTTEN) {
      // Sad X eyes: X X
      return (
        <G>
          {/* Left X eye */}
          <Path
            d="M 61 81 L 69 89 M 61 89 L 69 81"
            stroke="#2C3E50"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right X eye */}
          <Path
            d="M 81 81 L 89 89 M 81 89 L 89 81"
            stroke="#2C3E50"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
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
    } else if (state === CHARACTER_STATES.BREAK) {
      // Content smile (between normal and big)
      return (
        <Path
          d="M 63 95 Q 75 101, 87 95"
          stroke="#2C3E50"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    } else if (state === CHARACTER_STATES.ROTTEN) {
      // Sad frown (downward curve)
      return (
        <Path
          d="M 62 100 Q 75 93, 88 100"
          stroke="#2C3E50"
          strokeWidth="2.5"
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

  // Render coffee cup with steam for break state
  const renderCoffeeCup = () => {
    if (state === CHARACTER_STATES.BREAK) {
      return (
        <G>
          {/* Coffee cup body */}
          <Path
            d="M 105 95 L 105 110 Q 105 115, 110 115 L 125 115 Q 130 115, 130 110 L 130 95 Z"
            fill="#8B4513"
            stroke="#2C3E50"
            strokeWidth="2"
          />
          {/* Coffee liquid */}
          <Path
            d="M 106 98 L 129 98 L 129 110 Q 129 113, 126 113 L 109 113 Q 106 113, 106 110 Z"
            fill="#6B3410"
          />
          {/* Cup handle */}
          <Path
            d="M 130 100 Q 138 100, 138 107 Q 138 114, 130 114"
            fill="none"
            stroke="#2C3E50"
            strokeWidth="2"
          />
        </G>
      );
    }
    return null;
  };

  // Render animated steam separately outside SVG
  const renderSteam = () => {
    if (state === CHARACTER_STATES.BREAK) {
      const steamOpacity = steamAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 0]
      });

      const steamTranslateY = steamAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15]
      });

      return (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            opacity: steamOpacity,
            transform: [{ translateY: steamTranslateY }],
            pointerEvents: 'none',
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 150 150">
            <Path
              d="M 110 90 Q 112 85, 110 80"
              stroke="#999999"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 117 92 Q 119 87, 117 82"
              stroke="#999999"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M 124 90 Q 126 85, 124 80"
              stroke="#999999"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      );
    }
    return null;
  };

  // Determine which rotation animation to use based on state
  const getRotationTransform = () => {
    if (state === CHARACTER_STATES.BREAK) {
      // Use sine wave for perfectly smooth pendulum motion
      return { rotate: swayAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '5deg', '0deg', '-5deg', '0deg']
      })};
    } else if (state === CHARACTER_STATES.COMPLETED) {
      return { rotate: wiggleAnim.interpolate({
        inputRange: [-10, 10],
        outputRange: ['-10deg', '10deg']
      })};
    }
    return { rotate: '0deg' };
  };

  // Determine body color based on state
  const bodyColor = state === CHARACTER_STATES.ROTTEN ? '#8B4513' : '#FF6B6B';
  const stemColor = state === CHARACTER_STATES.ROTTEN ? '#6B4423' : '#4CAF50';
  const leafColor = state === CHARACTER_STATES.ROTTEN ? '#5A3A1A' : '#66BB6A';

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [
          { translateY: bounceAnim },
          getRotationTransform()
        ]
      }}
      pointerEvents="none"
    >
      <Animated.View style={{ transform: [{ scale: breathingAnim }] }}>
        <Svg width={size} height={size} viewBox="0 0 150 150">
          {/* Tomato body */}
          <Circle cx="75" cy="85" r="45" fill={bodyColor} />
          <Ellipse cx="60" cy="80" rx="20" ry="25" fill={bodyColor} />
          <Ellipse cx="90" cy="80" rx="20" ry="25" fill={bodyColor} />

          {/* Highlight - hidden for rotten state */}
          {state !== CHARACTER_STATES.ROTTEN && (
            <Ellipse cx="60" cy="75" rx="8" ry="12" fill="#FF8787" opacity="0.6" />
          )}

          {/* Stem - wilted for rotten state */}
          {state === CHARACTER_STATES.ROTTEN ? (
            <Path
              d="M 75 35 Q 68 40, 65 45"
              stroke={stemColor}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <Path
              d="M 75 35 Q 70 40, 75 45"
              stroke={stemColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Leaves - wilted and drooping for rotten state */}
          {state === CHARACTER_STATES.ROTTEN ? (
            <>
              <Path
                d="M 75 38 Q 80 40, 82 45 Q 78 42, 72 42"
                fill={leafColor}
              />
              <Path
                d="M 70 38 Q 65 40, 63 45 Q 67 42, 73 42"
                fill={leafColor}
              />
            </>
          ) : (
            <>
              <Path
                d="M 75 38 Q 85 35, 90 40 Q 85 38, 75 40"
                fill={leafColor}
              />
              <Path
                d="M 75 38 Q 65 35, 60 40 Q 65 38, 75 40"
                fill={leafColor}
              />
            </>
          )}

          {/* Face - Eyes */}
          {renderEyes()}

          {/* Mouth */}
          {renderMouth()}

          {/* Rosy cheeks */}
          <Ellipse cx="55" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />
          <Ellipse cx="95" cy="90" rx="6" ry="4" fill="#FFB8C1" opacity="0.5" />

          {/* Glasses (only when focusing) */}
          {renderGlasses()}

          {/* Coffee cup (only when on break) */}
          {renderCoffeeCup()}
        </Svg>
        {/* Animated steam overlay */}
        {renderSteam()}
      </Animated.View>
    </Animated.View>
  );
}
