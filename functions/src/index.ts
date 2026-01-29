/**
 * Firebase Cloud Functions v2 for XPeak
 * 
 * This file contains all Cloud Functions for the XPeak gamification platform.
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeApp();

// Get Firestore instance
const db = getFirestore();

// Set global options for all functions
// For cost control, limit the maximum number of containers
setGlobalOptions({ maxInstances: 10 });

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

interface SkillProgress {
  category: SkillCategory;
  xp: number;
  level: number;
}

interface SkillsMap {
  [key: string]: SkillProgress;
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
 * Creates the default skills map with all categories at level 1, 0 XP
 */
function createDefaultSkills(): SkillsMap {
  const skills: SkillsMap = {};
  
  Object.values(SkillCategory).forEach((category) => {
    skills[category] = {
      category: category as SkillCategory,
      xp: 0,
      level: 1,
    };
  });
  
  return skills;
}

/**
 * Creates the default profile layout with all widgets enabled
 */
function createDefaultLayout(): ProfileLayout {
  const widgetIds: WidgetId[] = ["identity", "skillMatrix", "evolution", "tasks", "calendar", "friends"];
  
  return {
    widgets: widgetIds.map((id, index) => ({
      id,
      enabled: true,
      order: index,
    })),
  };
}

/**
 * Creates the default user settings
 */
function createDefaultSettings(): UserSettings {
  return {
    theme: Theme.DARK,
    notifications: {
      deepWorkMode: false,
      contractUpdates: true,
      levelUps: true,
    },
  };
}

/**
 * Determines the auth provider from the provider data
 */
function getAuthProvider(providerData: Array<{ providerId: string }> | undefined): AuthProvider {
  if (!providerData || providerData.length === 0) {
    return AuthProvider.EMAIL;
  }
  
  const providerId = providerData[0].providerId;
  
  if (providerId === "google.com") {
    return AuthProvider.GOOGLE;
  } else if (providerId === "apple.com") {
    return AuthProvider.APPLE;
  }
  
  return AuthProvider.EMAIL;
}

/**
 * Extracts a display name from email if no display name is provided
 */
function getDisplayName(displayName: string | undefined, email: string | undefined): string {
  if (displayName) {
    return displayName;
  }
  
  if (email) {
    // Extract the part before @ as the display name
    return email.split("@")[0];
  }
  
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
  const user = event.data;
  
  logger.info("New user creation triggered", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });
  
  try {
    // Determine auth provider
    const authProvider = getAuthProvider(user.providerData);
    
    // Get display name (fallback to email prefix)
    const displayName = getDisplayName(user.displayName, user.email);
    
    // Create the initial user document
    const userDocument = {
      uid: user.uid,
      email: user.email || "",
      name: displayName,
      photoURL: user.photoURL || null,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      authProvider: authProvider,
      totalXP: 0,
      level: 1,
      identity: "",
      skills: createDefaultSkills(),
      goals: [],
      templates: [],
      layout: createDefaultLayout(),
      settings: createDefaultSettings(),
    };
    
    // Create the user document in Firestore
    await db.collection("users").doc(user.uid).set(userDocument);
    
    logger.info("Successfully created user document", {
      uid: user.uid,
      authProvider: authProvider,
    });
    
    // Return nothing to allow the user creation to proceed
    return;
  } catch (error) {
    logger.error("Error creating user document", {
      uid: user.uid,
      error: error,
    });
    
    // Don't throw - allow user creation to proceed even if Firestore fails
    // The document can be created later on first login
    return;
  }
});

/**
 * Alternative: Use Auth onCreate trigger (runs after user creation)
 * This is a backup in case beforeUserCreated doesn't work as expected
 * 
 * Uncomment this if you prefer post-creation initialization:
 */
// import { onCall } from "firebase-functions/v2/https";
// import { auth } from "firebase-functions/v1";
// 
// export const onUserCreateV1 = auth.user().onCreate(async (user) => {
//   // Same logic as above
// });
