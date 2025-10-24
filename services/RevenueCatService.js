import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_CONFIG } from '../constants/membership';

class RevenueCatService {
  constructor() {
    this.isConfigured = false;
    this.purchaserInfo = null;
  }

  // Initialize RevenueCat with API keys
  async configure() {
    if (this.isConfigured) {
      return;
    }

    try {
      // Set log level for debugging
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.ERROR);
      }

      // Configure with API key based on platform
      const apiKey = Platform.select({
        ios: REVENUECAT_CONFIG.API_KEY_IOS,
        android: REVENUECAT_CONFIG.API_KEY_ANDROID,
      });

      if (apiKey && apiKey !== 'your_ios_api_key_here' && apiKey !== 'your_android_api_key_here') {
        await Purchases.configure({ apiKey });
        this.isConfigured = true;

        // Get initial purchaser info
        await this.getPurchaserInfo();
      } else {
        console.warn('RevenueCat API keys not configured. Running in mock mode.');
        // For development, we'll run in mock mode
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('Error configuring RevenueCat:', error);
      this.isConfigured = false;
    }
  }

  // Get current purchaser info
  async getPurchaserInfo() {
    if (!this.isConfigured) {
      // Return mock data for development
      return {
        entitlements: {
          active: {},
        },
        activeSubscriptions: [],
      };
    }

    try {
      const purchaserInfo = await Purchases.getCustomerInfo();
      this.purchaserInfo = purchaserInfo;
      return purchaserInfo;
    } catch (error) {
      console.error('Error getting purchaser info:', error);
      return null;
    }
  }

  // Check if user has Plus membership
  async hasPlusAccess() {
    if (!this.isConfigured) {
      // For development, return false (free tier)
      return false;
    }

    const purchaserInfo = await this.getPurchaserInfo();
    if (!purchaserInfo) return false;

    // Check if the Plus entitlement is active
    return purchaserInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== undefined;
  }

  // Get available packages/products
  async getOfferings() {
    if (!this.isConfigured) {
      // Return mock offerings for development
      return {
        current: {
          availablePackages: [
            {
              identifier: 'monthly',
              product: {
                identifier: REVENUECAT_CONFIG.PRODUCT_IDS.MONTHLY,
                priceString: '$4.99',
                price: 4.99,
                title: 'Plus Monthly',
                description: 'Unlock all Plus features',
              },
            },
            {
              identifier: 'yearly',
              product: {
                identifier: REVENUECAT_CONFIG.PRODUCT_IDS.YEARLY,
                priceString: '$39.99',
                price: 39.99,
                title: 'Plus Yearly',
                description: 'Save 33% with yearly subscription',
              },
            },
          ],
        },
      };
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  // Purchase a subscription package
  async purchasePackage(packageToPurchase) {
    if (!this.isConfigured) {
      // Mock purchase for development
      console.log('Mock purchase:', packageToPurchase);
      return {
        customerInfo: {
          entitlements: {
            active: {
              [REVENUECAT_CONFIG.ENTITLEMENT_ID]: {
                isActive: true,
              },
            },
          },
        },
        productIdentifier: packageToPurchase.product.identifier,
      };
    }

    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      this.purchaserInfo = customerInfo;
      return { customerInfo, productIdentifier };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Error purchasing package:', error);
      }
      throw error;
    }
  }

  // Purchase by product ID (monthly or yearly)
  async purchaseProduct(productId) {
    const offerings = await this.getOfferings();
    if (!offerings || !offerings.current) {
      throw new Error('No offerings available');
    }

    const packageToPurchase = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );

    if (!packageToPurchase) {
      throw new Error(`Product ${productId} not found`);
    }

    return this.purchasePackage(packageToPurchase);
  }

  // Restore previous purchases
  async restorePurchases() {
    if (!this.isConfigured) {
      // Mock restore for development
      console.log('Mock restore purchases');
      return {
        entitlements: {
          active: {},
        },
      };
    }

    try {
      const restoredInfo = await Purchases.restorePurchases();
      this.purchaserInfo = restoredInfo;
      return restoredInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  // Set user attributes for analytics
  async setUserAttributes(attributes) {
    if (!this.isConfigured) return;

    try {
      for (const [key, value] of Object.entries(attributes)) {
        await Purchases.setAttributes({ [key]: value });
      }
    } catch (error) {
      console.error('Error setting user attributes:', error);
    }
  }

  // Identify user (for logged-in users)
  async identify(userId) {
    if (!this.isConfigured) return;

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }

  // Log out (reset to anonymous)
  async logOut() {
    if (!this.isConfigured) return;

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

// Export singleton instance
export default new RevenueCatService();