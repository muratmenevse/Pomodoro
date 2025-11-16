import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import MembershipBadge from '../components/MembershipBadge';
import RevenueCatService from '../services/RevenueCatService';
import ScreenContainer from '../components/ScreenContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEK_START_DAY_KEY = '@week_start_day';

export default function SettingsScreen({ navigation }) {
  const {
    isPlusMember,
    membershipTier,
    restorePurchases,
  } = useMembership();

  const { openConfirmation } = useConfirmation();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState('Sunday');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Load week start day preference
  useEffect(() => {
    loadWeekStartDay();
  }, []);

  const loadWeekStartDay = async () => {
    try {
      const saved = await AsyncStorage.getItem(WEEK_START_DAY_KEY);
      if (saved) {
        setWeekStartDay(saved);
      }
    } catch (error) {
      console.log('Error loading week start day:', error);
    }
  };

  const handleWeekStartDayChange = async (day) => {
    try {
      await AsyncStorage.setItem(WEEK_START_DAY_KEY, day);
      setWeekStartDay(day);
    } catch (error) {
      console.log('Error saving week start day:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        alert('No previous purchases found');
      }
    } catch (error) {
      alert('Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  const handleUpgrade = () => {
    navigation.navigate('Upgrade');
  };

  const settingSections = [
    {
      title: 'Membership',
      items: [
        {
          id: 'membership_status',
          title: 'Plan',
          value: isPlusMember ? 'Plus' : 'Free',
          showBadge: isPlusMember,
        },
        {
          id: 'restore_purchases',
          title: 'Restore Purchases',
          onPress: handleRestorePurchases,
          isLoading: restoring,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'sound',
          title: 'Sound Effects',
          hasSwitch: true,
          value: soundEnabled,
          onValueChange: setSoundEnabled,
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          hasSwitch: true,
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'DATE',
      items: [
        {
          id: 'week_start_day',
          title: 'Week Start Day',
          value: weekStartDay,
          onPress: async () => {
            // Show selection options
            const confirmed = await openConfirmation({
              title: 'Week Start Day',
              message: 'Choose the first day of the week',
              confirmText: 'Sunday',
              cancelText: 'Monday',
              confirmStyle: 'default',
            });

            // Sunday = confirmed (true), Monday = not confirmed (false)
            handleWeekStartDayChange(confirmed ? 'Sunday' : 'Monday');
          },
          showArrow: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'Version',
          value: '1.0.0',
        },
      ],
    },
  ];

  return (
    <ScreenContainer
      onClose={() => navigation.goBack()}
      title="Settings"
    >
        {/* Plus Features Info */}
        {!isPlusMember && (
          <View style={styles.plusInfoContainer}>
            <Text style={styles.plusInfoTitle}>Unlock Plus Features</Text>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Plus</Text>
            </TouchableOpacity>
          </View>
        )}

        {settingSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress || item.isLoading}
                  activeOpacity={item.onPress ? 0.7 : 1}
                >
                  <View style={styles.settingItemLeft}>
                    <Text style={styles.settingItemTitle}>{item.title}</Text>
                    {item.showBadge && <MembershipBadge style={styles.badge} />}
                  </View>

                  <View style={styles.settingItemRight}>
                    {item.hasSwitch ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#8B8B8B', true: '#9C27B0' }}
                        thumbColor="#FFFFFF"
                      />
                    ) : item.value ? (
                      <Text style={styles.settingItemValue}>{item.value}</Text>
                    ) : null}

                    {item.actionText && (
                      <View style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>{item.actionText}</Text>
                      </View>
                    )}

                    {item.showArrow && (
                      <Text style={styles.arrowText}>›</Text>
                    )}

                    {item.isLoading && (
                      <Text style={styles.loadingText}>Loading...</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    marginVertical: 15,
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 139, 139, 0.1)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
  badge: {
    marginLeft: 10,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginRight: 5,
  },
  actionButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  arrowText: {
    fontSize: 24,
    color: '#8B8B8B',
    marginLeft: 5,
  },
  plusInfoContainer: {
    marginTop: 15,
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  plusInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  plusInfoDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});