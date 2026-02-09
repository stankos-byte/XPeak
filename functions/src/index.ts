/**
 * Firebase Cloud Functions v2 for XPeak
 *
 * This file contains all Cloud Functions for the XPeak gamification platform.
 *
 * 📋 PROFESSIONAL LOGGING PROTOCOL
 * ================================
 * All functions follow a consistent logging pattern:
 * 🚀 - Function start / Begin execution
 * 🔐 - Authentication verification
 * 📥 - Input validation / Data received
 * 🔄 - Processing steps / State changes
 * 🤖 - AI operations / Model interactions
 * 📨 - API requests / External calls
 * 💾 - Database operations (Firestore)
 * ✅ - Success / Completion
 * ⚠️ - Warnings / Non-critical issues
 * ❌ - Errors / Failures
 * ⏱️ - Timing / Performance metrics
 * 📤 - Response / Output
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import * as logger from "firebase-functions/logger";
import {GoogleGenAI, Type} from "@google/genai";
import {Polar} from "@polar-sh/sdk";
import {Webhook} from "svix";

// Define secrets
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const polarAccessToken = defineSecret("POLAR_ACCESS_TOKEN");
const polarWebhookSecret = defineSecret("POLAR_WEBHOOK_SECRET");

// Initialize Firebase Admin
logger.info("🔧 [INIT] Initializing Firebase Admin SDK...");
initializeApp();
logger.info("✅ [INIT] Firebase Admin SDK initialized successfully");

// Get Firestore instance
logger.info("💾 [INIT] Connecting to Firestore database...");
const db = getFirestore();
logger.info("✅ [INIT] Firestore connection established");

// Set global options for all functions
// For cost control, limit the maximum number of containers
logger.info("⚙️ [INIT] Setting global function options (maxInstances: 10)");
setGlobalOptions({maxInstances: 10});
logger.info("✅ [INIT] Cloud Functions initialization complete");

// Gemini model to use
// Using gemini-2.5-flash - latest, fastest model with free tier access
const GEMINI_MODEL = "gemini-2.5-flash";

// ==========================================
// Rate Limiting (Firestore-based for reliability across instances)
// ==========================================

// Rate limit configuration
const RATE_LIMITS = {
  PER_MINUTE: 10, // Maximum requests per minute
  PER_DAY: 100, // Maximum requests per day
};

/**
 * Firestore-based rate limiting that persists across cold starts and function instances
 * @param uid User ID
 * @returns Object indicating if request is allowed and error message if not
 */
async function checkRateLimit(uid: string): Promise<{ allowed: boolean; error?: string }> {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const rateLimitRef = db.collection("rateLimits").doc(uid);

  try {
    // Use transaction to prevent race conditions
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const data = doc.exists ? doc.data() : null;

      // Get current minute requests (filter out old timestamps)
      const minuteRequests = (data?.minuteRequests || [])
        .filter((timestamp: number) => timestamp > oneMinuteAgo);

      // Check per-minute rate limit
      if (minuteRequests.length >= RATE_LIMITS.PER_MINUTE) {
        return {
          allowed: false,
          error: `Rate limit exceeded. Maximum ${RATE_LIMITS.PER_MINUTE} requests per minute. Please try again later.`,
        };
      }

      // Check daily quota
      const dailyResetAt = data?.dailyResetAt?.toMillis() || 0;
      let dailyUsed = data?.dailyUsed || 0;

      // Reset daily quota if expired
      if (now > dailyResetAt) {
        dailyUsed = 0;
      }

      // Check if daily limit exceeded
      if (dailyUsed >= RATE_LIMITS.PER_DAY) {
        const resetDate = new Date(dailyResetAt);
        const hoursUntilReset = Math.ceil((dailyResetAt - now) / (1000 * 60 * 60));
        return {
          allowed: false,
          error: `Daily quota exceeded. Maximum ${RATE_LIMITS.PER_DAY} AI requests per day. Resets in ${hoursUntilReset} hours.`,
        };
      }

      // Update rate limit data
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      
      transaction.set(rateLimitRef, {
        minuteRequests: [...minuteRequests, now],
        dailyUsed: dailyUsed + 1,
        dailyResetAt: now > dailyResetAt ? Timestamp.fromDate(tomorrow) : (data?.dailyResetAt || Timestamp.fromDate(tomorrow)),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {allowed: true};
    });

    return result;
  } catch (error) {
    logger.error("❌ [checkRateLimit] Error checking rate limit:", error);
    // Fail-open with a warning - allow the request but log the error
    // In production, you may want to fail-closed for security
    logger.warn("⚠️ [checkRateLimit] Allowing request due to rate limit check failure (fail-open)");
    return {allowed: true};
  }
}

// ==========================================
// Token Usage Tracking
// ==========================================

/**
 * Gemini 2.0 Flash pricing constants
 */
const GEMINI_PRICING = {
  INPUT_PER_MILLION: 0.075, // $0.075 per 1M input tokens
  OUTPUT_PER_MILLION: 0.30, // $0.30 per 1M output tokens
};

/**
 * Token limit configuration per plan
 */
const TOKEN_LIMITS = {
  FREE: 0.13, // $0.13 lifetime limit for free users
  PRO: 2.00, // $2.00 per billing period for pro users
  BUFFER: 0.50, // Allow up to $0.50 over limit (soft blocking)
};

/**
 * Calculate the cost of tokens based on Gemini pricing
 */
function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_PRICING.INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * GEMINI_PRICING.OUTPUT_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Check if a user has exceeded token usage limits
 * @param uid User ID
 * @returns Object indicating if request is allowed and error message if not
 */
async function checkTokenLimit(uid: string): Promise<{
  allowed: boolean;
  error?: string;
  remainingBudget?: number;
}> {
  try {
    // Fetch user's subscription document
    const subscriptionRef = db.collection("users").doc(uid).collection("subscription").doc("current");
    const subscriptionDoc = await subscriptionRef.get();

    // Default to free plan if no subscription exists
    let plan = "free";
    let status = "free";
    let tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
      lastResetAt: any;
      lastUpdatedAt: Date;
      isLimitReached: boolean;
    } = {
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      lastResetAt: null,
      lastUpdatedAt: new Date(),
      isLimitReached: false,
    };
    let currentPeriodEnd: any = null;

    if (subscriptionDoc.exists) {
      const data = subscriptionDoc.data();
      plan = data?.plan || "free";
      status = data?.status || "free";
      currentPeriodEnd = data?.currentPeriodEnd;

      // Initialize tokenUsage if it doesn't exist
      if (data?.tokenUsage) {
        tokenUsage = {
          inputTokens: data.tokenUsage.inputTokens || 0,
          outputTokens: data.tokenUsage.outputTokens || 0,
          totalCost: data.tokenUsage.totalCost || 0,
          lastResetAt: data.tokenUsage.lastResetAt,
          lastUpdatedAt: data.tokenUsage.lastUpdatedAt?.toDate() || new Date(),
          isLimitReached: data.tokenUsage.isLimitReached || false,
        };
      }
    }

    // Check if pro user's billing period has reset
    const isPro = plan === "pro" && status === "active";
    if (isPro && currentPeriodEnd) {
      const periodEndDate = currentPeriodEnd.toDate();
      const now = new Date();

      if (now > periodEndDate) {
        // Billing period has ended, reset token usage
        logger.info("🔄 [checkTokenLimit] Pro user billing period ended, resetting token usage", {
          uid,
          periodEndDate: periodEndDate.toISOString(),
          currentDate: now.toISOString(),
        });

        tokenUsage = {
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          lastResetAt: now,
          lastUpdatedAt: now,
          isLimitReached: false,
        };

        // Update in database
        await subscriptionRef.update({
          tokenUsage: {
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            lastResetAt: FieldValue.serverTimestamp(),
            lastUpdatedAt: FieldValue.serverTimestamp(),
            isLimitReached: false,
          },
        });
      }
    }

    // Get token limit based on plan
    const limit = isPro ? TOKEN_LIMITS.PRO : TOKEN_LIMITS.FREE;
    const limitWithBuffer = limit + TOKEN_LIMITS.BUFFER;

    // Check if user has exceeded limit (including buffer)
    if (tokenUsage.totalCost >= limitWithBuffer) {
      const resetMessage = isPro ?
        "Your token limit will reset at the end of your billing period." :
        "Upgrade to Pro for a higher token limit.";

      return {
        allowed: false,
        error: `Token limit exceeded. You have used $${tokenUsage.totalCost.toFixed(4)} ` +
          `of your $${limit.toFixed(2)} limit. ${resetMessage}`,
        remainingBudget: 0,
      };
    }

    const remainingBudget = limit - tokenUsage.totalCost;

    logger.info("✅ [checkTokenLimit] Token limit check passed", {
      uid,
      plan,
      isPro,
      totalCost: tokenUsage.totalCost,
      limit,
      remainingBudget,
    });

    return {
      allowed: true,
      remainingBudget,
    };
  } catch (error) {
    logger.error("❌ [checkTokenLimit] Error checking token limit:", error);
    // Allow request to proceed if check fails (fail-open for better UX)
    return {allowed: true};
  }
}

/**
 * Track token usage after an API call
 * Uses Firestore transaction to prevent race conditions during concurrent requests
 * @param uid User ID
 * @param inputTokens Number of input tokens used
 * @param outputTokens Number of output tokens used
 */
async function trackTokenUsage(uid: string, inputTokens: number, outputTokens: number): Promise<void> {
  try {
    // Calculate cost
    const cost = calculateTokenCost(inputTokens, outputTokens);

    logger.info("💰 [trackTokenUsage] Tracking token usage", {
      uid,
      inputTokens,
      outputTokens,
      cost: `$${cost.toFixed(6)}`,
    });

    const subscriptionRef = db.collection("users").doc(uid).collection("subscription").doc("current");

    // Use transaction to prevent race conditions
    await db.runTransaction(async (transaction) => {
      const subscriptionDoc = await transaction.get(subscriptionRef);

      let plan = "free";
      let status = "free";
      let currentTokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
      };

      if (subscriptionDoc.exists) {
        const data = subscriptionDoc.data();
        plan = data?.plan || "free";
        status = data?.status || "free";

        if (data?.tokenUsage) {
          currentTokenUsage = {
            inputTokens: data.tokenUsage.inputTokens || 0,
            outputTokens: data.tokenUsage.outputTokens || 0,
            totalCost: data.tokenUsage.totalCost || 0,
          };
        }
      }

      // Calculate new totals
      const newInputTokens = currentTokenUsage.inputTokens + inputTokens;
      const newOutputTokens = currentTokenUsage.outputTokens + outputTokens;
      const newTotalCost = currentTokenUsage.totalCost + cost;

      // Determine if limit is reached
      const isPro = plan === "pro" && status === "active";
      const limit = isPro ? TOKEN_LIMITS.PRO : TOKEN_LIMITS.FREE;
      const isLimitReached = newTotalCost >= limit;

      // Update subscription document atomically
      transaction.set(subscriptionRef, {
        tokenUsage: {
          inputTokens: newInputTokens,
          outputTokens: newOutputTokens,
          totalCost: newTotalCost,
          lastResetAt: currentTokenUsage.inputTokens === 0 ?
            FieldValue.serverTimestamp() :
            subscriptionDoc.data()?.tokenUsage?.lastResetAt || null,
        lastUpdatedAt: FieldValue.serverTimestamp(),
        isLimitReached,
      },
      }, {merge: true});

      logger.info("✅ [trackTokenUsage] Token usage updated successfully", {
        uid,
        newTotalCost: `$${newTotalCost.toFixed(6)}`,
        limit: `$${limit.toFixed(2)}`,
        isLimitReached,
        percentUsed: `${((newTotalCost / limit) * 100).toFixed(1)}%`,
      });
    });
  } catch (error) {
    logger.error("❌ [trackTokenUsage] Error tracking token usage:", error);
    // Don't throw - we don't want to fail the user's request if tracking fails
  }
}

// ==========================================
// Types and Enums (matching Firestore schema)
// ==========================================

enum SkillCategory {
  PHYSICAL = "Physical",
  MENTAL = "Mental",
  PROFESSIONAL = "Professional",
  SOCIAL = "Social",
  CREATIVE = "Creative",
  MISC = "Default",
}

enum AuthProvider {
  GOOGLE = "google",
  EMAIL = "email",
  APPLE = "apple",
}

enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

type WidgetId = "identity" | "skillMatrix" | "evolution" | "tasks" | "calendar" | "friends";

interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
}

// Simplified skill data - no redundant category field since the key IS the category
interface SkillData {
  xp: number;
  level: number;
}

interface SkillsMap {
  [key: string]: SkillData;
}

interface NotificationSettings {
  deepWorkMode: boolean;
  contractUpdates: boolean;
  levelUps: boolean;
}

interface UserSettings {
  theme: Theme;
  notifications: NotificationSettings;
}

interface ProfileLayout {
  widgets: WidgetConfig[];
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Creates the default skills map with all categories at level 0, 0 XP
 * Note: Uses simplified format without redundant category field (key IS the category)
 */
function createDefaultSkills(): SkillsMap {
  logger.info("🔄 [createDefaultSkills] Creating default skills map for new user");

  const skills: SkillsMap = {};
  const categories = Object.values(SkillCategory);

  logger.info(`📝 [createDefaultSkills] Initializing ${categories.length} skill categories`, {
    categories: categories,
  });

  categories.forEach((category) => {
    skills[category] = {
      xp: 0,
      level: 0,
    };
    logger.info(`  ➕ [createDefaultSkills] Added category: ${category} (XP: 0, Level: 0)`);
  });

  logger.info("✅ [createDefaultSkills] Default skills map created successfully", {
    totalCategories: Object.keys(skills).length,
  });

  return skills;
}

/**
 * Creates the default profile layout with all widgets enabled
 */
function createDefaultLayout(): ProfileLayout {
  logger.info("🔄 [createDefaultLayout] Creating default profile layout");

  const widgetIds: WidgetId[] = ["identity", "skillMatrix", "evolution", "tasks", "calendar", "friends"];

  logger.info(`📝 [createDefaultLayout] Configuring ${widgetIds.length} widgets`, {
    widgetIds: widgetIds,
  });

  const layout = {
    widgets: widgetIds.map((id, index) => {
      const widget = {
        id,
        enabled: true,
        order: index,
      };
      logger.info(`  ➕ [createDefaultLayout] Widget configured: ${id} (order: ${index}, enabled: true)`);
      return widget;
    }),
  };

  logger.info("✅ [createDefaultLayout] Default layout created successfully", {
    totalWidgets: layout.widgets.length,
  });

  return layout;
}

/**
 * Creates the default user settings
 */
function createDefaultSettings(): UserSettings {
  logger.info("🔄 [createDefaultSettings] Creating default user settings");

  const settings = {
    theme: Theme.DARK,
    notifications: {
      deepWorkMode: false,
      contractUpdates: true,
      levelUps: true,
    },
  };

  logger.info("✅ [createDefaultSettings] Default settings created", {
    theme: settings.theme,
    notifications: settings.notifications,
  });

  return settings;
}

/**
 * Determines the auth provider from the provider data
 */
function getAuthProvider(providerData: Array<{ providerId: string }> | undefined): AuthProvider {
  logger.info("🔐 [getAuthProvider] Determining authentication provider", {
    hasProviderData: !!providerData,
    providerCount: providerData?.length || 0,
  });

  if (!providerData || providerData.length === 0) {
    logger.info("⚠️ [getAuthProvider] No provider data found, defaulting to EMAIL auth");
    return AuthProvider.EMAIL;
  }

  const providerId = providerData[0].providerId;
  logger.info(`🔍 [getAuthProvider] Analyzing provider ID: ${providerId}`);

  if (providerId === "google.com") {
    logger.info("✅ [getAuthProvider] Detected GOOGLE authentication");
    return AuthProvider.GOOGLE;
  } else if (providerId === "apple.com") {
    logger.info("✅ [getAuthProvider] Detected APPLE authentication");
    return AuthProvider.APPLE;
  }

  logger.info("✅ [getAuthProvider] Defaulting to EMAIL authentication");
  return AuthProvider.EMAIL;
}

/**
 * Extracts a display name from email if no display name is provided
 */
function getDisplayName(displayName: string | undefined, email: string | undefined): string {
  logger.info("👤 [getDisplayName] Resolving display name", {
    hasDisplayName: !!displayName,
    hasEmail: !!email,
  });

  if (displayName) {
    logger.info(`✅ [getDisplayName] Using provided display name: "${displayName}"`);
    return displayName;
  }

  if (email) {
    // Extract the part before @ as the display name
    const extractedName = email.split("@")[0];
    logger.info(`🔄 [getDisplayName] Extracted name from email: "${extractedName}" (from ${email})`);
    return extractedName;
  }

  logger.info("⚠️ [getDisplayName] No name available, using default: 'Operative'");
  return "Operative";
}

/**
 * Generate a nickname for the user
 * Priority: displayName > email prefix > generated default
 */
function generateNickname(displayName: string | undefined, email: string | undefined): string {
  logger.info("🏷️ [generateNickname] Generating nickname", {
    hasDisplayName: !!displayName,
    hasEmail: !!email,
  });

  // 1. Use displayName if available (from OAuth)
  if (displayName && displayName.trim()) {
    logger.info(`✅ [generateNickname] Using display name as nickname: "${displayName}"`);
    return displayName.trim();
  }

  // 2. Use email prefix if available
  if (email) {
    const emailPrefix = email.split("@")[0];
    if (emailPrefix) {
      logger.info(`🔄 [generateNickname] Using email prefix as nickname: "${emailPrefix}"`);
      return emailPrefix;
    }
  }

  // 3. Generate default with random digits
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const generatedNickname = `Agent-${randomDigits}`;
  logger.info(`🎲 [generateNickname] Generated random nickname: "${generatedNickname}"`);
  return generatedNickname;
}

// ==========================================
// Cloud Functions
// ==========================================

/**
 * beforeUserCreated - Triggered before a new user is created
 *
 * This function runs synchronously during user creation and can:
 * - Validate user data
 * - Set custom claims
 * - Block user creation if needed
 *
 * We use this to create the initial Firestore document.
 * Note: beforeUserCreated runs before the user is fully created,
 * so we need to be careful about what we access.
 */
export const onUserCreate = beforeUserCreated(async (event) => {
  const startTime = Date.now();
  const functionName = "onUserCreate";

  logger.info("═".repeat(60));
  logger.info(`🚀 [${functionName}] BEGIN EXECUTION - New user creation triggered`);
  logger.info("═".repeat(60));

  logger.info(`📥 [${functionName}] Received event data`, {
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: new Date().toISOString(),
  });

  const user = event.data;

  // Guard check - user should always exist, but TypeScript requires this
  if (!user) {
    logger.error(`❌ [${functionName}] CRITICAL: User data is undefined in beforeUserCreated event`);
    logger.error(`❌ [${functionName}] Event payload was empty - cannot proceed`);
    logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (FAILED)`);
    return;
  }

  logger.info(`👤 [${functionName}] User data received`, {
    uid: user.uid,
    email: user.email || "(no email)",
    displayName: user.displayName || "(no display name)",
    photoURL: user.photoURL ? "(provided)" : "(none)",
    emailVerified: user.emailVerified,
    providerCount: user.providerData?.length || 0,
  });

  try {
    // Step 1: Determine auth provider
    logger.info(`🔄 [${functionName}] Step 1/5: Determining authentication provider...`);
    const authProvider = getAuthProvider(user.providerData);
    logger.info(`✅ [${functionName}] Step 1/5 complete: Auth provider = ${authProvider}`);

    // Step 2: Get display name and nickname
    logger.info(`🔄 [${functionName}] Step 2/5: Resolving display name and nickname...`);
    const displayName = getDisplayName(user.displayName, user.email);
    const nickname = generateNickname(user.displayName, user.email);
    logger.info(`✅ [${functionName}] Step 2/5 complete: Display name = "${displayName}", Nickname = "${nickname}"`);

    // Step 3: Create default data structures
    logger.info(`🔄 [${functionName}] Step 3/5: Creating default data structures...`);

    logger.info(`  📝 [${functionName}] Creating default skills...`);
    const skills = createDefaultSkills();

    logger.info(`  📝 [${functionName}] Creating default layout...`);
    const layout = createDefaultLayout();

    logger.info(`  📝 [${functionName}] Creating default settings...`);
    const settings = createDefaultSettings();

    logger.info(`✅ [${functionName}] Step 3/5 complete: All default structures created`);

    // Step 4: Assemble the user document
    logger.info(`🔄 [${functionName}] Step 4/5: Assembling user document...`);
    const userDocument = {
      uid: user.uid,
      email: user.email || "",
      name: displayName,
      nickname: nickname,
      photoURL: user.photoURL || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      authProvider: authProvider,
      totalXP: 0,
      level: 0,
      identity: "",
      skills: skills,
      // goals and templates are now in subcollections for scalability
      layout: layout,
      settings: settings,
    };

    logger.info(`✅ [${functionName}] Step 4/5 complete: User document assembled`, {
      documentFields: Object.keys(userDocument),
      skillCategories: Object.keys(skills).length,
      widgetCount: layout.widgets.length,
    });

    // Step 5: Write to Firestore
    logger.info(`🔄 [${functionName}] Step 5/5: Writing to Firestore...`);
    logger.info(`💾 [${functionName}] Target path: users/${user.uid}`);

    const writeStartTime = Date.now();
    await db.collection("users").doc(user.uid).set(userDocument);
    const writeTime = Date.now() - writeStartTime;

    logger.info(`✅ [${functionName}] Step 5/5 complete: Firestore write successful`, {
      writeTimeMs: writeTime,
      documentPath: `users/${user.uid}`,
    });

    // Step 6: Initialize free subscription with token usage
    logger.info(`🔄 [${functionName}] Step 6: Initializing free subscription with token usage...`);

    const subscriptionRef = db.collection("users").doc(user.uid).collection("subscription").doc("current");
    await subscriptionRef.set({
      status: "free",
      plan: "free",
      billingCycle: null,
      polarSubscriptionId: null,
      polarCustomerId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        lastResetAt: null, // Free users never reset
        lastUpdatedAt: FieldValue.serverTimestamp(),
        isLimitReached: false,
      },
    });

    logger.info(`✅ [${functionName}] Step 6 complete: Subscription initialized`, {
      documentPath: `users/${user.uid}/subscription/current`,
      plan: "free",
      tokenLimit: "$0.13 (lifetime)",
    });

    // Success summary
    const totalTime = Date.now() - startTime;
    logger.info("─".repeat(60));
    logger.info(`✅ [${functionName}] USER CREATION SUCCESSFUL`);
    logger.info("─".repeat(60));
    logger.info(`📤 [${functionName}] Summary:`, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      authProvider: authProvider,
      firestoreWriteTimeMs: writeTime,
      totalExecutionTimeMs: totalTime,
    });
    logger.info(`⏱️ [${functionName}] Total execution time: ${totalTime}ms`);
    logger.info("═".repeat(60));

    // Return nothing to allow the user creation to proceed
    return;
  } catch (error) {
    const totalTime = Date.now() - startTime;

    logger.error("─".repeat(60));
    logger.error(`❌ [${functionName}] USER CREATION FAILED`);
    logger.error("─".repeat(60));
    logger.error(`❌ [${functionName}] Error details:`, {
      uid: user.uid,
      errorName: (error as Error).name,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
    });
    logger.error(`⏱️ [${functionName}] Execution time before failure: ${totalTime}ms`);
    logger.warn(`⚠️ [${functionName}] User creation will proceed without Firestore document`);
    logger.warn(`⚠️ [${functionName}] Document will need to be created on first login`);
    logger.info("═".repeat(60));

    // Don't throw - allow user creation to proceed even if Firestore fails
    // The document can be created later on first login
    return;
  }
});

// ==========================================
// Webhook Helper Functions
// ==========================================

/**
 * Check if a webhook event has already been processed (idempotency)
 * Uses Firestore create() to atomically prevent duplicate processing
 * @param userId User ID
 * @param eventId Unique event ID from webhook
 * @returns true if this is a new event, false if already processed
 */
async function checkEventIdempotency(userId: string, eventId: string): Promise<boolean> {
  const functionName = "checkEventIdempotency";

  logger.info(`🔍 [${functionName}] Checking idempotency for event: ${eventId}`);

  const eventRef = db.collection("users").doc(userId).collection("webhookEvents").doc(eventId);

  try {
    // Use create() which atomically fails if document already exists
    // This prevents race conditions between concurrent webhook calls
    await eventRef.create({
      eventId,
      processed: false,
      receivedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`✅ [${functionName}] Event is new and marked as processing: ${eventId}`);
    return true; // OK to process
  } catch (error: any) {
    // If error code is 'already-exists', this is a duplicate
    if (error.code === 6 || error.message?.includes("already exists")) {
      logger.warn(`⚠️ [${functionName}] Duplicate event detected: ${eventId}`);
      return false; // Already processed
    }

    // For other errors, log and rethrow
    logger.error(`❌ [${functionName}] Error checking idempotency:`, error);
    throw error;
  }
}

/**
 * Create a notification for the user in Firestore
 * @param userId User ID
 * @param type Notification type
 * @param title Notification title
 * @param message Notification message
 * @param severity Notification severity level
 * @param metadata Optional metadata object
 */
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  severity: string,
  metadata?: any
) {
  const functionName = "createNotification";

  logger.info(`📬 [${functionName}] Creating notification for user ${userId}`, {
    type,
    severity,
    title,
  });

  const notificationRef = db.collection("users").doc(userId).collection("notifications").doc();

  await notificationRef.set({
    type,
    title,
    message,
    severity,
    read: false,
    metadata: metadata || {},
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info(`✅ [${functionName}] Notification created successfully: ${notificationRef.id}`);
}

// ==========================================
// Polar Payment Integration
// ==========================================

/**
 * createPolarCheckout - Creates a Polar checkout session
 *
 * This function handles subscription checkout via Polar.
 * Requires user authentication.
 */
export const createPolarCheckout = onCall(
  {
    secrets: [polarAccessToken],
    enforceAppCheck: true, // App Check enabled for security
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = "createPolarCheckout";

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Create Polar Checkout`);
    logger.info("═".repeat(60));

    // Step 1: Verify user authentication
    logger.info(`🔐 [${functionName}] Step 1: Verifying user authentication...`);

    if (!request.auth) {
      logger.error(`❌ [${functionName}] Authentication FAILED - No auth context present`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (REJECTED)`);
      throw new HttpsError("unauthenticated", "User must be authenticated to checkout");
    }

    logger.info(`✅ [${functionName}] Authentication VERIFIED`, {
      uid: request.auth.uid,
      email: request.auth.token.email || "(no email)",
    });

    // Step 2: Validate request parameters
    logger.info(`📥 [${functionName}] Step 2: Validating request parameters...`);

    const {productId, successUrl, cancelUrl} = request.data;

    logger.info(`📝 [${functionName}] Request data received`, {
      productId: productId || "(missing)",
      hasSuccessUrl: !!successUrl,
      hasCancelUrl: !!cancelUrl,
    });

    if (!productId) {
      logger.error(`❌ [${functionName}] Validation FAILED - Missing 'productId' parameter`);
      throw new HttpsError("invalid-argument", "Missing 'productId' parameter");
    }

    if (!successUrl || !cancelUrl) {
      logger.error(`❌ [${functionName}] Validation FAILED - Missing URL parameters`);
      throw new HttpsError("invalid-argument", "Missing 'successUrl' or 'cancelUrl' parameter");
    }

    logger.info(`✅ [${functionName}] Request parameters validated`);

    // Step 3: Retrieve Polar access token from secrets
    logger.info(`🔑 [${functionName}] Step 3: Retrieving Polar access token...`);

    const accessToken = polarAccessToken.value();

    if (!accessToken) {
      logger.error(`❌ [${functionName}] ACCESS TOKEN NOT CONFIGURED`);
      throw new HttpsError("failed-precondition", "Payment service is not configured. Please contact support.");
    }

    logger.info(`✅ [${functionName}] Access token retrieved successfully`);

    // Step 4: Initialize Polar client
    logger.info(`💳 [${functionName}] Step 4: Initializing Polar client...`);

    const polar = new Polar({
      accessToken: accessToken,
    });

    logger.info(`✅ [${functionName}] Polar client initialized`);

    // Step 5: Create checkout session
    logger.info(`🔄 [${functionName}] Step 5: Creating checkout session...`);

    try {
      const apiStartTime = Date.now();

      const checkout = await polar.checkouts.create({
        products: [productId],
        successUrl: successUrl,
        customerEmail: request.auth.token.email || undefined,
        metadata: {
          userId: request.auth.uid,
          email: request.auth.token.email || "",
        },
      });

      const apiTime = Date.now() - apiStartTime;
      const totalTime = Date.now() - startTime;

      logger.info(`✅ [${functionName}] Checkout session created successfully`, {
        checkoutId: checkout.id,
        url: checkout.url,
        apiTimeMs: apiTime,
      });

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] CHECKOUT CREATION SUCCESSFUL`);
      logger.info("─".repeat(60));
      logger.info(`📤 [${functionName}] Summary:`, {
        userId: request.auth.uid,
        productId: productId,
        checkoutId: checkout.id,
        apiTimeMs: apiTime,
        totalExecutionTimeMs: totalTime,
      });
      logger.info(`⏱️ [${functionName}] Total execution time: ${totalTime}ms`);
      logger.info("═".repeat(60));

      return {
        success: true,
        url: checkout.url,
        checkoutId: checkout.id,
      };
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] CHECKOUT CREATION FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        userId: request.auth.uid,
        productId: productId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      logger.info(`⏱️ [${functionName}] Execution time before failure: ${totalTime}ms`);
      logger.info("═".repeat(60));

      throw new HttpsError("internal", "Failed to create checkout session. Please try again.");
    }
  }
);

/**
 * polarWebhook - Receives and processes Polar webhook events
 *
 * This function handles subscription lifecycle events from Polar.
 * Validates webhook signature and updates Firestore subscription status.
 */
export const polarWebhook = onRequest(
  {
    secrets: [polarWebhookSecret],
  },
  async (req, res) => {
    const startTime = Date.now();
    const functionName = "polarWebhook";

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Polar Webhook`);
    logger.info("═".repeat(60));

    try {
      // Step 1: Verify webhook signature
      logger.info(`🔐 [${functionName}] Step 1: Verifying webhook signature...`);

      const webhookSecret = polarWebhookSecret.value();

      if (!webhookSecret) {
        logger.error(`❌ [${functionName}] WEBHOOK SECRET NOT CONFIGURED`);
        res.status(500).send("Webhook secret not configured");
        return;
      }

      const svixId = req.headers["svix-id"] as string;
      const svixTimestamp = req.headers["svix-timestamp"] as string;
      const svixSignature = req.headers["svix-signature"] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        logger.error(`❌ [${functionName}] Missing webhook signature headers`);
        res.status(400).send("Missing signature headers");
        return;
      }

      logger.info(`📝 [${functionName}] Webhook headers received`, {
        svixId,
        svixTimestamp,
      });

      const wh = new Webhook(webhookSecret);
      let payload: any;

      try {
        payload = wh.verify(JSON.stringify(req.body), {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
        logger.info(`✅ [${functionName}] Webhook signature verified`);
      } catch (err: any) {
        logger.error(`❌ [${functionName}] Webhook signature verification failed`, {
          error: err.message,
        });
        res.status(400).send("Invalid signature");
        return;
      }

      // Step 2: Process event
      logger.info(`📥 [${functionName}] Step 2: Processing webhook event...`);

      const eventType = payload.type;
      const eventData = payload.data;

      logger.info(`📝 [${functionName}] Event details`, {
        type: eventType,
        hasData: !!eventData,
      });

      let userId: string;

      // Extract userId from metadata
      if (eventData.metadata?.userId) {
        userId = eventData.metadata.userId;
        logger.info(`✅ [${functionName}] User ID found in metadata: ${userId}`);
      } else if (eventData.customer?.metadata?.userId) {
        userId = eventData.customer.metadata.userId;
        logger.info(`✅ [${functionName}] User ID found in customer metadata: ${userId}`);
      } else {
        logger.error(`❌ [${functionName}] No userId found in webhook payload`);
        res.status(400).send("No userId in webhook payload");
        return;
      }

      // Step 2.5: Check idempotency
      logger.info(`🔐 [${functionName}] Step 2.5: Checking event idempotency...`);

      const eventId = payload.id || svixId;
      const isNewEvent = await checkEventIdempotency(userId, eventId);

      if (!isNewEvent) {
        logger.info(`✅ [${functionName}] Event already processed: ${eventId}`);
        res.status(200).send("Event already processed");
        return;
      }

      // Step 3: Update Firestore based on event type
      logger.info(`💾 [${functionName}] Step 3: Updating Firestore...`);

      const subscriptionRef = db
        .collection("users")
        .doc(userId)
        .collection("subscription")
        .doc("current");

      try {
        switch (eventType) {
        case "checkout.completed": {
          logger.info(`✅ [${functionName}] Processing checkout.completed event`);

          const subscription = eventData.subscription;
          if (!subscription) {
            logger.error(`❌ [${functionName}] No subscription data in checkout.completed`);
            res.status(400).send("No subscription data");
            return;
          }

          const subscriptionData = {
            status: "active",
            plan: "pro",
            billingCycle: subscription.recurring_interval === "month" ? "monthly" : "yearly",
            polarSubscriptionId: subscription.id,
            polarCustomerId: subscription.customer_id || null,
            currentPeriodStart: subscription.current_period_start ?
              Timestamp.fromDate(new Date(subscription.current_period_start)) : null,
            currentPeriodEnd: subscription.current_period_end ?
              Timestamp.fromDate(new Date(subscription.current_period_end)) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            tokenUsage: {
              inputTokens: 0,
              outputTokens: 0,
              totalCost: 0,
              lastResetAt: FieldValue.serverTimestamp(),
              lastUpdatedAt: FieldValue.serverTimestamp(),
              isLimitReached: false,
            },
          };

          await subscriptionRef.set(subscriptionData);

          logger.info(`✅ [${functionName}] Subscription created`, {
            userId,
            plan: "pro",
            billingCycle: subscriptionData.billingCycle,
          });
          break;
        }

        case "subscription.updated": {
          logger.info(`✅ [${functionName}] Processing subscription.updated event`);

          const subscription = eventData;
          const updateData = {
            status: subscription.status || "active",
            currentPeriodStart: subscription.current_period_start ?
              Timestamp.fromDate(new Date(subscription.current_period_start)) : null,
            currentPeriodEnd: subscription.current_period_end ?
              Timestamp.fromDate(new Date(subscription.current_period_end)) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            updatedAt: FieldValue.serverTimestamp(),
          };

          await subscriptionRef.update(updateData);

          logger.info(`✅ [${functionName}] Subscription updated`, {
            userId,
            status: updateData.status,
          });
          break;
        }

        case "payment.failed":
        case "invoice.payment_failed": {
          logger.info(`✅ [${functionName}] Processing payment failure event`);

          // Immediate downgrade
          await subscriptionRef.update({
            status: "payment_failed",
            plan: "free",
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Create notification
          await createNotification(
            userId,
            "payment_failed",
            "Payment Failed",
            "Your payment could not be processed. Your account has been downgraded to " +
            "the Free plan. Please update your payment method to restore Pro access.",
            "error",
            {reason: eventData.reason || eventData.failure_reason || "unknown"}
          );

          logger.info(`✅ [${functionName}] User downgraded due to payment failure`, {
            userId,
          });
          break;
        }

        case "subscription.past_due": {
          logger.info(`✅ [${functionName}] Processing past_due event`);

          // Immediate downgrade (per user's choice)
          await subscriptionRef.update({
            status: "past_due",
            plan: "free",
            updatedAt: FieldValue.serverTimestamp(),
          });

          await createNotification(
            userId,
            "payment_failed",
            "Subscription Past Due",
            "Your subscription payment is past due. Please update your payment method.",
            "error"
          );

          logger.info(`✅ [${functionName}] Subscription marked as past_due`, {
            userId,
          });
          break;
        }

        case "customer.source.expiring":
        case "payment_method.expiring": {
          logger.info(`✅ [${functionName}] Processing card expiring warning`);

          await createNotification(
            userId,
            "card_expiring",
            "Payment Method Expiring Soon",
            "Your payment method will expire soon. Please update it to avoid service interruption.",
            "warning",
            {
              expiryDate: eventData.expiry_date,
              last4: eventData.last4,
            }
          );

          logger.info(`✅ [${functionName}] Card expiring notification sent`, {
            userId,
          });
          break;
        }

        case "charge.refunded": {
          logger.info(`✅ [${functionName}] Processing refund event`);

          // Downgrade on refund
          await subscriptionRef.update({
            status: "refunded",
            plan: "free",
            updatedAt: FieldValue.serverTimestamp(),
          });

          await createNotification(
            userId,
            "refund_issued",
            "Refund Processed",
            "Your subscription has been refunded and your account has been downgraded to Free.",
            "info",
            {
              amount: eventData.amount,
              refundId: eventData.id,
            }
          );

          logger.info(`✅ [${functionName}] Refund processed and user downgraded`, {
            userId,
          });
          break;
        }

        case "subscription.plan_changed": {
          logger.info(`✅ [${functionName}] Processing subscription plan change`);

          const subscription = eventData;
          const newBillingCycle = subscription.recurring_interval === "month" ? "monthly" : "yearly";

          await subscriptionRef.update({
            status: subscription.status || "active",
            billingCycle: newBillingCycle,
            currentPeriodStart: subscription.current_period_start ?
              Timestamp.fromDate(new Date(subscription.current_period_start)) : null,
            currentPeriodEnd: subscription.current_period_end ?
              Timestamp.fromDate(new Date(subscription.current_period_end)) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Notify about plan change
          await createNotification(
            userId,
            "plan_changed",
            "Subscription Plan Updated",
            `Your billing cycle has been changed to ${newBillingCycle}.`,
            "success",
            {billingCycle: newBillingCycle}
          );

          logger.info(`✅ [${functionName}] Plan changed successfully`, {
            userId,
            newBillingCycle,
          });
          break;
        }

        case "checkout.failed": {
          logger.info(`✅ [${functionName}] Processing checkout failed event`);

          await createNotification(
            userId,
            "payment_failed",
            "Checkout Failed",
            "There was an issue processing your checkout. Please try again or contact support.",
            "error",
            {
              reason: eventData.failure_reason || eventData.reason,
              checkoutId: eventData.id,
            }
          );

          logger.info(`✅ [${functionName}] Checkout failed notification sent`, {
            userId,
          });
          break;
        }

        case "subscription.canceled": {
          logger.info(`✅ [${functionName}] Processing subscription.canceled event`);

          const updateData = {
            status: "canceled",
            plan: "free",
            cancelAtPeriodEnd: false,
            updatedAt: FieldValue.serverTimestamp(),
          };

          await subscriptionRef.update(updateData);

          await createNotification(
            userId,
            "subscription_canceled",
            "Subscription Canceled",
            "Your subscription has been canceled. You can resubscribe at any time from the Plans page.",
            "info"
          );

          logger.info(`✅ [${functionName}] Subscription canceled`, {
            userId,
          });
          break;
        }

        default:
          logger.info(`⚠️ [${functionName}] Unhandled event type: ${eventType}`);
          res.status(200).send("Event type not handled");
          return;
        }

        // Mark event as successfully processed
        await db.collection("users").doc(userId).collection("webhookEvents").doc(eventId).update({
          processed: true,
          processedAt: FieldValue.serverTimestamp(),
          eventType: eventType,
        });

        logger.info(`✅ [${functionName}] Event marked as processed: ${eventId}`);

        const totalTime = Date.now() - startTime;

        logger.info("─".repeat(60));
        logger.info(`✅ [${functionName}] WEBHOOK PROCESSED SUCCESSFULLY`);
        logger.info("─".repeat(60));
        logger.info(`📤 [${functionName}] Summary:`, {
          eventType,
          userId,
          eventId,
          totalExecutionTimeMs: totalTime,
        });
        logger.info("═".repeat(60));

        res.status(200).send("Webhook processed");
      } catch (processingError: any) {
        // Log error for debugging
        logger.error(`❌ [${functionName}] Error processing event:`, {
          eventId,
          eventType,
          userId,
          error: processingError.message,
        });

        await db.collection("users").doc(userId).collection("webhookEvents").doc(eventId).update({
          processed: false,
          error: processingError.message,
          failedAt: FieldValue.serverTimestamp(),
        });

        throw processingError;
      }
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] WEBHOOK PROCESSING FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      logger.info(`⏱️ [${functionName}] Execution time before failure: ${totalTime}ms`);
      logger.info("═".repeat(60));

      res.status(500).send("Internal server error");
    }
  }
);

/**
 * cancelPolarSubscription - Cancels a user's Polar subscription
 *
 * This function cancels an active subscription via Polar API.
 * Requires user authentication.
 */
export const cancelPolarSubscription = onCall(
  {
    secrets: [polarAccessToken],
    enforceAppCheck: true, // App Check enabled for security
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = "cancelPolarSubscription";

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Cancel Subscription`);
    logger.info("═".repeat(60));

    // Step 1: Verify user authentication
    logger.info(`🔐 [${functionName}] Step 1: Verifying user authentication...`);

    if (!request.auth) {
      logger.error(`❌ [${functionName}] Authentication FAILED`);
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info(`✅ [${functionName}] Authentication VERIFIED`, {
      uid: request.auth.uid,
    });

    // Step 2: Get subscription from Firestore
    logger.info(`💾 [${functionName}] Step 2: Fetching subscription...`);

    const subscriptionRef = db
      .collection("users")
      .doc(request.auth.uid)
      .collection("subscription")
      .doc("current");

    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists) {
      logger.error(`❌ [${functionName}] No subscription found`);
      throw new HttpsError("not-found", "No active subscription found");
    }

    const subscriptionData = subscriptionSnap.data();
    const polarSubscriptionId = subscriptionData?.polarSubscriptionId;

    if (!polarSubscriptionId) {
      logger.error(`❌ [${functionName}] No Polar subscription ID`);
      throw new HttpsError("not-found", "No Polar subscription ID found");
    }

    logger.info(`✅ [${functionName}] Subscription found`, {
      polarSubscriptionId,
    });

    // Step 3: Mark subscription for cancellation
    logger.info(`📨 [${functionName}] Step 3: Marking subscription for cancellation...`);

    try {
      // Mark subscription for cancellation at period end in Firestore
      // User should cancel through Polar's customer portal for proper billing handling
      await subscriptionRef.update({
        cancelAtPeriodEnd: true,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`✅ [${functionName}] Marked subscription for cancellation at period end`);

      const totalTime = Date.now() - startTime;

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] SUBSCRIPTION CANCEL SCHEDULED`);
      logger.info("─".repeat(60));
      logger.info(`📤 [${functionName}] Summary:`, {
        userId: request.auth.uid,
        polarSubscriptionId,
        totalExecutionTimeMs: totalTime,
      });
      logger.info("═".repeat(60));

      return {
        success: true,
        message: "Subscription will be canceled at the end of the current billing period",
      };
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] CANCELLATION FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        errorMessage: error.message,
        errorStack: error.stack,
      });
      logger.info(`⏱️ [${functionName}] Execution time: ${totalTime}ms`);
      logger.info("═".repeat(60));

      throw new HttpsError("internal", "Failed to cancel subscription");
    }
  }
);

/**
 * getPolarCustomerPortal - Gets Polar customer portal URL
 *
 * This function returns a URL to the Polar customer portal where users can manage billing.
 * Requires user authentication.
 */
export const getPolarCustomerPortal = onCall(
  {
    secrets: [polarAccessToken],
    enforceAppCheck: true, // App Check enabled for security
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = "getPolarCustomerPortal";

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Get Customer Portal`);
    logger.info("═".repeat(60));

    // Step 1: Verify user authentication
    if (!request.auth) {
      logger.error(`❌ [${functionName}] Authentication FAILED`);
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info(`✅ [${functionName}] Authentication VERIFIED`);

    // Step 2: Get subscription from Firestore
    const subscriptionRef = db
      .collection("users")
      .doc(request.auth.uid)
      .collection("subscription")
      .doc("current");

    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists) {
      logger.error(`❌ [${functionName}] No subscription found`);
      throw new HttpsError("not-found", "No active subscription found");
    }

    const subscriptionData = subscriptionSnap.data();
    const polarCustomerId = subscriptionData?.polarCustomerId;

    if (!polarCustomerId) {
      logger.error(`❌ [${functionName}] No Polar customer ID`);
      throw new HttpsError("not-found", "No customer ID found");
    }

    // Step 3: Return customer portal URL
    // Polar uses a standard customer portal URL format
    const portalUrl = `https://polar.sh/customer/${polarCustomerId}`;

    const totalTime = Date.now() - startTime;

    logger.info("─".repeat(60));
    logger.info(`✅ [${functionName}] PORTAL URL RETRIEVED`);
    logger.info("─".repeat(60));
    logger.info(`📤 [${functionName}] Summary:`, {
      userId: request.auth.uid,
      totalExecutionTimeMs: totalTime,
    });
    logger.info("═".repeat(60));

    return {
      url: portalUrl,
    };
  }
);

/**
 * getPolarInvoices - Gets user's invoices from Polar
 *
 * This function fetches all invoices for a user from Polar.
 * Requires user authentication.
 */
export const getPolarInvoices = onCall(
  {
    secrets: [polarAccessToken],
    enforceAppCheck: true, // App Check enabled for security
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = "getPolarInvoices";

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Get Invoices`);
    logger.info("═".repeat(60));

    // Step 1: Verify user authentication
    if (!request.auth) {
      logger.error(`❌ [${functionName}] Authentication FAILED`);
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info(`✅ [${functionName}] Authentication VERIFIED`);

    // Step 2: Get subscription from Firestore
    const subscriptionRef = db
      .collection("users")
      .doc(request.auth.uid)
      .collection("subscription")
      .doc("current");

    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists) {
      logger.error(`❌ [${functionName}] No subscription found`);
      throw new HttpsError("not-found", "No subscription found");
    }

    const subscriptionData = subscriptionSnap.data();
    const polarSubscriptionId = subscriptionData?.polarSubscriptionId;

    if (!polarSubscriptionId) {
      logger.error(`❌ [${functionName}] No Polar subscription ID`);
      throw new HttpsError("not-found", "No subscription ID found");
    }

    // Step 3: Fetch invoices from Polar
    const accessToken = polarAccessToken.value();

    if (!accessToken) {
      logger.error(`❌ [${functionName}] ACCESS TOKEN NOT CONFIGURED`);
      throw new HttpsError("failed-precondition", "Payment service not configured");
    }

    const polar = new Polar({
      accessToken: accessToken,
    });

    try {
      // IMPLEMENTATION NOTE: Verify this API call against Polar SDK documentation
      // Based on Polar SDK v0.x, the correct method should be one of:
      // - polar.subscriptions.get(subscriptionId) - to get subscription details
      // - polar.checkouts.list() - to list checkouts/invoices
      // - polar.orders.list({ subscriptionId }) - to get orders for a subscription
      // 
      // The current implementation uses subscriptions.get() which returns subscription data,
      // not invoice data. To fetch actual invoices/orders, you may need:
      // const orders = await polar.orders.list({ subscriptionId: polarSubscriptionId });
      // 
      // Please verify with: https://docs.polar.sh/api
      const invoices = await polar.subscriptions.get(polarSubscriptionId);

      const totalTime = Date.now() - startTime;

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] INVOICES RETRIEVED`);
      logger.info("─".repeat(60));
      logger.info(`📤 [${functionName}] Summary:`, {
        userId: request.auth.uid,
        totalExecutionTimeMs: totalTime,
      });
      logger.info("═".repeat(60));

      return {
        invoices: invoices || [],
      };
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] FETCH FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        errorMessage: error.message,
      });
      logger.info(`⏱️ [${functionName}] Execution time: ${totalTime}ms`);
      logger.info("═".repeat(60));

      throw new HttpsError("internal", "Failed to fetch invoices");
    }
  }
);

// ==========================================
// Gemini AI Proxy Function
// ==========================================

/**
 * System prompt for the AI assistant
 */
// eslint-disable-next-line max-len
const ASSISTANT_SYSTEM_PROMPT = `You are SAGE (Strategic Advancement & Growth Engine), an elite AI assistant for XPeak - a gamified productivity platform.

Your personality:
- Professional but encouraging, like a supportive mentor
- You help users level up their real-life skills through structured goals
- You understand the gamification system: XP, levels, skills (Physical, Mental, Professional, Social, Creative)
- You can create tasks, quests (multi-step projects), and challenges

Difficulty levels and their XP values:
- Easy: Quick tasks (5-15 min), 10 XP base
- Medium: Standard tasks (15-45 min), 25 XP base  
- Hard: Challenging tasks (45+ min), 50 XP base
- Epic: Major achievements, 100 XP base

Skill Categories:
- Physical: Exercise, sports, health
- Mental: Learning, reading, meditation
- Professional: Work, career, coding
- Social: Networking, communication, relationships
- Creative: Art, music, writing, design
- Default: General tasks

When creating quests, break them into logical phases/categories with specific actionable tasks.`;

/**
 * geminiProxy - Secure proxy for Gemini AI API calls
 *
 * This function handles all AI requests from the client, keeping the API key secure.
 * Requires user authentication.
 */
export const geminiProxy = onCall(
  {
    secrets: [geminiApiKey],
    enforceAppCheck: true, // App Check enabled for security
    maxInstances: 10,
    minInstances: 1, // Keep 1 instance warm for faster response
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = "geminiProxy";
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - AI Proxy Request`);
    logger.info(`🆔 [${functionName}] Request ID: ${requestId}`);
    logger.info("═".repeat(60));

    // Step 1: Verify user authentication
    logger.info(`🔐 [${functionName}] Step 1: Verifying user authentication...`);

    if (!request.auth) {
      logger.error(`❌ [${functionName}] Authentication FAILED - No auth context present`);
      logger.error(`❌ [${functionName}] Request rejected: User must be authenticated`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (REJECTED)`);
      throw new HttpsError("unauthenticated", "User must be authenticated to use AI features");
    }

    logger.info(`✅ [${functionName}] Authentication VERIFIED`, {
      uid: request.auth.uid,
      email: request.auth.token.email || "(no email)",
      emailVerified: request.auth.token.email_verified,
    });

    // Step 2: Check rate limits
    logger.info(`🚦 [${functionName}] Step 2: Checking rate limits...`);

    const rateLimitResult = await checkRateLimit(request.auth.uid);
    if (!rateLimitResult.allowed) {
      logger.error(`❌ [${functionName}] Rate limit exceeded for user: ${request.auth.uid}`);
      logger.error(`❌ [${functionName}] ${rateLimitResult.error}`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (RATE LIMITED)`);
      throw new HttpsError("resource-exhausted", rateLimitResult.error!);
    }

    logger.info(`✅ [${functionName}] Rate limits passed`);

    // Step 3: Check token usage limits
    logger.info(`💰 [${functionName}] Step 3: Checking token usage limits...`);

    const tokenLimitResult = await checkTokenLimit(request.auth.uid);
    if (!tokenLimitResult.allowed) {
      logger.error(`❌ [${functionName}] Token limit exceeded for user: ${request.auth.uid}`);
      logger.error(`❌ [${functionName}] ${tokenLimitResult.error}`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (TOKEN LIMIT EXCEEDED)`);
      throw new HttpsError("resource-exhausted", tokenLimitResult.error!);
    }

    logger.info(`✅ [${functionName}] Token limits passed`, {
      remainingBudget: `$${tokenLimitResult.remainingBudget?.toFixed(4) || "0.0000"}`,
    });

    // Step 4: Validate request parameters
    logger.info(`📥 [${functionName}] Step 4: Validating request parameters...`);

    const {action, payload} = request.data;

    logger.info(`📝 [${functionName}] Request data received`, {
      action: action || "(missing)",
      hasPayload: !!payload,
      payloadKeys: payload ? Object.keys(payload) : [],
    });

    if (!action) {
      logger.error(`❌ [${functionName}] Validation FAILED - Missing 'action' parameter`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (INVALID)`);
      throw new HttpsError("invalid-argument", "Missing 'action' parameter");
    }

    logger.info(`✅ [${functionName}] Request parameters validated - Action: "${action}"`);

    // Step 5: Retrieve API key from secrets
    logger.info(`🔑 [${functionName}] Step 5: Retrieving Gemini API key from secrets...`);

    const apiKey = geminiApiKey.value();

    if (!apiKey) {
      logger.error(`❌ [${functionName}] API KEY NOT CONFIGURED`);
      logger.error(`❌ [${functionName}] The GEMINI_API_KEY secret is missing or empty`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (CONFIG ERROR)`);
      throw new HttpsError("failed-precondition", "AI service is not configured. Please contact support.");
    }

    logger.info(`✅ [${functionName}] API key retrieved successfully (length: ${apiKey.length} chars)`);

    // Step 6: Initialize Gemini AI
    logger.info(`🤖 [${functionName}] Step 6: Initializing Google GenAI client...`);

    const initStartTime = Date.now();
    const ai = new GoogleGenAI({apiKey});

    logger.info(`✅ [${functionName}] Gemini AI client initialized`, {
      model: GEMINI_MODEL,
      initTimeMs: Date.now() - initStartTime,
    });

    // Step 7: Route to appropriate handler
    logger.info(`🔄 [${functionName}] Step 7: Routing to action handler: "${action}"`);

    try {
      let result;
      const handlerStartTime = Date.now();

      switch (action) {
      case "generateQuest":
        logger.info(`📨 [${functionName}] Dispatching to handleGenerateQuest...`);
        result = await handleGenerateQuest(ai, payload, requestId);
        break;

      case "analyzeTask":
        logger.info(`📨 [${functionName}] Dispatching to handleAnalyzeTask...`);
        result = await handleAnalyzeTask(ai, payload, requestId);
        break;

      case "generateChatResponse":
        logger.info(`📨 [${functionName}] Dispatching to handleChatResponse...`);
        result = await handleChatResponse(ai, payload, requestId);
        break;

      case "generateFollowUpResponse":
        logger.info(`📨 [${functionName}] Dispatching to handleFollowUpResponse...`);
        result = await handleFollowUpResponse(ai, payload, requestId);
        break;

      default:
        logger.error(`❌ [${functionName}] Unknown action: "${action}"`);
        logger.error(
          `❌ [${functionName}] Valid actions: generateQuest, analyzeTask, ` +
          "generateChatResponse, generateFollowUpResponse"
        );
        throw new HttpsError("invalid-argument", `Unknown action: ${action}`);
      }

      const handlerTime = Date.now() - handlerStartTime;
      const totalTime = Date.now() - startTime;

      // Step 8: Track token usage
      if (result?.tokenUsage) {
        logger.info(`💰 [${functionName}] Step 8: Tracking token usage...`);
        await trackTokenUsage(
          request.auth.uid,
          result.tokenUsage.inputTokens,
          result.tokenUsage.outputTokens
        );
      }

      // Success summary
      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] REQUEST COMPLETED SUCCESSFULLY`);
      logger.info("─".repeat(60));
      logger.info(`📤 [${functionName}] Response summary:`, {
        requestId: requestId,
        action: action,
        userId: request.auth.uid,
        handlerTimeMs: handlerTime,
        totalTimeMs: totalTime,
        success: result?.success || false,
        tokensUsed: result?.tokenUsage?.totalTokens || 0,
      });
      logger.info(`⏱️ [${functionName}] Total execution time: ${totalTime}ms`);
      logger.info("═".repeat(60));

      return result;
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] REQUEST FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        requestId: requestId,
        action: action,
        userId: request.auth.uid,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        isHttpsError: error instanceof HttpsError,
      });

      if (error.stack) {
        logger.error(`❌ [${functionName}] Stack trace:`, {stack: error.stack});
      }

      logger.info(`⏱️ [${functionName}] Execution time before failure: ${totalTime}ms`);
      logger.info("═".repeat(60));

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "AI service error. Please try again.");
    }
  }
);

/**
 * Handle quest generation from a title
 */
async function handleGenerateQuest(ai: GoogleGenAI, payload: { questTitle: string }, requestId: string) {
  const handlerName = "handleGenerateQuest";
  const startTime = Date.now();

  logger.info(`🎯 [${handlerName}] BEGIN - Quest Generation Handler [${requestId}]`);

  const {questTitle} = payload;
  if (!questTitle) {
    logger.error(`❌ [${handlerName}] Missing questTitle`);
    throw new HttpsError("invalid-argument", "Missing questTitle");
  }

  const prompt = `Create a detailed quest breakdown for: "${questTitle}"

Return a JSON array of categories, each with tasks. Format:
[
  {
    "title": "Phase 1: Category Name",
    "tasks": [
      {
        "name": "Specific actionable task",
        "difficulty": "Easy|Medium|Hard|Epic",
        "skillCategory": "Physical|Mental|Professional|Social|Creative|Default"
      }
    ]
  }
]

Guidelines:
- Create 2-4 logical phases/categories
- Each category should have 3-6 specific, actionable tasks
- Assign appropriate difficulty based on time/effort required
- Match skill categories to the nature of each task
- Make tasks specific and measurable

Return ONLY the JSON array, no markdown or explanation.`;

  logger.info(`🤖 [${handlerName}] Calling Gemini API (${GEMINI_MODEL})...`);

  const apiStartTime = Date.now();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  const apiTime = Date.now() - apiStartTime;

  const text = response.text || "";

  // Extract token usage metadata
  const usageMetadata = response.usageMetadata || {} as any;
  const inputTokens = usageMetadata.promptTokenCount || 0;
  const outputTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || 0;

  logger.info(`✅ [${handlerName}] Response received (${apiTime}ms, ${totalTokens} tokens)`);

  try {
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const categories = JSON.parse(cleanedText);
    const totalTasks = categories.reduce((sum: number, cat: any) => sum + (cat.tasks?.length || 0), 0);

    logger.info(`✅ [${handlerName}] Quest generated`, {
      phases: categories.length, tasks: totalTasks, ms: Date.now() - startTime,
    });

    return {success: true, data: categories, tokenUsage: {inputTokens, outputTokens, totalTokens}};
  } catch (parseError) {
    logger.error(`❌ [${handlerName}] JSON parse failed:`, {
      error: (parseError as Error).message,
      rawPreview: text.substring(0, 300),
    });
    throw new HttpsError("internal", "Failed to generate quest structure");
  }
}

/**
 * Handle task analysis for difficulty and category suggestion
 */
async function handleAnalyzeTask(ai: GoogleGenAI, payload: { taskTitle: string }, requestId: string) {
  const handlerName = "handleAnalyzeTask";
  const startTime = Date.now();

  logger.info(`🔍 [${handlerName}] BEGIN - Task Analysis Handler [${requestId}]`);

  const {taskTitle} = payload;
  if (!taskTitle) {
    logger.error(`❌ [${handlerName}] Missing taskTitle`);
    throw new HttpsError("invalid-argument", "Missing taskTitle");
  }

  const prompt = `Analyze this task: "${taskTitle}"

Return a JSON object with:
{
  "difficulty": "Easy|Medium|Hard|Epic",
  "skillCategory": "Physical|Mental|Professional|Social|Creative|Default",
  "suggestedDescription": "A brief helpful description (1-2 sentences)"
}

Difficulty guide:
- Easy: Quick tasks (5-15 min)
- Medium: Standard tasks (15-45 min)
- Hard: Challenging tasks (45+ min)
- Epic: Major achievements

Return ONLY the JSON object, no markdown or explanation.`;

  logger.info(`🤖 [${handlerName}] Calling Gemini API (${GEMINI_MODEL})...`);

  const apiStartTime = Date.now();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  const apiTime = Date.now() - apiStartTime;

  const text = response.text || "";

  // Extract token usage metadata
  const usageMetadata = response.usageMetadata || {} as any;
  const inputTokens = usageMetadata.promptTokenCount || 0;
  const outputTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || 0;

  logger.info(`✅ [${handlerName}] Response received (${apiTime}ms, ${totalTokens} tokens)`);

  try {
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleanedText);

    logger.info(`✅ [${handlerName}] Task analyzed`, {
      difficulty: analysis.difficulty, category: analysis.skillCategory,
      ms: Date.now() - startTime,
    });

    return {success: true, data: analysis, tokenUsage: {inputTokens, outputTokens, totalTokens}};
  } catch (parseError) {
    logger.error(`❌ [${handlerName}] JSON parse failed:`, {
      error: (parseError as Error).message,
      rawPreview: text.substring(0, 300),
    });
    throw new HttpsError("internal", "Failed to analyze task");
  }
}

/**
 * Handle chat response generation with function calling
 */
async function handleChatResponse(ai: GoogleGenAI, payload: {
  messages: any[];
  userInput: string;
  systemPrompt: string;
  tools: any[];
}, requestId: string) {
  const handlerName = "handleChatResponse";
  const startTime = Date.now();

  logger.info(`💬 [${handlerName}] BEGIN - Chat Response Handler [${requestId}]`);

  const {messages, userInput, systemPrompt, tools} = payload;

  if (!userInput) {
    logger.error(`❌ [${handlerName}] Missing userInput`);
    throw new HttpsError("invalid-argument", "Missing userInput");
  }

  logger.info(`📝 [${handlerName}] ${messages?.length || 0} history msgs, ${tools?.length || 0} tools`);

  // Convert tools to Gemini format
  const geminiTools = tools && tools.length > 0 ? [{
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: convertToolSchema(tool.parameters),
    })),
  }] : undefined;

  // Build contents array from chat history (filter out tool notification messages)
  let contents: any[] = (messages || [])
    .filter((msg: any) => !msg.isTool)
    .map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.text || ""}],
    }));

  // Gemini requires contents to start with a user message
  while (contents.length > 0 && contents[0].role === "model") {
    contents = contents.slice(1);
  }

  // Add the new user message
  contents.push({role: "user", parts: [{text: userInput}]});

  const effectiveSystemPrompt = systemPrompt || ASSISTANT_SYSTEM_PROMPT;

  logger.info(`🤖 [${handlerName}] Calling Gemini (${GEMINI_MODEL}) with ${contents.length} messages...`);

  const apiStartTime = Date.now();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: effectiveSystemPrompt,
      ...(geminiTools ? {tools: geminiTools} : {}),
    },
  });
  const apiTime = Date.now() - apiStartTime;

  // Extract token usage metadata
  const usageMetadata = response.usageMetadata || {} as any;
  const inputTokens = usageMetadata.promptTokenCount || 0;
  const outputTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || 0;

  logger.info(`✅ [${handlerName}] Response received (${apiTime}ms, ${totalTokens} tokens)`);

  // Check for function calls
  const functionCalls = response.functionCalls;

  if (functionCalls && functionCalls.length > 0) {
    const formattedCalls = functionCalls.map((fc: any, index: number) => ({
      id: `call_${index}`,
      name: fc.name,
      args: fc.args,
    }));

    // Serialize the model's content for follow-up (needed to send function results back)
    const modelContent = response.candidates?.[0]?.content || null;

    const fnNames = formattedCalls.map((fc: any) => fc.name).join(", ");
    logger.info(`🔧 [${handlerName}] Function calls: ${fnNames}`, {
      ms: Date.now() - startTime,
    });

    return {
      success: true,
      data: {
        functionCalls: formattedCalls,
        modelContent: modelContent,
      },
      tokenUsage: {inputTokens, outputTokens, totalTokens},
    };
  }

  // Text response
  const responseText = response.text || "";

  logger.info(`💬 [${handlerName}] Text response (${responseText.length} chars, ${Date.now() - startTime}ms)`);

  return {
    success: true,
    data: {
      text: responseText,
    },
    tokenUsage: {inputTokens, outputTokens, totalTokens},
  };
}

/**
 * Handle follow-up response after function execution.
 * Uses proper Gemini function response format to send results back to the model.
 */
async function handleFollowUpResponse(ai: GoogleGenAI, payload: {
  messages: any[];
  userInput: string;
  systemPrompt: string;
  modelContent: any;
  functionResponses: any[];
}, requestId: string) {
  const handlerName = "handleFollowUpResponse";
  const startTime = Date.now();

  logger.info(`🔄 [${handlerName}] BEGIN - Follow-Up Response Handler [${requestId}]`);

  const {messages, userInput, systemPrompt, modelContent, functionResponses} = payload;

  logger.info(`📝 [${handlerName}] History: ${messages?.length || 0} msgs, ` +
    `${functionResponses?.length || 0} function responses`);

  // Build contents array from chat history (filter out tool notification messages)
  let contents: any[] = (messages || [])
    .filter((msg: any) => !msg.isTool)
    .map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.text || ""}],
    }));

  // Gemini requires contents to start with a user message
  while (contents.length > 0 && contents[0].role === "model") {
    contents = contents.slice(1);
  }

  // Add the user message that triggered the function call
  contents.push({role: "user", parts: [{text: userInput}]});

  // Add the model's function call response (preserves the function call parts)
  if (modelContent) {
    contents.push(modelContent);
    logger.info(`✅ [${handlerName}] Model function call content added (${modelContent.parts?.length || 0} parts)`);
  } else {
    logger.warn(`⚠️ [${handlerName}] No model content - using text fallback`);
  }

  // Add function responses using proper Gemini functionResponse format
  if (functionResponses && functionResponses.length > 0) {
    const functionResponseParts = functionResponses.map((fr: any) => ({
      functionResponse: {
        name: fr.name,
        response: fr.response || {result: "completed"},
      },
    }));

    contents.push({role: "user", parts: functionResponseParts});

    logger.info(`✅ [${handlerName}] ${functionResponses.length} function response(s) added`);
  }

  const effectiveSystemPrompt = systemPrompt || ASSISTANT_SYSTEM_PROMPT;

  logger.info(`🤖 [${handlerName}] Calling Gemini (${GEMINI_MODEL}) for follow-up...`);

  const apiStartTime = Date.now();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: effectiveSystemPrompt,
    },
  });
  const apiTime = Date.now() - apiStartTime;

  // Extract token usage metadata
  const usageMetadata = response.usageMetadata || {} as any;
  const inputTokens = usageMetadata.promptTokenCount || 0;
  const outputTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || 0;

  const responseText = response.text || "Actions completed.";

  logger.info(`✅ [${handlerName}] Follow-up complete`, {
    apiMs: apiTime, chars: responseText.length,
    totalMs: Date.now() - startTime,
  });

  return {
    success: true,
    data: {
      text: responseText,
    },
    tokenUsage: {inputTokens, outputTokens, totalTokens},
  };
}

// ==========================================
// Scheduled Cleanup Functions
// ==========================================

/**
 * cleanupOldChatMessages - Scheduled function to delete chat messages older than 30 days
 *
 * Runs daily to maintain optimal storage costs and performance
 * Processes all users and deletes messages in batches to avoid rate limits
 */
export const cleanupOldChatMessages = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/New_York",
  },
  async () => {
    const functionName = "cleanupOldChatMessages";
    const startTime = Date.now();

    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] BEGIN EXECUTION - Scheduled Chat Cleanup`);
    logger.info("═".repeat(60));

    const retentionDays = 30;
    const cutoffDate = Timestamp.fromDate(
      new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    );

    logger.info(`🗑️ [${functionName}] Retention policy: Delete messages older than ${retentionDays} days`);
    logger.info(`📅 [${functionName}] Cutoff date: ${cutoffDate.toDate().toISOString()}`);

    try {
      // Use collection group query to get all old messages across all users in one query
      // This avoids N+1 query pattern (fetching all users then querying each one)
      let totalDeleted = 0;
      let batchCount = 0;
      let hasMore = true;

      while (hasMore) {
        // Query old messages across all users using collection group (batch of 500)
        const oldMessagesQuery = db.collectionGroup("oracleChat")
          .where("createdAt", "<", cutoffDate)
          .limit(500);

        const oldMessages = await oldMessagesQuery.get();

        if (oldMessages.empty) {
          hasMore = false;
          logger.info(`ℹ️ [${functionName}] No more old messages to delete`);
          break;
        }

        // Delete in batches
        const batch = db.batch();
        oldMessages.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        totalDeleted += oldMessages.docs.length;
        batchCount++;
        
        logger.info(`✅ [${functionName}] Batch ${batchCount}: Deleted ${oldMessages.docs.length} old messages`);

        // If we got fewer than the limit, we're done
        if (oldMessages.docs.length < 500) {
          hasMore = false;
        }

        // Small delay between batches to avoid rate limits
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] CLEANUP COMPLETE`);
      logger.info("─".repeat(60));
      logger.info(`📊 [${functionName}] Summary:`, {
        batchesProcessed: batchCount,
        messagesDeleted: totalDeleted,
        durationMs: duration,
      });
      logger.info("═".repeat(60));
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] CLEANUP FAILED`);
      logger.error("─".repeat(60));
      logger.error(`❌ [${functionName}] Error details:`, {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      logger.info(`⏱️ [${functionName}] Execution time before failure: ${duration}ms`);
      logger.info("═".repeat(60));
    }
  }
);

// ==========================================
// Helper Functions for AI
// ==========================================

/**
 * Convert tool parameters to Gemini schema format using new SDK Type enum
 */
function convertToolSchema(params: any): any {
  if (!params) return {type: Type.OBJECT};

  const convertType = (type: string) => {
    switch (type?.toUpperCase()) {
    case "STRING": return Type.STRING;
    case "NUMBER": return Type.NUMBER;
    case "INTEGER": return Type.INTEGER;
    case "BOOLEAN": return Type.BOOLEAN;
    case "ARRAY": return Type.ARRAY;
    case "OBJECT":
    default: return Type.OBJECT;
    }
  };

  const convertSchema = (schema: any): any => {
    if (!schema) return {};

    const result: any = {type: convertType(schema.type)};
    if (schema.description) result.description = schema.description;
    if (schema.enum) result.enum = schema.enum;
    if (schema.properties) {
      result.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        result.properties[key] = convertSchema(value);
      }
    }
    if (schema.items) result.items = convertSchema(schema.items);
    if (schema.required) result.required = schema.required;
    return result;
  };

  return convertSchema(params);
}

// ==========================================
// Maintenance Mode Management
// ==========================================

/**
 * Set Maintenance Mode
 * 
 * Admin-only Cloud Function to enable or disable maintenance mode.
 * Updates the config/maintenance document in Firestore.
 * 
 * @param {object} data - The request data
 * @param {boolean} data.isMaintenanceMode - Whether to enable maintenance mode
 * @param {string} [data.title] - Optional custom title for maintenance page
 * @param {string} [data.subtitle] - Optional custom message for maintenance page
 * @param {string} [data.date] - Optional expected completion date/time
 * @returns {object} Success status and updated configuration
 */
export const setMaintenanceMode = onCall(
  async (request) => {
    const functionName = "setMaintenanceMode";
    const startTime = Date.now();
    
    logger.info("═".repeat(60));
    logger.info(`🚀 [${functionName}] Function invoked`);
    
    try {
      // 🔐 Authentication check
      logger.info(`🔐 [${functionName}] Verifying admin authentication...`);
      if (!request.auth) {
        logger.warn(`⚠️ [${functionName}] Unauthorized: No authentication`);
        throw new HttpsError(
          "unauthenticated",
          "Authentication required to manage maintenance mode"
        );
      }
      
      const uid = request.auth.uid;
      logger.info(`🔐 [${functionName}] User authenticated: ${uid}`);
      
      // Check if user is admin (you can implement your own admin check)
      // For now, we'll check if the user has an 'admin' custom claim
      const isAdmin = request.auth.token.admin === true;
      
      if (!isAdmin) {
        logger.warn(`⚠️ [${functionName}] Unauthorized: User ${uid} is not admin`);
        throw new HttpsError(
          "permission-denied",
          "Only administrators can manage maintenance mode"
        );
      }
      
      logger.info(`✅ [${functionName}] Admin verified`);
      
      // 📥 Validate input
      logger.info(`📥 [${functionName}] Validating input data...`);
      const {isMaintenanceMode, title, subtitle, date} = request.data;
      
      if (typeof isMaintenanceMode !== "boolean") {
        logger.warn(`⚠️ [${functionName}] Invalid input: isMaintenanceMode must be boolean`);
        throw new HttpsError(
          "invalid-argument",
          "isMaintenanceMode must be a boolean"
        );
      }
      
      logger.info(`📥 [${functionName}] Input validated - Mode: ${isMaintenanceMode}`);
      
      // 💾 Update Firestore
      logger.info(`💾 [${functionName}] Updating maintenance configuration...`);
      const maintenanceRef = db.collection("config").doc("maintenance");
      
      const updateData: any = {
        isMaintenanceMode,
        lastUpdatedAt: FieldValue.serverTimestamp(),
      };
      
      // Update optional fields if provided
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (date !== undefined) updateData.date = date;
      
      await maintenanceRef.set(updateData, {merge: true});
      
      logger.info(`✅ [${functionName}] Maintenance configuration updated successfully`);
      logger.info(`📊 [${functionName}] New state: ${isMaintenanceMode ? "ENABLED" : "DISABLED"}`);
      
      // 📤 Return response
      const duration = Date.now() - startTime;
      logger.info(`⏱️ [${functionName}] Execution time: ${duration}ms`);
      logger.info("═".repeat(60));
      
      return {
        success: true,
        config: {
          isMaintenanceMode,
          ...updateData,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      logger.error(`❌ [${functionName}] Unexpected error:`, {
        error: error.message,
        errorStack: error.stack,
      });
      logger.info(`⏱️ [${functionName}] Execution time before failure: ${duration}ms`);
      logger.info("═".repeat(60));
      
      throw new HttpsError(
        "internal",
        "Failed to update maintenance mode configuration"
      );
    }
  }
);

// ==========================================
// User Deletion - Cascading Delete
// ==========================================

/**
 * 🗑️ CASCADE DELETE USER DATA
 * 
 * Triggered BEFORE a user account is deleted from Firebase Auth.
 * Cleans up all user data and references across the database to prevent orphaned data.
 * 
 * Cleanup includes:
 * - Friend requests (sent and received)
 * - Challenges (created or participated in)
 * - Friend documents in other users' collections
 * - All user subcollections
 */
export const cleanupUserData = beforeUserDeleted(async (event) => {
  const startTime = Date.now();
  const functionName = "cleanupUserData";
  const uid = event.data.uid;

  logger.info("═".repeat(60));
  logger.info(`🗑️ [${functionName}] Starting cascading delete for user: ${uid}`);
  logger.info("═".repeat(60));

  try {
    const batch = db.batch();
    let operationCount = 0;

    // Step 1: Delete friend requests (where user is sender or receiver)
    logger.info(`🔄 [${functionName}] Step 1: Cleaning up friend requests...`);
    
    // Delete requests sent by user
    const sentRequests = await db.collection("friendRequests")
      .where("fromUID", "==", uid)
      .get();
    
    sentRequests.docs.forEach((doc) => {
      batch.delete(doc.ref);
      operationCount++;
    });
    logger.info(`✅ [${functionName}] Queued ${sentRequests.size} sent friend requests for deletion`);

    // Delete requests received by user
    const receivedRequests = await db.collection("friendRequests")
      .where("toUID", "==", uid)
      .get();
    
    receivedRequests.docs.forEach((doc) => {
      batch.delete(doc.ref);
      operationCount++;
    });
    logger.info(`✅ [${functionName}] Queued ${receivedRequests.size} received friend requests for deletion`);

    // Step 2: Handle challenges (delete if creator, or remove from partnerIds if participant)
    logger.info(`🔄 [${functionName}] Step 2: Cleaning up challenges...`);
    
    const userChallenges = await db.collection("challenges")
      .where("partnerIds", "array-contains", uid)
      .get();
    
    for (const challengeDoc of userChallenges.docs) {
      const challengeData = challengeDoc.data();
      
      if (challengeData.creatorUID === uid) {
        // User is creator - delete the entire challenge
        batch.delete(challengeDoc.ref);
        operationCount++;
      } else {
        // User is participant - remove from partnerIds
        const updatedPartnerIds = challengeData.partnerIds.filter((id: string) => id !== uid);
        batch.update(challengeDoc.ref, {
          partnerIds: updatedPartnerIds,
          status: updatedPartnerIds.length < 2 ? "cancelled" : challengeData.status,
          updatedAt: FieldValue.serverTimestamp(),
        });
        operationCount++;
      }
    }
    logger.info(`✅ [${functionName}] Queued ${userChallenges.size} challenges for cleanup`);

    // Step 3: Delete friend documents in other users' collections
    logger.info(`🔄 [${functionName}] Step 3: Cleaning up friend relationships...`);
    
    // Query all users who have this user as a friend
    const friendRefs = await db.collectionGroup("friends")
      .where(FieldValue.documentId(), "==", uid)
      .get();
    
    friendRefs.docs.forEach((doc) => {
      batch.delete(doc.ref);
      operationCount++;
    });
    logger.info(`✅ [${functionName}] Queued ${friendRefs.size} friend relationships for deletion`);

    // Commit the batch if there are operations
    if (operationCount > 0) {
      logger.info(`💾 [${functionName}] Committing batch with ${operationCount} operations...`);
      await batch.commit();
      logger.info(`✅ [${functionName}] Batch committed successfully`);
    } else {
      logger.info(`ℹ️ [${functionName}] No operations to commit`);
    }

    // Step 4: Delete user document and subcollections
    // Note: User subcollections will be automatically deleted by Firestore security rules
    // when the auth user is deleted, but we'll delete the main document here
    logger.info(`🔄 [${functionName}] Step 4: Deleting user document...`);
    
    const userRef = db.collection("users").doc(uid);
    await userRef.delete();
    logger.info(`✅ [${functionName}] User document deleted`);

    // Step 5: Clean up rate limits
    logger.info(`🔄 [${functionName}] Step 5: Cleaning up rate limits...`);
    
    const rateLimitRef = db.collection("rateLimits").doc(uid);
    await rateLimitRef.delete();
    logger.info(`✅ [${functionName}] Rate limit data deleted`);

    const duration = Date.now() - startTime;
    logger.info(`✅ [${functionName}] Cascading delete completed successfully`);
    logger.info(`📊 [${functionName}] Total operations: ${operationCount}`);
    logger.info(`⏱️ [${functionName}] Execution time: ${duration}ms`);
    logger.info("═".repeat(60));
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`❌ [${functionName}] Error during cascading delete:`, {
      error: error.message,
      errorStack: error.stack,
      uid,
    });
    logger.info(`⏱️ [${functionName}] Execution time before failure: ${duration}ms`);
    logger.info("═".repeat(60));
    
    // Don't throw - allow user deletion to proceed even if cleanup fails
    // This prevents users from being stuck if cleanup fails
    logger.warn(`⚠️ [${functionName}] User deletion will proceed despite cleanup failure`);
  }
});
