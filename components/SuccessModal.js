import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import StandardModal from './StandardModal';
import TomatoCharacter from './TomatoCharacter';
import { CHARACTER_STATES } from './characterStates';

export default function SuccessModal({ visible, onClose, onBreak }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title=""
      showCloseButton={true}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* Happy Tomato Character */}
        <View style={styles.characterContainer}>
          <TomatoCharacter
            state={CHARACTER_STATES.COMPLETED}
            size={140}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Nice Job!</Text>

        {/* Message */}
        <Text style={styles.message}>You are ready for a break</Text>

        {/* Break Button */}
        <TouchableOpacity
          style={styles.breakButton}
          onPress={onBreak}
          activeOpacity={0.8}
        >
          <Text style={styles.breakButtonText}>Break</Text>
        </TouchableOpacity>
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterContainer: {
    marginBottom: 50,
    marginTop:-90,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 26,
  },
  breakButton: {
    backgroundColor: '#FF7A59',
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  breakButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
