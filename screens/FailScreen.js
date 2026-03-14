import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import ScreenContainer from '../components/ScreenContainer';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';

const TOMATO_SIZE = Math.max(110, Math.min(Dimensions.get('window').width * 0.4, 260));

export default function FailScreen({ navigation, route }) {
  const { test10SecondMode = false } = route.params || {};

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleMainMenu = () => {
    navigation.popToTop();
  };

  return (
    <ScreenContainer
      title=""
      showCloseButton={false}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* Rotten Tomato Character */}
        <View style={styles.characterContainer}>
          <TomatoCharacter
            state={CHARACTER_STATES.ROTTEN}
            size={TOMATO_SIZE}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Oh no!</Text>

        {/* Message */}
        <Text style={styles.message}>You could not finish your pomodoro and got one Rotten Tomito.</Text>

        {/* Main Menu Button */}
        <TouchableOpacity
          style={styles.mainMenuButton}
          onPress={handleMainMenu}
          activeOpacity={0.8}
        >
          <Text style={styles.mainMenuButtonText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
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
  mainMenuButton: {
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
  mainMenuButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
