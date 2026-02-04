import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Billing Service
 * 
 * Handles Stripe Customer Portal integration for subscription management.
 * Requires:
 * - VITE_STRIPE_PUBLISHABLE_KEY environment variable
 * - Firebase Cloud Function: createStripePortalSession
 */

/**
 * Opens the Stripe Customer Portal for the given user.
 * The portal allows users to:
 * - Update payment methods
 * - View billing history
 * - Manage subscriptions
 * - Download invoices
 * 
 * @param userId - The user's Firebase UID
 * @throws Error if Stripe is not configured or if the Cloud Function fails
 */
export const openBillingPortal = async (userId: string): Promise<void> => {
  // Check if Stripe is configured
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey) {
    throw new Error('Billing portal is not configured yet. Contact support for assistance.');
  }

  try {
    // Get Firebase Functions instance
    const functions = getFunctions();
    
    // Call the Cloud Function to create a Stripe portal session
    const createPortalSession = httpsCallable(functions, 'createStripePortalSession');
    
    // Call the function with the user ID
    const result = await createPortalSession({ userId });
    
    // Extract the portal URL from the response
    const data = result.data as { url: string };
    
    if (!data.url) {
      throw new Error('Failed to generate billing portal URL');
    }
    
    // Redirect to the Stripe Customer Portal
    window.location.href = data.url;
  } catch (error: any) {
    console.error('Error opening billing portal:', error);
    
    // Handle specific error cases
    if (error.code === 'functions/not-found') {
      throw new Error('Billing service is not available. Please contact support.');
    } else if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be signed in to access billing.');
    } else {
      throw new Error(error.message || 'Failed to open billing portal. Please try again.');
    }
  }
};

/**
 * Checks if billing/Stripe is configured for this environment
 * 
 * @returns true if Stripe publishable key is set
 */
export const isBillingConfigured = (): boolean => {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
};

/**
 * Creates a Stripe Checkout session for upgrading to a paid plan
 * 
 * @param userId - The user's Firebase UID
 * @param priceId - The Stripe Price ID to subscribe to
 * @returns Promise that redirects to Stripe Checkout
 */
export const createCheckoutSession = async (userId: string, priceId: string): Promise<void> => {
  if (!isBillingConfigured()) {
    throw new Error('Billing is not configured yet. Contact support for assistance.');
  }

  try {
    const functions = getFunctions();
    const createCheckout = httpsCallable(functions, 'createStripeCheckoutSession');
    
    const result = await createCheckout({ 
      userId, 
      priceId,
      successUrl: `${window.location.origin}/plan?success=true`,
      cancelUrl: `${window.location.origin}/plan?canceled=true`
    });
    
    const data = result.data as { url: string };
    
    if (!data.url) {
      throw new Error('Failed to generate checkout URL');
    }
    
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to start checkout. Please try again.');
  }
};
