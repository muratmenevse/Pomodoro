import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import RevenueCatService from '../services/RevenueCatService';
import { useMembership } from '../contexts/MembershipContext';
import ScreenContainer from '../components/ScreenContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UpgradeScreen({ navigation }) {
  const { upgradeToPlus } = useMembership();
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const offerings = await RevenueCatService.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const productId = selectedPlan === 'yearly'
        ? 'pomodoro_plus_yearly'
        : 'pomodoro_plus_monthly';

      const result = await RevenueCatService.purchaseProduct(productId);

      if (result && result.customerInfo) {
        // Update membership status
        await upgradeToPlus();
        navigation.goBack();
      }
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const restoredInfo = await RevenueCatService.restorePurchases();
      const hasPlus = await RevenueCatService.hasPlusAccess();

      if (hasPlus) {
        await upgradeToPlus();
        navigation.goBack();
      } else {
        alert('No previous purchases found');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Failed to restore purchases');
    } finally {
      setPurchasing(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const plusFeatures = [
    { icon: '➕', title: 'Custom Categories', description: 'Create and manage unlimited custom focus categories' },
    { icon: '📊', title: 'Progress Analytics', description: 'Track your productivity with detailed charts and insights' },
  ];

  return (
    <ScreenContainer
      onClose={() => navigation.goBack()}
      title="Tomito Plus"
      subtitle="Unlock all premium features"
    >
          {/* Features List */}
          <View style={styles.featuresContainer}>
            {plusFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#9C27B0" />
            ) : (
              <>
                {/* Yearly Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'yearly' && styles.planCardSelected
                  ]}
                  onPress={() => setSelectedPlan('yearly')}
                >
                  {selectedPlan === 'yearly' && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>Yearly</Text>
                  <Text style={styles.planPrice}>$9.99</Text>
                  <Text style={styles.planDescription}>$0.83 per month</Text>
                  <Text style={styles.planSavings}>Save 16%</Text>
                </TouchableOpacity>

                {/* Monthly Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'monthly' && styles.planCardSelected
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                >
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>$0.99</Text>
                  <Text style={styles.planDescription}>per month</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Start {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Subscription
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  featuresContainer: {
    marginTop: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 35,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  selectedBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  planSavings: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4CAF50',
    marginTop: 5,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 139, 139, 0.2)',
  },
  purchaseButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  restoreButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  restoreButtonText: {
    color: '#9C27B0',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
