import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Billing Service
 * 
 * Handles Polar checkout integration for subscription management.
 * Uses Polar.sh for payment processing.
 */

/**
 * Polar product IDs
 */
export const POLAR_PRODUCTS = {
  MONTHLY: 'fa779526-2149-490e-ad0b-0b087525d8a0',
  YEARLY: '42ab603f-1f3b-4592-931b-b25f0d615437',
} as const;

/**
 * Checks if billing is configured for this environment
 * 
 * @returns true if Polar is configured
 */
export const isBillingConfigured = (): boolean => {
  // Polar is always configured since we handle it via Firebase Functions
  return true;
};

/**
 * Creates a Polar Checkout session for upgrading to a paid plan
 * 
 * @param productId - The Polar Product ID to subscribe to (use POLAR_PRODUCTS constants)
 * @returns Promise that redirects to Polar Checkout
 */
export const createCheckoutSession = async (productId: string): Promise<void> => {
  try {
    const functions = getFunctions();
    const createCheckout = httpsCallable(functions, 'createPolarCheckout');
    
    const result = await createCheckout({ 
      productId,
      successUrl: `${window.location.origin}/plan?success=true`,
      cancelUrl: `${window.location.origin}/plan?canceled=true`
    });
    
    const data = result.data as { url: string; success: boolean };
    
    if (!data.success || !data.url) {
      throw new Error('Failed to generate checkout URL');
    }
    
    // Redirect to Polar Checkout
    window.location.href = data.url;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Handle specific error cases
    if (error.code === 'functions/not-found') {
      throw new Error('Billing service is not available. Please contact support.');
    } else if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be signed in to checkout.');
    } else {
      throw new Error(error.message || 'Failed to start checkout. Please try again.');
    }
  }
};
