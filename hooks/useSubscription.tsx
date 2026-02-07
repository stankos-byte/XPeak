/**
 * useSubscription Hook
 * 
 * React hook for managing subscription state and feature gating.
 * Provides real-time subscription status and utilities for Pro feature access.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToSubscription } from '../services/subscriptionService';
import { SubscriptionDocument } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { canMakeRequest } from '../services/tokenService';

interface UseSubscriptionReturn {
  /** Current subscription document */
  subscription: SubscriptionDocument | null;
  /** Whether the subscription is loading */
  isLoading: boolean;
  /** Whether user has active Pro subscription */
  isPro: boolean;
  /** Whether user has access to AI features (Pro OR free with credits remaining) */
  hasAIAccess: boolean;
  /** Function to require Pro access (shows upgrade prompt if not Pro) */
  requirePro: (feature: string) => boolean;
  /** Function to require AI access (shows appropriate prompt based on plan) */
  requireAIAccess: (feature: string) => boolean;
}

/**
 * Hook to manage subscription state and feature gating
 * 
 * @example
 * ```tsx
 * const { isPro, subscription, requirePro } = useSubscription();
 * 
 * const handleAIFeature = () => {
 *   if (!requirePro('AI Assistant')) return;
 *   // Feature is available, proceed
 * };
 * ```
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Subscribe to real-time subscription updates
    const unsubscribe = subscribeToSubscription(user.uid, (sub) => {
      setSubscription(sub);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  
  // Check if user has AI access: either Pro OR free with credits remaining
  const hasAIAccess = isPro || canMakeRequest(subscription?.tokenUsage, subscription?.plan || 'free');

  /**
   * Check if user has Pro access and show upgrade prompt if not
   * @param feature Name of the feature requiring Pro (for toast message)
   * @returns true if user has Pro access, false otherwise
   */
  const requirePro = (feature: string): boolean => {
    if (isPro) {
      return true;
    }

    // Show upgrade prompt
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-surface border-2 border-primary/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] pointer-events-auto`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  Pro Feature: {feature}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Upgrade to Pro to unlock {feature} and other premium features.
                </p>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/plan');
                    }}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-lg border border-secondary/20 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-secondary/40 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => toast.dismiss(t.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-center',
      }
    );

    return false;
  };

  /**
   * Check if user has AI access and show appropriate prompt if not
   * @param feature Name of the AI feature (for toast message)
   * @returns true if user has AI access, false otherwise
   */
  const requireAIAccess = (feature: string): boolean => {
    if (hasAIAccess) {
      return true;
    }

    // Determine if user is free plan or pro (who exhausted credits)
    const isFreeUser = subscription?.plan === 'free' || !subscription?.plan;
    const hasExhaustedCredits = subscription?.tokenUsage && subscription.tokenUsage.totalCost > 0;

    // Show appropriate message based on user state
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-surface border-2 border-primary/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] pointer-events-auto`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {isFreeUser && hasExhaustedCredits ? 'Free Credits Exhausted' : 'AI Feature: ' + feature}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {isFreeUser && hasExhaustedCredits
                    ? `You've used your $0.13 in free credits. Upgrade to Pro for $2.00/month in AI credits.`
                    : `This feature requires AI credits. Upgrade to Pro to unlock ${feature} and other AI features.`}
                </p>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/plan');
                    }}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-lg border border-secondary/20 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-secondary/40 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => toast.dismiss(t.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-center',
      }
    );

    return false;
  };

  return {
    subscription,
    isLoading,
    isPro,
    hasAIAccess,
    requirePro,
    requireAIAccess,
  };
};
