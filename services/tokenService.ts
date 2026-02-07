/**
 * Token Service
 * 
 * Handles token cost calculations, limit checking, and usage tracking
 * for AI features based on Gemini 2.0 Flash pricing.
 */

import { SubscriptionPlan, TokenUsage } from '../types';

// ============================================
// Pricing Constants
// ============================================

/**
 * Gemini 2.0 Flash pricing (as of 2026)
 * Source: https://ai.google.dev/pricing
 */
export const GEMINI_PRICING = {
  INPUT_PER_MILLION: 0.075,   // $0.075 per 1M input tokens
  OUTPUT_PER_MILLION: 0.30,   // $0.30 per 1M output tokens
} as const;

/**
 * Token limit configuration per plan
 */
export const TOKEN_LIMITS = {
  FREE: 0.13,      // $0.13 lifetime limit for free users
  PRO: 2.00,       // $2.00 per billing period for pro users
  BUFFER: 0.50,    // Allow up to $0.50 over limit (soft blocking)
} as const;

// ============================================
// Cost Calculation Functions
// ============================================

/**
 * Calculate the cost of tokens based on Gemini pricing
 * @param inputTokens Number of input/prompt tokens
 * @param outputTokens Number of output/candidate tokens
 * @returns Total cost in USD
 */
export function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_PRICING.INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * GEMINI_PRICING.OUTPUT_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Get the token limit for a given subscription plan
 * @param plan Subscription plan ('free' or 'pro')
 * @returns Token limit in USD
 */
export function getTokenLimit(plan: SubscriptionPlan): number {
  return plan === 'pro' ? TOKEN_LIMITS.PRO : TOKEN_LIMITS.FREE;
}

/**
 * Get the token limit with buffer for soft blocking
 * @param plan Subscription plan ('free' or 'pro')
 * @returns Token limit with buffer in USD
 */
export function getTokenLimitWithBuffer(plan: SubscriptionPlan): number {
  return getTokenLimit(plan) + TOKEN_LIMITS.BUFFER;
}

// ============================================
// Usage Tracking Functions
// ============================================

/**
 * Get remaining budget for a user
 * @param usage Current token usage (undefined if not initialized)
 * @param plan Subscription plan
 * @returns Remaining budget in USD
 */
export function getRemainingBudget(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): number {
  const limit = getTokenLimit(plan);
  const totalCost = usage?.totalCost || 0;
  return Math.max(0, limit - totalCost);
}

/**
 * Check if user can make an AI request
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns true if user is within limits (including buffer)
 */
export function canMakeRequest(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): boolean {
  const limitWithBuffer = getTokenLimitWithBuffer(plan);
  const totalCost = usage?.totalCost || 0;
  return totalCost < limitWithBuffer;
}

/**
 * Calculate usage percentage
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns Usage percentage (0-100+)
 */
export function getUsagePercent(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): number {
  const limit = getTokenLimit(plan);
  const totalCost = usage?.totalCost || 0;
  return (totalCost / limit) * 100;
}

/**
 * Check if usage is approaching the limit (>80%)
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns true if usage is >80% of limit
 */
export function isApproachingLimit(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): boolean {
  return getUsagePercent(usage, plan) > 80;
}

/**
 * Check if usage has exceeded the hard limit (no buffer)
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns true if usage exceeds hard limit
 */
export function hasExceededLimit(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): boolean {
  const limit = getTokenLimit(plan);
  const totalCost = usage?.totalCost || 0;
  return totalCost >= limit;
}

// ============================================
// Formatting Functions
// ============================================

/**
 * Format currency for display
 * @param amount Amount in USD
 * @returns Formatted string (e.g., "$1.23")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format token count with commas
 * @param tokens Number of tokens
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Get user-friendly usage summary
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns Human-readable summary object
 */
export function getUsageSummary(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): {
  used: string;
  limit: string;
  remaining: string;
  percent: number;
  isApproachingLimit: boolean;
  hasExceededLimit: boolean;
} {
  const limit = getTokenLimit(plan);
  const totalCost = usage?.totalCost || 0;
  const remaining = getRemainingBudget(usage, plan);
  const percent = getUsagePercent(usage, plan);

  return {
    used: formatCurrency(totalCost),
    limit: formatCurrency(limit),
    remaining: formatCurrency(remaining),
    percent: Math.round(percent),
    isApproachingLimit: isApproachingLimit(usage, plan),
    hasExceededLimit: hasExceededLimit(usage, plan),
  };
}

/**
 * Estimate number of remaining conversations
 * Assumes average conversation: 15,000 input + 3,000 output tokens
 * @param usage Current token usage
 * @param plan Subscription plan
 * @returns Estimated number of conversations remaining
 */
export function estimateRemainingConversations(
  usage: TokenUsage | undefined,
  plan: SubscriptionPlan
): number {
  const remaining = getRemainingBudget(usage, plan);
  // Average conversation cost: ~15k input + 3k output tokens
  const avgInputTokens = 15000;
  const avgOutputTokens = 3000;
  const avgConversationCost = calculateTokenCost(avgInputTokens, avgOutputTokens);
  
  return Math.floor(remaining / avgConversationCost);
}
