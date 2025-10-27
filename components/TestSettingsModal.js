import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import StandardModal from './StandardModal';

export default function TestSettingsModal({
  visible,
  onClose,
  showTestPages,
  setShowTestPages,
  test10SecondMode,
  setTest10SecondMode,
}) {
  const { testPlusMode, setTestPlusMode } = useMembership();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Test Settings"
      subtitle="Development mode only"
    >
      <View style={styles.container}>
        <Text style={styles.warningText}>
          These settings are only available in development mode and will not appear in production builds.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Features</Text>

          <View style={styles.sectionContent}>
            {/* Plus User Mode */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setTestPlusMode(!testPlusMode)}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemTitle}>Plus User Mode</Text>
                <Text style={styles.settingItemDescription}>
                  Simulate Plus membership to test premium features
                </Text>
              </View>
              <Switch
                value={testPlusMode}
                onValueChange={setTestPlusMode}
                trackColor={{ false: '#8B8B8B', true: '#9C27B0' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Show Test Pages */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowTestPages(!showTestPages)}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemTitle}>Show Test Pages</Text>
                <Text style={styles.settingItemDescription}>
                  Enable access to test pages like Character Animations
                </Text>
              </View>
              <Switch
                value={showTestPages}
                onValueChange={setShowTestPages}
                trackColor={{ false: '#8B8B8B', true: '#9C27B0' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* 10 Second Timer */}
            <TouchableOpacity
              style={[styles.settingItem, styles.lastItem]}
              onPress={() => setTest10SecondMode(!test10SecondMode)}
              activeOpacity={0.7}
            >
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingItemTitle}>10 Second Timer</Text>
                <Text style={styles.settingItemDescription}>
                  Set timer to 10 seconds for quick testing of completion states
                </Text>
              </View>
              <Switch
                value={test10SecondMode}
                onValueChange={setTest10SecondMode}
                trackColor={{ false: '#8B8B8B', true: '#9C27B0' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B8B8B',
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
    marginHorizontal: 20,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flex: 1,
    marginRight: 15,
  },
  settingItemTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  settingItemDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    lineHeight: 18,
  },
});
