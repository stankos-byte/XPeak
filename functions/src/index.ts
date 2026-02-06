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
import {GoogleGenerativeAI, SchemaType} from "@google/generative-ai";
import {Polar} from "@polar-sh/sdk";
import {Webhook} from "svix";
import {RateLimiter} from "limiter";

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

// ==========================================
// Rate Limiting
// ==========================================

// Rate limiters per user (10 requests per minute)
const rateLimiters = new Map<string, RateLimiter>();

// Daily quotas stored in memory (resets on cold start)
interface UserQuota {
  used: number;
  resetAt: Date;
}
const dailyQuotas = new Map<string, UserQuota>();

/**
 * Check if a user has exceeded rate limits
 * @param uid User ID
 * @returns Object indicating if request is allowed and error message if not
 */
function checkRateLimit(uid: string): { allowed: boolean; error?: string } {
  // Check per-minute rate limit (10 requests per minute)
  if (!rateLimiters.has(uid)) {
    rateLimiters.set(uid, new RateLimiter({tokensPerInterval: 10, interval: "minute"}));
  }

  const limiter = rateLimiters.get(uid)!;
  if (!limiter.tryRemoveTokens(1)) {
    return {
      allowed: false,
      error: "Rate limit exceeded. Maximum 10 requests per minute. Please try again later.",
    };
  }

  // Check daily quota (100 requests per day)
  const now = new Date();
  const quota = dailyQuotas.get(uid);

  if (!quota || quota.resetAt < now) {
    // Reset quota for new day
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    dailyQuotas.set(uid, {used: 1, resetAt: tomorrow});
    return {allowed: true};
  }

  if (quota.used >= 100) {
    const hoursUntilReset = Math.ceil((quota.resetAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return {
      allowed: false,
      error: `Daily quota exceeded. Maximum 100 AI requests per day. Resets in ${hoursUntilReset} hours.`,
    };
  }

  quota.used++;
  return {allowed: true};
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

    // Step 2: Get display name (fallback to email prefix)
    logger.info(`🔄 [${functionName}] Step 2/5: Resolving display name...`);
    const displayName = getDisplayName(user.displayName, user.email);
    logger.info(`✅ [${functionName}] Step 2/5 complete: Display name = "${displayName}"`);

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
    enforceAppCheck: false, // Set to true in production with App Check
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

      // Step 3: Update Firestore based on event type
      logger.info(`💾 [${functionName}] Step 3: Updating Firestore...`);

      const subscriptionRef = db
        .collection("users")
        .doc(userId)
        .collection("subscription")
        .doc("current");

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

      case "subscription.canceled": {
        logger.info(`✅ [${functionName}] Processing subscription.canceled event`);

        const updateData = {
          status: "canceled",
          plan: "free",
          cancelAtPeriodEnd: false,
          updatedAt: FieldValue.serverTimestamp(),
        };

        await subscriptionRef.update(updateData);

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

      const totalTime = Date.now() - startTime;

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] WEBHOOK PROCESSED SUCCESSFULLY`);
      logger.info("─".repeat(60));
      logger.info(`📤 [${functionName}] Summary:`, {
        eventType,
        userId,
        totalExecutionTimeMs: totalTime,
      });
      logger.info("═".repeat(60));

      res.status(200).send("Webhook processed");
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
    enforceAppCheck: false,
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
    enforceAppCheck: false,
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
    enforceAppCheck: false,
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
      // Note: This is a placeholder - actual Polar API method may differ
      // Check Polar SDK documentation for the correct method to fetch invoices
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
    enforceAppCheck: false, // Set to true in production with App Check
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

    const rateLimitResult = checkRateLimit(request.auth.uid);
    if (!rateLimitResult.allowed) {
      logger.error(`❌ [${functionName}] Rate limit exceeded for user: ${request.auth.uid}`);
      logger.error(`❌ [${functionName}] ${rateLimitResult.error}`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (RATE LIMITED)`);
      throw new HttpsError("resource-exhausted", rateLimitResult.error!);
    }

    logger.info(`✅ [${functionName}] Rate limits passed`);

    // Step 3: Validate request parameters
    logger.info(`📥 [${functionName}] Step 3: Validating request parameters...`);

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

    // Step 4: Retrieve API key from secrets
    logger.info(`🔑 [${functionName}] Step 4: Retrieving Gemini API key from secrets...`);

    const apiKey = geminiApiKey.value();

    if (!apiKey) {
      logger.error(`❌ [${functionName}] API KEY NOT CONFIGURED`);
      logger.error(`❌ [${functionName}] The GEMINI_API_KEY secret is missing or empty`);
      logger.info(`⏱️ [${functionName}] Execution time: ${Date.now() - startTime}ms (CONFIG ERROR)`);
      throw new HttpsError("failed-precondition", "AI service is not configured. Please contact support.");
    }

    logger.info(`✅ [${functionName}] API key retrieved successfully (length: ${apiKey.length} chars)`);

    // Step 5: Initialize Gemini AI
    logger.info(`🤖 [${functionName}] Step 5: Initializing Google Generative AI client...`);

    const initStartTime = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({model: "gemini-pro"});

    logger.info(`✅ [${functionName}] Gemini AI client initialized`, {
      model: "gemini-pro",
      initTimeMs: Date.now() - initStartTime,
    });

    // Step 6: Route to appropriate handler
    logger.info(`🔄 [${functionName}] Step 6: Routing to action handler: "${action}"`);

    try {
      let result;
      const handlerStartTime = Date.now();

      switch (action) {
      case "generateQuest":
        logger.info(`📨 [${functionName}] Dispatching to handleGenerateQuest...`);
        result = await handleGenerateQuest(model, payload, requestId);
        break;

      case "analyzeTask":
        logger.info(`📨 [${functionName}] Dispatching to handleAnalyzeTask...`);
        result = await handleAnalyzeTask(model, payload, requestId);
        break;

      case "generateChatResponse":
        logger.info(`📨 [${functionName}] Dispatching to handleChatResponse...`);
        result = await handleChatResponse(model, payload, requestId);
        break;

      case "generateFollowUpResponse":
        logger.info(`📨 [${functionName}] Dispatching to handleFollowUpResponse...`);
        result = await handleFollowUpResponse(model, payload, requestId);
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
async function handleGenerateQuest(model: any, payload: { questTitle: string }, requestId: string) {
  const handlerName = "handleGenerateQuest";
  const startTime = Date.now();

  logger.info(`🎯 [${handlerName}] ══════════════════════════════════════`);
  logger.info(`🎯 [${handlerName}] BEGIN - Quest Generation Handler`);
  logger.info(`🆔 [${handlerName}] Request ID: ${requestId}`);
  logger.info(`🎯 [${handlerName}] ══════════════════════════════════════`);

  // Step 1: Validate input
  logger.info(`📥 [${handlerName}] Step 1: Validating input payload...`);

  const {questTitle} = payload;

  if (!questTitle) {
    logger.error(`❌ [${handlerName}] Validation FAILED - Missing questTitle`);
    logger.error(`❌ [${handlerName}] Payload received:`, {payload});
    throw new HttpsError("invalid-argument", "Missing questTitle");
  }

  logger.info(`✅ [${handlerName}] Input validated`, {
    questTitle: questTitle,
    titleLength: questTitle.length,
  });

  // Step 2: Construct prompt
  logger.info(`📝 [${handlerName}] Step 2: Constructing AI prompt...`);

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

  logger.info(`✅ [${handlerName}] Prompt constructed`, {
    promptLength: prompt.length,
    questTitle: questTitle,
  });

  // Step 3: Call Gemini API
  logger.info(`🤖 [${handlerName}] Step 3: Calling Gemini API...`);
  logger.info(`📨 [${handlerName}] Sending request to model.generateContent()`);

  const apiStartTime = Date.now();
  const result = await model.generateContent(prompt);
  const apiTime = Date.now() - apiStartTime;

  logger.info(`✅ [${handlerName}] Gemini API response received`, {
    apiResponseTimeMs: apiTime,
  });

  // Step 4: Extract response text
  logger.info(`📥 [${handlerName}] Step 4: Extracting response text...`);

  const response = result.response;
  const text = response.text();

  logger.info(`✅ [${handlerName}] Response text extracted`, {
    responseLength: text.length,
    previewFirst100: text.substring(0, 100) + "...",
  });

  // Step 5: Parse JSON response
  logger.info(`🔄 [${handlerName}] Step 5: Parsing JSON response...`);

  try {
    // Clean up the response (remove markdown code blocks if present)
    logger.info(`🔄 [${handlerName}] Cleaning response text (removing markdown artifacts)...`);

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    logger.info(`📝 [${handlerName}] Cleaned text prepared for parsing`, {
      originalLength: text.length,
      cleanedLength: cleanedText.length,
    });

    const categories = JSON.parse(cleanedText);

    logger.info(`✅ [${handlerName}] JSON parsed successfully`, {
      categoryCount: categories.length,
      categories: categories.map((c: any) => ({
        title: c.title,
        taskCount: c.tasks?.length || 0,
      })),
    });

    // Calculate total tasks
    const totalTasks = categories.reduce((sum: number, cat: any) => sum + (cat.tasks?.length || 0), 0);
    const totalTime = Date.now() - startTime;

    logger.info(`🎯 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`✅ [${handlerName}] QUEST GENERATION COMPLETE`);
    logger.info(`🎯 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`📤 [${handlerName}] Result summary:`, {
      questTitle: questTitle,
      categoriesGenerated: categories.length,
      totalTasksGenerated: totalTasks,
      apiTimeMs: apiTime,
      totalHandlerTimeMs: totalTime,
    });

    return {success: true, data: categories};
  } catch (parseError) {
    const totalTime = Date.now() - startTime;

    logger.error(`❌ [${handlerName}] JSON PARSE FAILED`);
    logger.error(`❌ [${handlerName}] Parse error details:`, {
      errorMessage: (parseError as Error).message,
      rawResponseLength: text.length,
    });
    logger.error(`❌ [${handlerName}] Raw response that failed to parse:`, {
      rawResponse: text.substring(0, 500) + (text.length > 500 ? "... (truncated)" : ""),
    });
    logger.info(`⏱️ [${handlerName}] Handler time before failure: ${totalTime}ms`);

    throw new HttpsError("internal", "Failed to generate quest structure");
  }
}

/**
 * Handle task analysis for difficulty and category suggestion
 */
async function handleAnalyzeTask(model: any, payload: { taskTitle: string }, requestId: string) {
  const handlerName = "handleAnalyzeTask";
  const startTime = Date.now();

  logger.info(`🔍 [${handlerName}] ══════════════════════════════════════`);
  logger.info(`🔍 [${handlerName}] BEGIN - Task Analysis Handler`);
  logger.info(`🆔 [${handlerName}] Request ID: ${requestId}`);
  logger.info(`🔍 [${handlerName}] ══════════════════════════════════════`);

  // Step 1: Validate input
  logger.info(`📥 [${handlerName}] Step 1: Validating input payload...`);

  const {taskTitle} = payload;

  if (!taskTitle) {
    logger.error(`❌ [${handlerName}] Validation FAILED - Missing taskTitle`);
    logger.error(`❌ [${handlerName}] Payload received:`, {payload});
    throw new HttpsError("invalid-argument", "Missing taskTitle");
  }

  logger.info(`✅ [${handlerName}] Input validated`, {
    taskTitle: taskTitle,
    titleLength: taskTitle.length,
  });

  // Step 2: Construct prompt
  logger.info(`📝 [${handlerName}] Step 2: Constructing AI prompt...`);

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

  logger.info(`✅ [${handlerName}] Prompt constructed`, {
    promptLength: prompt.length,
    taskTitle: taskTitle,
  });

  // Step 3: Call Gemini API
  logger.info(`🤖 [${handlerName}] Step 3: Calling Gemini API...`);
  logger.info(`📨 [${handlerName}] Sending request to model.generateContent()`);

  const apiStartTime = Date.now();
  const result = await model.generateContent(prompt);
  const apiTime = Date.now() - apiStartTime;

  logger.info(`✅ [${handlerName}] Gemini API response received`, {
    apiResponseTimeMs: apiTime,
  });

  // Step 4: Extract response text
  logger.info(`📥 [${handlerName}] Step 4: Extracting response text...`);

  const response = result.response;
  const text = response.text();

  logger.info(`✅ [${handlerName}] Response text extracted`, {
    responseLength: text.length,
    previewFirst100: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
  });

  // Step 5: Parse JSON response
  logger.info(`🔄 [${handlerName}] Step 5: Parsing JSON response...`);

  try {
    logger.info(`🔄 [${handlerName}] Cleaning response text (removing markdown artifacts)...`);

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    logger.info(`📝 [${handlerName}] Cleaned text prepared for parsing`, {
      originalLength: text.length,
      cleanedLength: cleanedText.length,
    });

    const analysis = JSON.parse(cleanedText);

    const totalTime = Date.now() - startTime;

    logger.info(`🔍 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`✅ [${handlerName}] TASK ANALYSIS COMPLETE`);
    logger.info(`🔍 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`📤 [${handlerName}] Analysis result:`, {
      taskTitle: taskTitle,
      suggestedDifficulty: analysis.difficulty,
      suggestedCategory: analysis.skillCategory,
      descriptionLength: analysis.suggestedDescription?.length || 0,
      apiTimeMs: apiTime,
      totalHandlerTimeMs: totalTime,
    });

    return {success: true, data: analysis};
  } catch (parseError) {
    const totalTime = Date.now() - startTime;

    logger.error(`❌ [${handlerName}] JSON PARSE FAILED`);
    logger.error(`❌ [${handlerName}] Parse error details:`, {
      errorMessage: (parseError as Error).message,
      rawResponseLength: text.length,
    });
    logger.error(`❌ [${handlerName}] Raw response that failed to parse:`, {
      rawResponse: text.substring(0, 500) + (text.length > 500 ? "... (truncated)" : ""),
    });
    logger.info(`⏱️ [${handlerName}] Handler time before failure: ${totalTime}ms`);

    throw new HttpsError("internal", "Failed to analyze task");
  }
}

/**
 * Handle chat response generation with function calling
 */
async function handleChatResponse(model: any, payload: {
  messages: any[];
  userInput: string;
  systemPrompt: string;
  tools: any[];
}, requestId: string) {
  const handlerName = "handleChatResponse";
  const startTime = Date.now();

  logger.info(`💬 [${handlerName}] ══════════════════════════════════════`);
  logger.info(`💬 [${handlerName}] BEGIN - Chat Response Handler`);
  logger.info(`🆔 [${handlerName}] Request ID: ${requestId}`);
  logger.info(`💬 [${handlerName}] ══════════════════════════════════════`);

  // Step 1: Extract and validate payload
  logger.info(`📥 [${handlerName}] Step 1: Extracting and validating payload...`);

  const {messages, userInput, systemPrompt, tools} = payload;

  logger.info(`📝 [${handlerName}] Payload contents:`, {
    messageCount: messages?.length || 0,
    userInputLength: userInput?.length || 0,
    hasSystemPrompt: !!systemPrompt,
    systemPromptLength: systemPrompt?.length || 0,
    toolCount: tools?.length || 0,
    toolNames: tools?.map((t) => t.name) || [],
  });

  if (!userInput) {
    logger.error(`❌ [${handlerName}] Validation FAILED - Missing userInput`);
    throw new HttpsError("invalid-argument", "Missing userInput");
  }

  logger.info(`✅ [${handlerName}] Payload validated successfully`);
  logger.info(
    `📝 [${handlerName}] User input preview: ` +
    `"${userInput.substring(0, 100)}${userInput.length > 100 ? "..." : ""}"`
  );

  // Step 2: Convert tools to Gemini format
  logger.info(`🔄 [${handlerName}] Step 2: Converting tools to Gemini format...`);

  const geminiTools = tools && tools.length > 0 ? [{
    functionDeclarations: tools.map((tool) => {
      logger.info(`  🔧 [${handlerName}] Converting tool: ${tool.name}`);
      return {
        name: tool.name,
        description: tool.description,
        parameters: convertToGeminiSchema(tool.parameters),
      };
    }),
  }] : undefined;

  if (geminiTools) {
    logger.info(`✅ [${handlerName}] Tools converted successfully`, {
      functionCount: geminiTools[0].functionDeclarations.length,
    });
  } else {
    logger.info(`⚠️ [${handlerName}] No tools provided - chat will run without function calling`);
  }

  // Step 3: Build chat history
  logger.info(`🔄 [${handlerName}] Step 3: Building chat history...`);

  const history = messages.map((msg, index) => {
    const formattedMsg = {
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.text || ""}],
    };
    logger.info(
      `  📜 [${handlerName}] Message ${index + 1}: ` +
      `role="${formattedMsg.role}", length=${msg.text?.length || 0}`
    );
    return formattedMsg;
  });

  logger.info(`✅ [${handlerName}] Chat history built`, {
    totalMessages: history.length,
  });

  // Step 4: Create chat session
  logger.info(`🤖 [${handlerName}] Step 4: Creating chat session...`);

  const effectiveSystemPrompt = systemPrompt || ASSISTANT_SYSTEM_PROMPT;
  logger.info(
    `📝 [${handlerName}] Using ${systemPrompt ? "custom" : "default"} ` +
    `system prompt (${effectiveSystemPrompt.length} chars)`
  );

  const chat = model.startChat({
    history,
    systemInstruction: effectiveSystemPrompt,
    tools: geminiTools,
  });

  logger.info(`✅ [${handlerName}] Chat session created successfully`);

  // Step 5: Send message and get response
  logger.info(`📨 [${handlerName}] Step 5: Sending message to Gemini...`);
  logger.info(`📨 [${handlerName}] Message: "${userInput.substring(0, 50)}${userInput.length > 50 ? "..." : ""}"`);

  const apiStartTime = Date.now();
  const result = await chat.sendMessage(userInput);
  const apiTime = Date.now() - apiStartTime;
  const response = result.response;

  logger.info(`✅ [${handlerName}] Gemini response received`, {
    apiResponseTimeMs: apiTime,
    hasCandidates: !!response.candidates,
    candidateCount: response.candidates?.length || 0,
  });

  // Step 6: Check for function calls
  logger.info(`🔄 [${handlerName}] Step 6: Checking for function calls...`);

  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    logger.info(`🔧 [${handlerName}] FUNCTION CALLS DETECTED`, {
      functionCallCount: functionCalls.length,
    });

    const formattedCalls = functionCalls.map((fc: any, index: number) => {
      const formattedCall = {
        id: `call_${index}`,
        name: fc.name,
        args: fc.args,
      };
      logger.info(`  📞 [${handlerName}] Function call ${index + 1}:`, {
        id: formattedCall.id,
        name: formattedCall.name,
        argKeys: Object.keys(fc.args || {}),
      });
      return formattedCall;
    });

    const totalTime = Date.now() - startTime;

    logger.info(`💬 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`✅ [${handlerName}] CHAT RESPONSE COMPLETE (with function calls)`);
    logger.info(`💬 [${handlerName}] ──────────────────────────────────────`);
    logger.info(`📤 [${handlerName}] Response summary:`, {
      responseType: "function_calls",
      functionCallCount: formattedCalls.length,
      functionNames: formattedCalls.map((fc: any) => fc.name),
      apiTimeMs: apiTime,
      totalHandlerTimeMs: totalTime,
    });

    return {
      success: true,
      data: {
        functionCalls: formattedCalls,
        candidates: response.candidates,
      },
    };
  }

  // Step 7: Extract text response
  logger.info(`📝 [${handlerName}] Step 7: Extracting text response...`);

  const responseText = response.text();
  const totalTime = Date.now() - startTime;

  logger.info(`💬 [${handlerName}] ──────────────────────────────────────`);
  logger.info(`✅ [${handlerName}] CHAT RESPONSE COMPLETE (text response)`);
  logger.info(`💬 [${handlerName}] ──────────────────────────────────────`);
  logger.info(`📤 [${handlerName}] Response summary:`, {
    responseType: "text",
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 100) + (responseText.length > 100 ? "..." : ""),
    apiTimeMs: apiTime,
    totalHandlerTimeMs: totalTime,
  });

  return {
    success: true,
    data: {
      text: responseText,
      candidates: response.candidates,
    },
  };
}

/**
 * Handle follow-up response after function execution
 */
async function handleFollowUpResponse(model: any, payload: {
  messages: any[];
  userInput: string;
  systemPrompt: string;
  previousResponse: any;
  functionResponses: any[];
}, requestId: string) {
  const handlerName = "handleFollowUpResponse";
  const startTime = Date.now();

  logger.info(`🔄 [${handlerName}] ══════════════════════════════════════`);
  logger.info(`🔄 [${handlerName}] BEGIN - Follow-Up Response Handler`);
  logger.info(`🆔 [${handlerName}] Request ID: ${requestId}`);
  logger.info(`🔄 [${handlerName}] ══════════════════════════════════════`);

  // Step 1: Extract payload
  logger.info(`📥 [${handlerName}] Step 1: Extracting payload data...`);

  const {messages, userInput, systemPrompt, previousResponse, functionResponses} = payload;

  logger.info(`📝 [${handlerName}] Payload contents:`, {
    messageCount: messages?.length || 0,
    userInputLength: userInput?.length || 0,
    hasSystemPrompt: !!systemPrompt,
    hasPreviousResponse: !!previousResponse,
    functionResponseCount: functionResponses?.length || 0,
  });

  // Step 2: Build base chat history
  logger.info(`🔄 [${handlerName}] Step 2: Building base chat history from messages...`);

  const history: any[] = messages.map((msg, index) => {
    const formattedMsg = {
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.text || ""}],
    };
    logger.info(`  📜 [${handlerName}] Base message ${index + 1}: role="${formattedMsg.role}"`);
    return formattedMsg;
  });

  logger.info(`✅ [${handlerName}] Base history built with ${history.length} messages`);

  // Step 3: Add user message that triggered function call
  logger.info(`🔄 [${handlerName}] Step 3: Adding user message that triggered function call...`);

  history.push({
    role: "user",
    parts: [{text: userInput}],
  });

  logger.info(`✅ [${handlerName}] User trigger message added`, {
    userInputPreview: userInput?.substring(0, 50) + (userInput?.length > 50 ? "..." : ""),
  });

  // Step 4: Add model's function call response
  logger.info(`🔄 [${handlerName}] Step 4: Adding model's previous function call response...`);

  if (previousResponse?.candidates?.[0]?.content) {
    history.push({
      role: "model",
      parts: previousResponse.candidates[0].content.parts,
    });
    logger.info(`✅ [${handlerName}] Previous model response added`, {
      partsCount: previousResponse.candidates[0].content.parts?.length || 0,
    });
  } else {
    logger.warn(`⚠️ [${handlerName}] No previous response content found to add`);
  }

  // Step 5: Add function responses
  logger.info(`🔄 [${handlerName}] Step 5: Processing function responses...`);

  if (functionResponses && functionResponses.length > 0) {
    logger.info(`📝 [${handlerName}] Processing ${functionResponses.length} function response(s):`);

    functionResponses.forEach((fr, index) => {
      logger.info(`  📞 [${handlerName}] Function response ${index + 1}:`, {
        functionName: fr.name,
        responseKeys: Object.keys(fr.response || {}),
        responsePreview: JSON.stringify(fr.response).substring(0, 100),
      });
    });

    const responseText = functionResponses.map((fr) =>
      `Function ${fr.name} result: ${JSON.stringify(fr.response)}`
    ).join("\n");

    history.push({
      role: "user",
      parts: [{text: responseText}],
    });

    logger.info(`✅ [${handlerName}] Function responses added to history`, {
      combinedResponseLength: responseText.length,
    });
  } else {
    logger.warn(`⚠️ [${handlerName}] No function responses provided`);
  }

  // Step 6: Create chat session
  logger.info(`🤖 [${handlerName}] Step 6: Creating chat session...`);

  const effectiveSystemPrompt = systemPrompt || ASSISTANT_SYSTEM_PROMPT;

  logger.info(`📝 [${handlerName}] Chat configuration:`, {
    historyLength: history.length,
    systemPromptType: systemPrompt ? "custom" : "default",
    systemPromptLength: effectiveSystemPrompt.length,
  });

  const chat = model.startChat({
    history,
    systemInstruction: effectiveSystemPrompt,
  });

  logger.info(`✅ [${handlerName}] Chat session created`);

  // Step 7: Send follow-up request
  logger.info(`📨 [${handlerName}] Step 7: Sending follow-up request to Gemini...`);
  logger.info(`📨 [${handlerName}] Requesting summary of completed actions...`);

  const apiStartTime = Date.now();
  const result = await chat.sendMessage("Please provide a summary of what was done.");
  const apiTime = Date.now() - apiStartTime;
  const response = result.response;

  logger.info(`✅ [${handlerName}] Gemini follow-up response received`, {
    apiResponseTimeMs: apiTime,
  });

  // Step 8: Extract and return response
  logger.info(`📥 [${handlerName}] Step 8: Extracting response text...`);

  const responseText = response.text();
  const totalTime = Date.now() - startTime;

  logger.info(`🔄 [${handlerName}] ──────────────────────────────────────`);
  logger.info(`✅ [${handlerName}] FOLLOW-UP RESPONSE COMPLETE`);
  logger.info(`🔄 [${handlerName}] ──────────────────────────────────────`);
  logger.info(`📤 [${handlerName}] Response summary:`, {
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 100) + (responseText.length > 100 ? "..." : ""),
    functionResponsesProcessed: functionResponses?.length || 0,
    apiTimeMs: apiTime,
    totalHandlerTimeMs: totalTime,
  });

  return {
    success: true,
    data: {
      text: responseText,
    },
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
  async (event) => {
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
      // Get all users
      const usersSnapshot = await db.collection("users").get();
      let totalDeleted = 0;
      let usersProcessed = 0;

      logger.info(`👥 [${functionName}] Found ${usersSnapshot.size} users to process`);

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const chatRef = db.collection("users").doc(uid).collection("oracleChat");

        // Query old messages (batch of 500)
        const oldMessagesQuery = chatRef
          .where("createdAt", "<", cutoffDate)
          .limit(500);

        const oldMessages = await oldMessagesQuery.get();

        if (!oldMessages.empty) {
          const batch = db.batch();
          oldMessages.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();

          totalDeleted += oldMessages.docs.length;
          logger.info(`✅ [${functionName}] Deleted ${oldMessages.docs.length} old messages for user: ${uid}`);
        }

        usersProcessed++;

        // Small delay every 10 users to avoid rate limits
        if (usersProcessed % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;

      logger.info("─".repeat(60));
      logger.info(`✅ [${functionName}] CLEANUP COMPLETE`);
      logger.info("─".repeat(60));
      logger.info(`📊 [${functionName}] Summary:`, {
        usersProcessed,
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
 * Convert tool parameters to Gemini schema format
 */
function convertToGeminiSchema(params: any): any {
  const helperName = "convertToGeminiSchema";

  logger.info(`🔧 [${helperName}] Converting parameters to Gemini schema format...`);

  if (!params) {
    logger.info(`⚠️ [${helperName}] No params provided, returning default OBJECT type`);
    return {type: SchemaType.OBJECT};
  }

  logger.info(`📝 [${helperName}] Input params type: ${params.type || "undefined"}`, {
    hasProperties: !!params.properties,
    propertyCount: params.properties ? Object.keys(params.properties).length : 0,
    hasRequired: !!params.required,
    requiredCount: params.required?.length || 0,
  });

  const convertType = (type: string): SchemaType => {
    const upperType = type?.toUpperCase();
    let result: SchemaType;

    switch (upperType) {
    case "STRING":
      result = SchemaType.STRING;
      break;
    case "NUMBER":
      result = SchemaType.NUMBER;
      break;
    case "BOOLEAN":
      result = SchemaType.BOOLEAN;
      break;
    case "ARRAY":
      result = SchemaType.ARRAY;
      break;
    case "OBJECT":
    default:
      result = SchemaType.OBJECT;
      break;
    }

    logger.info(`  🔄 [${helperName}] Type conversion: "${type}" → ${result}`);
    return result;
  };

  const convertSchema = (schema: any, depth = 0): any => {
    const indent = "  ".repeat(depth);

    if (!schema) {
      logger.info(`${indent}⚠️ [${helperName}] Empty schema at depth ${depth}`);
      return {};
    }

    const result: any = {
      type: convertType(schema.type),
    };

    if (schema.description) {
      result.description = schema.description;
      logger.info(`${indent}📝 [${helperName}] Added description: "${schema.description.substring(0, 30)}..."`);
    }

    if (schema.enum) {
      result.enum = schema.enum;
      logger.info(`${indent}📋 [${helperName}] Added enum values: [${schema.enum.join(", ")}]`);
    }

    if (schema.properties) {
      result.properties = {};
      const propKeys = Object.keys(schema.properties);
      logger.info(`${indent}🔄 [${helperName}] Processing ${propKeys.length} properties...`);

      for (const [key, value] of Object.entries(schema.properties)) {
        logger.info(`${indent}  ➕ [${helperName}] Converting property: "${key}"`);
        result.properties[key] = convertSchema(value, depth + 1);
      }
    }

    if (schema.items) {
      logger.info(`${indent}📦 [${helperName}] Processing array items schema...`);
      result.items = convertSchema(schema.items, depth + 1);
    }

    if (schema.required) {
      result.required = schema.required;
      logger.info(`${indent}⚠️ [${helperName}] Required fields: [${schema.required.join(", ")}]`);
    }

    return result;
  };

  const convertedSchema = convertSchema(params);

  logger.info(`✅ [${helperName}] Schema conversion complete`, {
    resultType: convertedSchema.type,
    resultPropertyCount: convertedSchema.properties ? Object.keys(convertedSchema.properties).length : 0,
  });

  return convertedSchema;
}
