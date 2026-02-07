/**
 * Maintenance Service
 * 
 * Manages maintenance mode configuration stored in Firestore.
 * Path: config/maintenance
 */

import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { fbPaths } from './firebasePaths';
import { MaintenanceConfig } from '../types';

/**
 * Default maintenance configuration
 */
const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  isMaintenanceMode: false,
  title: 'Down for Maintenance',
  subtitle: "We're making some improvements. Check back soon!",
  date: '',
  lastUpdatedAt: new Date(),
};

/**
 * Get the current maintenance mode configuration
 * @returns Promise resolving to the maintenance config
 */
export const getMaintenanceConfig = async (): Promise<MaintenanceConfig> => {
  if (!db) {
    console.warn('Firestore not initialized');
    return DEFAULT_MAINTENANCE_CONFIG;
  }

  try {
    const maintenanceRef = fbPaths.maintenanceDoc();
    const docSnap = await getDoc(maintenanceRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Convert Firestore Timestamp to Date if needed
      let lastUpdatedAt = data.lastUpdatedAt;
      if (lastUpdatedAt instanceof Timestamp) {
        lastUpdatedAt = lastUpdatedAt.toDate();
      }

      return {
        isMaintenanceMode: data.isMaintenanceMode ?? false,
        title: data.title || DEFAULT_MAINTENANCE_CONFIG.title,
        subtitle: data.subtitle || DEFAULT_MAINTENANCE_CONFIG.subtitle,
        date: data.date || '',
        lastUpdatedAt,
      };
    }

    // Document doesn't exist, return default
    return DEFAULT_MAINTENANCE_CONFIG;
  } catch (error) {
    console.error('Error fetching maintenance config:', error);
    return DEFAULT_MAINTENANCE_CONFIG;
  }
};

/**
 * Check if maintenance mode is currently active
 * @returns Promise resolving to boolean indicating if maintenance mode is active
 */
export const isMaintenanceMode = async (): Promise<boolean> => {
  const config = await getMaintenanceConfig();
  return config.isMaintenanceMode;
};

/**
 * Subscribe to maintenance mode changes
 * @param callback Function to call when maintenance config changes
 * @returns Unsubscribe function
 */
export const subscribeToMaintenanceMode = (
  callback: (config: MaintenanceConfig) => void
): (() => void) => {
  if (!db) {
    console.warn('Firestore not initialized');
    return () => {};
  }

  const maintenanceRef = fbPaths.maintenanceDoc();

  return onSnapshot(
    maintenanceRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Convert Firestore Timestamp to Date if needed
        let lastUpdatedAt = data.lastUpdatedAt;
        if (lastUpdatedAt instanceof Timestamp) {
          lastUpdatedAt = lastUpdatedAt.toDate();
        }

        const config: MaintenanceConfig = {
          isMaintenanceMode: data.isMaintenanceMode ?? false,
          title: data.title || DEFAULT_MAINTENANCE_CONFIG.title,
          subtitle: data.subtitle || DEFAULT_MAINTENANCE_CONFIG.subtitle,
          date: data.date || '',
          lastUpdatedAt,
        };

        callback(config);
      } else {
        // Document doesn't exist, use default
        callback(DEFAULT_MAINTENANCE_CONFIG);
      }
    },
    (error) => {
      console.error('Error subscribing to maintenance config:', error);
      callback(DEFAULT_MAINTENANCE_CONFIG);
    }
  );
};

/**
 * NOTE: Write operations are disabled in Firestore rules for security.
 * To update maintenance mode, use the Firebase Admin SDK from Cloud Functions
 * or the Firebase Console directly.
 * 
 * Example Cloud Function to update maintenance mode:
 * 
 * ```typescript
 * import * as admin from 'firebase-admin';
 * 
 * export const setMaintenanceMode = functions.https.onCall(async (data, context) => {
 *   // Verify admin user
 *   if (!context.auth || context.auth.token.admin !== true) {
 *     throw new functions.https.HttpsError('permission-denied', 'Admin only');
 *   }
 *   
 *   const { isMaintenanceMode, title, subtitle, date } = data;
 *   
 *   await admin.firestore()
 *     .collection('config')
 *     .doc('maintenance')
 *     .set({
 *       isMaintenanceMode,
 *       title,
 *       subtitle,
 *       date: date || '',
 *       lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
 *     });
 *   
 *   return { success: true };
 * });
 * ```
 */
