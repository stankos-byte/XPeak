// Firebase SDK Configuration
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that Firebase config is present
const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase app (only once)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

if (isFirebaseConfigured()) {
  // Check if Firebase is already initialized
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  console.warn(
    'Firebase is not configured. Please set up your environment variables.\n' +
    'Required variables:\n' +
    '  - VITE_FIREBASE_API_KEY\n' +
    '  - VITE_FIREBASE_AUTH_DOMAIN\n' +
    '  - VITE_FIREBASE_PROJECT_ID\n' +
    '  - VITE_FIREBASE_STORAGE_BUCKET\n' +
    '  - VITE_FIREBASE_MESSAGING_SENDER_ID\n' +
    '  - VITE_FIREBASE_APP_ID'
  );
}

// Export Firebase services
export { app, auth, db, functions, isFirebaseConfigured };

// Type exports for convenience
export type { FirebaseApp, Auth, Firestore, Functions };
