import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import Purchases from 'react-native-purchases';

/**
 * TrackingService - Handles iOS App Tracking Transparency (ATT)
 *
 * Requests ATT permission and passes IDFA to RevenueCat for ad attribution.
 * No-op on Android (ATT is iOS only).
 */
class TrackingService {
  constructor() {
    this.permissionStatus = null;
  }

  /**
   * Request ATT permission (iOS only)
   * Should be called early in app lifecycle, before RevenueCat configure
   * @returns {Promise<boolean>} true if tracking authorized
   */
  async requestPermission() {
    if (Platform.OS !== 'ios') {
      return true; // Android doesn't need ATT
    }

    try {
      const { status } = await requestTrackingPermissionsAsync();
      this.permissionStatus = status;

      if (status === 'granted') {
        // Pass device identifiers to RevenueCat for ad attribution
        await Purchases.collectDeviceIdentifiers();
        console.log('[Tracking] ATT granted, device identifiers collected');
        return true;
      }

      console.log('[Tracking] ATT not granted:', status);
      return false;
    } catch (error) {
      console.error('[Tracking] Error requesting ATT:', error);
      return false;
    }
  }

  /**
   * Check current ATT status without prompting
   * @returns {Promise<string>} 'granted', 'denied', 'restricted', or 'undetermined'
   */
  async getStatus() {
    if (Platform.OS !== 'ios') {
      return 'granted'; // Android doesn't need ATT
    }

    try {
      const { status } = await getTrackingPermissionsAsync();
      this.permissionStatus = status;
      return status;
    } catch (error) {
      console.error('[Tracking] Error getting ATT status:', error);
      return 'undetermined';
    }
  }

  /**
   * Check if tracking is authorized
   * @returns {boolean}
   */
  isAuthorized() {
    return this.permissionStatus === 'granted';
  }
}

export default new TrackingService();
