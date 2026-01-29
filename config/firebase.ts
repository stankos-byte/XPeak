// Firebase SDK Configuration
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

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

// Check if we should use Firebase Emulators
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

// Emulator configuration
const EMULATOR_CONFIG = {
  auth: {
    host: '127.0.0.1',
    port: 9099,
  },
  firestore: {
    host: '127.0.0.1',
    port: 8080,
  },
  functions: {
    host: '127.0.0.1',
    port: 5001,
  },
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

// Track if emulators have been connected (to prevent duplicate connections)
let emulatorsConnected = false;

if (isFirebaseConfigured()) {
  // Check if Firebase is already initialized
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  // Connect to emulators if enabled (only once)
  if (useEmulators && !emulatorsConnected) {
    try {
      // Connect Auth emulator
      if (auth) {
        connectAuthEmulator(auth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`, {
          disableWarnings: true,
        });
        console.log('🔧 Connected to Auth Emulator');
      }

      // Connect Firestore emulator
      if (db) {
        connectFirestoreEmulator(db, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
        console.log('🔧 Connected to Firestore Emulator');
      }

      // Connect Functions emulator
      if (functions) {
        connectFunctionsEmulator(functions, EMULATOR_CONFIG.functions.host, EMULATOR_CONFIG.functions.port);
        console.log('🔧 Connected to Functions Emulator');
      }

      emulatorsConnected = true;
      console.log('🎮 Firebase Emulators connected. Access UI at http://127.0.0.1:4000');
    } catch (error) {
      console.warn('Failed to connect to Firebase Emulators:', error);
    }
  }
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
export { app, auth, db, functions, isFirebaseConfigured, useEmulators };

// Type exports for convenience
export type { FirebaseApp, Auth, Firestore, Functions };
