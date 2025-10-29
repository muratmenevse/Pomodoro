import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular } from '@expo-google-fonts/poppins';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';
import ScreenContainer from '../components/ScreenContainer';

export default function CharacterTestScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScreenContainer
      onClose={() => navigation.goBack()}
      title="Character Animations"
      subtitle="Test different animation states"
      scrollable={false}
    >
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

        <View style={styles.characterContainer}>
          <Text style={styles.label}>BREAK</Text>
          <Text style={styles.description}>Relaxed + Coffee</Text>
          <TomatoCharacter size={180} state={CHARACTER_STATES.BREAK} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Swipe left/right to see all states</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginBottom: 30,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
});
