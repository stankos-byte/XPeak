/**
 * Firebase Configuration
 * 
 * Initializes Firebase app, auth, and firestore instances.
 * Uses environment variables from .env.local for configuration.
 * 
 * Make sure to set up your .env.local file with:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

const isFirebaseConfigured = missingVars.length === 0;

if (missingVars.length > 0 && import.meta.env.DEV) {
  console.warn(
    `⚠️ Missing Firebase environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env.local file with your Firebase configuration.\n` +
    `See FIREBASE_SETUP.md for instructions.\n` +
    `The app will run in limited mode without Firebase.`
  );
}

// Initialize Firebase app only if configuration is valid
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    if (import.meta.env.DEV) {
      console.warn('App will continue without Firebase functionality.');
    }
  }
} else {
  if (import.meta.env.DEV) {
    console.warn('Firebase is not configured. Some features will be unavailable.');
  }
}

// Export Firebase services (may be null if not configured)
export { auth, db };
export const isFirebaseReady = isFirebaseConfigured && app !== null;

// Export the app instance (needed for Cloud Functions)
export default app;
