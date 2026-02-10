/**
 * Firestore User Service
 * 
 * Handles user document creation and management in Firestore.
 * Creates user documents on first sign-in and updates lastLoginAt on subsequent sign-ins.
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { SkillCategory, ProfileLayout, Goal, TaskTemplate } from '../types';
import { fbPaths, COLLECTIONS } from './firebasePaths';

// Auth provider types
type AuthProvider = 'google' | 'email' | 'apple';

// Theme types
type Theme = 'dark' | 'light';

// Notification settings
interface NotificationSettings {
  deepWorkMode: boolean;
  contractUpdates: boolean;
  levelUps: boolean;
}

// User settings
interface UserSettings {
  theme: Theme;
  notifications: NotificationSettings;
}

// Simplified skill data for Firestore (no redundant category field)
export interface FirestoreSkillData {
  xp: number;
  level: number;
}

// Full Firestore user document type
export interface FirestoreUserDocument {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  authProvider: AuthProvider;
  totalXP: number;
  level: number;
  identity: string;
  skills: Record<SkillCategory, FirestoreSkillData>;
  // goals and templates moved to subcollections for scalability
  layout: ProfileLayout;
  settings: UserSettings;
}

// Default layout configuration
const DEFAULT_LAYOUT: ProfileLayout = {
  widgets: [
    { id: 'identity', enabled: true, order: 0 },
    { id: 'skillMatrix', enabled: true, order: 1 },
    { id: 'evolution', enabled: true, order: 2 },
    { id: 'calendar', enabled: true, order: 3 },
    { id: 'friends', enabled: true, order: 4 },
    { id: 'tasks', enabled: true, order: 5 }
  ]
};

// Default user settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  notifications: {
    deepWorkMode: false,
    contractUpdates: true,
    levelUps: true
  }
};

// Initialize default skills with 0 XP for all categories (without redundant category field)
const getDefaultSkills = (): Record<SkillCategory, FirestoreSkillData> => {
  const skills = {} as Record<SkillCategory, FirestoreSkillData>;
  Object.values(SkillCategory).forEach(category => {
    skills[category] = {
      xp: 0,
      level: 0
    };
  });
  return skills;
};

/**
 * Determine auth provider from Firebase User object
 */
const getAuthProvider = (user: User): AuthProvider => {
  const providerData = user.providerData;
  if (providerData.length > 0) {
    const providerId = providerData[0].providerId;
    if (providerId === 'google.com') return 'google';
    if (providerId === 'apple.com') return 'apple';
  }
  return 'email';
};

/**
 * Generate a nickname from user data
 * Priority: custom nickname > displayName > email prefix > generated default
 */
const generateNickname = (user: User, customNickname?: string): string => {
  // 1. Use custom nickname if provided
  if (customNickname && customNickname.trim()) {
    return customNickname.trim();
  }
  
  // 2. Use displayName if available (from OAuth)
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  
  // 3. Use email prefix if available
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix) {
      return emailPrefix;
    }
  }
  
  // 4. Generate default with random digits
  return `Agent-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

/**
 * Create a new user document in Firestore
 * 
 * IMPORTANT: Uses doc() with user.uid to create a document with a specific ID.
 * This ensures the document ID matches the Firebase Auth UID, making it:
 * - Unique per user (Firebase Auth UIDs are globally unique)
 * - Easy to look up (no need to query, just use fbPaths.userDoc(uid))
 * - Consistent with security rules (request.auth.uid == userId)
 */
const createUserDocument = async (user: User, customNickname?: string): Promise<FirestoreUserDocument> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  // Uses centralized path service for consistent path management
  const userRef = fbPaths.userDoc(user.uid);
  
  const newUserData: FirestoreUserDocument = {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || 'Protocol-01',
    nickname: generateNickname(user, customNickname),
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    authProvider: getAuthProvider(user),
    totalXP: 0,
    level: 0,
    identity: '',
    skills: getDefaultSkills(),
    // goals and templates are now in subcollections
    layout: DEFAULT_LAYOUT,
    settings: DEFAULT_SETTINGS
  };

  console.log('📝 Attempting to write user document to Firestore for:', user.uid);
  
  try {
    await setDoc(userRef, newUserData);
    console.log('✅ Created new user document in Firestore:', user.uid);
  } catch (error) {
    console.error('❌ Failed to create user document:', error);
    throw error;
  }
  
  return newUserData;
};

/**
 * Update lastLoginAt and updatedAt for existing user
 */
const updateLastLogin = async (uid: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  console.log('✅ Updated lastLoginAt for user:', uid);
};

/**
 * Get user document from Firestore
 */
export const getUserDocument = async (uid: string): Promise<FirestoreUserDocument | null> => {
  if (!db) {
    console.warn('Firestore is not initialized');
    return null;
  }

  console.log('📖 Attempting to read user document from Firestore for:', uid);
  
  try {
    const userRef = fbPaths.userDoc(uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('✅ User document read successfully');
      return userSnap.data() as FirestoreUserDocument;
    }
    
    console.log('📭 User document does not exist');
    return null;
  } catch (error) {
    console.error('❌ Failed to read user document:', error);
    throw error;
  }
};

/**
 * Ensure user document exists in Firestore
 * - Creates new document if user is signing in for the first time
 * - Updates lastLoginAt if user already exists
 * 
 * @param user Firebase Auth user object
 * @param customNickname Optional custom nickname for new users
 * @returns The user document (newly created or existing)
 */
export const ensureUserDocument = async (user: User, customNickname?: string): Promise<FirestoreUserDocument | null> => {
  if (!db) {
    console.warn('Firestore is not initialized - skipping user document creation');
    return null;
  }

  console.log('🔍 Checking if user document exists for:', user.uid);
  
  try {
    const existingUser = await getUserDocument(user.uid);
    
    if (existingUser) {
      console.log('✅ User document found, updating lastLoginAt');
      // User exists, update last login
      await updateLastLogin(user.uid);
      return existingUser;
    } else {
      console.log('📝 User document NOT found, creating new document');
      // New user, create document with optional custom nickname
      return await createUserDocument(user, customNickname);
    }
  } catch (error) {
    console.error('Error ensuring user document:', error);
    throw error;
  }
};

/**
 * Check if a user document exists
 */
export const userDocumentExists = async (uid: string): Promise<boolean> => {
  const userDoc = await getUserDocument(uid);
  return userDoc !== null;
};

/**
 * Update user nickname in Firestore
 * @param uid User ID
 * @param nickname New nickname to set
 */
export const updateUserNickname = async (uid: string, nickname: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const userRef = fbPaths.userDoc(uid);
  await updateDoc(userRef, {
    nickname: nickname.trim(),
    updatedAt: serverTimestamp()
  });
  console.log('✅ Updated nickname for user:', uid);
};

/**
 * Delete all user data from Firestore
 * This deletes:
 * - All documents in user subcollections (tasks, quests, history, etc.)
 * - The user document itself
 * Uses paginated deletion to handle collections with >500 documents
 */
export const deleteUserData = async (uid: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  console.log('🗑️ Starting user data deletion for:', uid);

  // Import deletePaginated function
  const { deletePaginated } = await import('./firestoreDataService');

  // List of all subcollections to delete with their references
  const subcollections = [
    { ref: fbPaths.tasksCollection(uid), name: 'tasks' },
    { ref: fbPaths.questsCollection(uid), name: 'quests' },
    { ref: fbPaths.historyCollection(uid), name: 'history' },
    { ref: fbPaths.archivedHistoryCollection(uid), name: 'archivedHistory' },
    { ref: fbPaths.oracleChatCollection(uid), name: 'oracleChat' },
    { ref: fbPaths.friendsCollection(uid), name: 'friends' },
    { ref: fbPaths.activeChallengesCollection(uid), name: 'activeChallenges' },
    { ref: fbPaths.goalsCollection(uid), name: 'goals' },
    { ref: fbPaths.templatesCollection(uid), name: 'templates' },
  ];

  // Delete all documents in each subcollection with pagination
  for (const { ref: collectionRef, name } of subcollections) {
    try {
      const deleted = await deletePaginated(collectionRef);
      if (deleted > 0) {
        console.log(`✅ Deleted ${deleted} documents from ${name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error deleting subcollection ${name}:`, error);
      // Continue with other subcollections even if one fails
    }
  }

  // Delete the user document itself
  const userRef = fbPaths.userDoc(uid);
  await deleteDoc(userRef);
  console.log('✅ Deleted user document for:', uid);
};
