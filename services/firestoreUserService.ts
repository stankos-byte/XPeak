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
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  authProvider: AuthProvider;
  totalXP: number;
  level: number;
  identity: string;
  skills: Record<SkillCategory, FirestoreSkillData>;
  goals: Goal[];
  templates: TaskTemplate[];
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
 * Create a new user document in Firestore
 * 
 * IMPORTANT: Uses doc() with user.uid to create a document with a specific ID.
 * This ensures the document ID matches the Firebase Auth UID, making it:
 * - Unique per user (Firebase Auth UIDs are globally unique)
 * - Easy to look up (no need to query, just use fbPaths.userDoc(uid))
 * - Consistent with security rules (request.auth.uid == userId)
 */
const createUserDocument = async (user: User): Promise<FirestoreUserDocument> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  // Uses centralized path service for consistent path management
  const userRef = fbPaths.userDoc(user.uid);
  
  const newUserData: FirestoreUserDocument = {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || 'Protocol-01',
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    authProvider: getAuthProvider(user),
    totalXP: 0,
    level: 0,
    identity: '',
    skills: getDefaultSkills(),
    goals: [],
    templates: [],
    layout: DEFAULT_LAYOUT,
    settings: DEFAULT_SETTINGS
  };

  await setDoc(userRef, newUserData);
  console.log('✅ Created new user document in Firestore:', user.uid);
  
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

  const userRef = fbPaths.userDoc(uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as FirestoreUserDocument;
  }
  
  return null;
};

/**
 * Ensure user document exists in Firestore
 * - Creates new document if user is signing in for the first time
 * - Updates lastLoginAt if user already exists
 * 
 * @param user Firebase Auth user object
 * @returns The user document (newly created or existing)
 */
export const ensureUserDocument = async (user: User): Promise<FirestoreUserDocument | null> => {
  if (!db) {
    console.warn('Firestore is not initialized - skipping user document creation');
    return null;
  }

  try {
    const existingUser = await getUserDocument(user.uid);
    
    if (existingUser) {
      // User exists, update last login
      await updateLastLogin(user.uid);
      return existingUser;
    } else {
      // New user, create document
      return await createUserDocument(user);
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
 * Delete all user data from Firestore
 * This deletes:
 * - All documents in user subcollections (tasks, quests, history, etc.)
 * - The user document itself
 */
export const deleteUserData = async (uid: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  console.log('🗑️ Starting user data deletion for:', uid);

  // List of all subcollections to delete
  const subcollections = [
    'tasks',
    'quests', 
    'history',
    'archivedHistory',
    'oracleChat',
    'friends',
    'activeChallenges'
  ];

  // Delete all documents in each subcollection
  for (const subcollectionName of subcollections) {
    try {
      const subcollectionRef = fbPaths.tasksCollection(uid).parent
        ? doc(db, COLLECTIONS.USERS, uid).collection 
        : null;
      
      // Get the subcollection reference using the db directly
      const { collection: firestoreCollection } = await import('firebase/firestore');
      const subcollRef = firestoreCollection(db, COLLECTIONS.USERS, uid, subcollectionName);
      const snapshot = await getDocs(subcollRef);
      
      // Delete each document in the subcollection
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${snapshot.docs.length} documents from ${subcollectionName}`);
    } catch (error) {
      console.warn(`⚠️ Error deleting subcollection ${subcollectionName}:`, error);
      // Continue with other subcollections even if one fails
    }
  }

  // Delete the user document itself
  const userRef = fbPaths.userDoc(uid);
  await deleteDoc(userRef);
  console.log('✅ Deleted user document for:', uid);
};
