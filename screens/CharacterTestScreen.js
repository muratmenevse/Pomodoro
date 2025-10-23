import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';

export default function CharacterTestScreen({ onClose }) {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Character Animation Test</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.characterContainer}>
          <Text style={styles.label}>IDLE</Text>
          <Text style={styles.description}>Static (no animation)</Text>
          <TomatoCharacter size={180} state={CHARACTER_STATES.IDLE} />
        </View>

        <View style={styles.characterContainer}>
          <Text style={styles.label}>FOCUSING</Text>
          <Text style={styles.description}>Breathing + Glasses</Text>
          <TomatoCharacter size={180} state={CHARACTER_STATES.FOCUSING} />
        </View>

        <View style={styles.characterContainer}>
          <Text style={styles.label}>COMPLETED</Text>
          <Text style={styles.description}>Happy + Bounce</Text>
          <TomatoCharacter size={180} state={CHARACTER_STATES.COMPLETED} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Swipe left/right to see all states</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1ED',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF7A59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  characterContainer: {
    alignItems: 'center',
    marginHorizontal: 30,
    paddingVertical: 40,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 30,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8B8B8B',
  },
});
