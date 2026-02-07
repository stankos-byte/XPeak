/**
 * Subscription Service
 * 
 * Handles all subscription-related operations including:
 * - Fetching subscription status from Firestore
 * - Checking Pro user status
 * - Canceling subscriptions via Polar API
 * - Getting customer portal URLs
 * - Fetching invoices
 */

import { getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { fbPaths } from './firebasePaths';
import { SubscriptionDocument } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Get the current user's subscription status from Firestore
 * @param uid User ID
 * @returns Subscription document or null if not found
 */
export const getSubscriptionStatus = async (uid: string): Promise<SubscriptionDocument | null> => {
  try {
    const subscriptionRef = fbPaths.subscriptionDoc(uid);
    const snapshot = await getDoc(subscriptionRef);
    
    if (!snapshot.exists()) {
      // Return default free subscription if no document exists
      return {
        status: 'free',
        plan: 'free',
        billingCycle: null,
        polarSubscriptionId: null,
        polarCustomerId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          lastResetAt: null,
          lastUpdatedAt: new Date(),
          isLimitReached: false,
        },
      };
    }
    
    const data = snapshot.data();
    return {
      status: data.status,
      plan: data.plan,
      billingCycle: data.billingCycle,
      polarSubscriptionId: data.polarSubscriptionId,
      polarCustomerId: data.polarCustomerId,
      currentPeriodStart: data.currentPeriodStart?.toDate() || null,
      currentPeriodEnd: data.currentPeriodEnd?.toDate() || null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      tokenUsage: data.tokenUsage ? {
        inputTokens: data.tokenUsage.inputTokens || 0,
        outputTokens: data.tokenUsage.outputTokens || 0,
        totalCost: data.tokenUsage.totalCost || 0,
        lastResetAt: data.tokenUsage.lastResetAt?.toDate() || null,
        lastUpdatedAt: data.tokenUsage.lastUpdatedAt?.toDate() || new Date(),
        isLimitReached: data.tokenUsage.isLimitReached || false,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
};

/**
 * Check if a user has an active Pro subscription
 * @param uid User ID
 * @returns true if user has active Pro subscription
 */
export const isProUser = async (uid: string): Promise<boolean> => {
  try {
    const subscription = await getSubscriptionStatus(uid);
    return subscription.plan === 'pro' && subscription.status === 'active';
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
};

/**
 * Subscribe to real-time subscription updates
 * @param uid User ID
 * @param callback Function to call when subscription changes
 * @returns Unsubscribe function
 */
export const subscribeToSubscription = (
  uid: string,
  callback: (subscription: SubscriptionDocument | null) => void
): Unsubscribe => {
  const subscriptionRef = fbPaths.subscriptionDoc(uid);
  
  return onSnapshot(
    subscriptionRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({
          status: 'free',
          plan: 'free',
          billingCycle: null,
          polarSubscriptionId: null,
          polarCustomerId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tokenUsage: {
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            lastResetAt: null,
            lastUpdatedAt: new Date(),
            isLimitReached: false,
          },
        });
        return;
      }
      
      const data = snapshot.data();
      callback({
        status: data.status,
        plan: data.plan,
        billingCycle: data.billingCycle,
        polarSubscriptionId: data.polarSubscriptionId,
        polarCustomerId: data.polarCustomerId,
        currentPeriodStart: data.currentPeriodStart?.toDate() || null,
        currentPeriodEnd: data.currentPeriodEnd?.toDate() || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        tokenUsage: data.tokenUsage ? {
          inputTokens: data.tokenUsage.inputTokens || 0,
          outputTokens: data.tokenUsage.outputTokens || 0,
          totalCost: data.tokenUsage.totalCost || 0,
          lastResetAt: data.tokenUsage.lastResetAt?.toDate() || null,
          lastUpdatedAt: data.tokenUsage.lastUpdatedAt?.toDate() || new Date(),
          isLimitReached: data.tokenUsage.isLimitReached || false,
        } : undefined,
      });
    },
    (error) => {
      console.error('Error listening to subscription:', error);
      callback(null);
    }
  );
};

/**
 * Cancel a user's subscription via Polar API
 * @param uid User ID
 */
export const cancelSubscription = async (uid: string): Promise<void> => {
  try {
    const functions = getFunctions();
    const cancelPolarSubscription = httpsCallable(functions, 'cancelPolarSubscription');
    
    await cancelPolarSubscription({ uid });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Get the Polar customer portal URL for a user
 * @param uid User ID
 * @returns Customer portal URL
 */
export const getCustomerPortalUrl = async (uid: string): Promise<string> => {
  try {
    const functions = getFunctions();
    const getPolarCustomerPortal = httpsCallable<{ uid: string }, { url: string }>(
      functions,
      'getPolarCustomerPortal'
    );
    
    const result = await getPolarCustomerPortal({ uid });
    return result.data.url;
  } catch (error) {
    console.error('Error getting customer portal URL:', error);
    throw error;
  }
};

/**
 * Get invoices for a user
 * @param uid User ID
 * @returns Array of invoices
 */
export const getInvoices = async (uid: string): Promise<any[]> => {
  try {
    const functions = getFunctions();
    const getPolarInvoices = httpsCallable<{ uid: string }, { invoices: any[] }>(
      functions,
      'getPolarInvoices'
    );
    
    const result = await getPolarInvoices({ uid });
    return result.data.invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};
