// Firebase SDK Configuration
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// ==========================================
// Environment Variable Validation
// ==========================================

/**
 * Validates that all required Firebase environment variables are present.
 * Throws an error with a clear message if any are missing.
 */
function validateFirebaseConfig(): void {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ] as const;

  const missingVars: string[] = [];

  for (const varName of requiredEnvVars) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = [
      '🔥 Firebase Configuration Error',
      '================================',
      'Missing required environment variables:',
      ...missingVars.map(v => `  ❌ ${v}`),
      '',
      'Please ensure your .env file contains all required Firebase configuration values.',
      'You can find these values in your Firebase Console:',
      '  https://console.firebase.google.com/project/_/settings/general',
      '',
      'Example .env file:',
      '  VITE_FIREBASE_API_KEY=your-api-key',
      '  VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com',
      '  VITE_FIREBASE_PROJECT_ID=your-project-id',
      '  VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com',
      '  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789',
      '  VITE_FIREBASE_APP_ID=1:123456789:web:abcdef',
    ].join('\n');

    console.error(errorMessage);
    throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  }

  // Validate format of critical values
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string;

  if (apiKey.length < 20) {
    console.warn('⚠️ VITE_FIREBASE_API_KEY seems too short. Please verify your configuration.');
  }

  if (!/^[a-z0-9-]+$/.test(projectId)) {
    console.warn('⚠️ VITE_FIREBASE_PROJECT_ID has an invalid format. Please verify your configuration.');
  }

  if (!appId.includes(':')) {
    console.warn('⚠️ VITE_FIREBASE_APP_ID has an invalid format. Please verify your configuration.');
  }

  console.log('✅ Firebase environment variables validated successfully');
}

// Validate environment variables before proceeding
validateFirebaseConfig();

// Firebase configuration from environment variables (now validated)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// DEBUG: Log API key suffix to verify correct build
console.log('🔑 Firebase API Key (last 10 chars):', import.meta.env.VITE_FIREBASE_API_KEY?.slice(-10));
console.log('🔧 Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('🌐 Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

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
  storage: {
    host: '127.0.0.1',
    port: 9199,
  },
};

// Initialize Firebase app (only once)
// Check if Firebase is already initialized
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);
const storage: FirebaseStorage = getStorage(app);

// Set auth persistence to browserLocalPersistence (persists across browser sessions/refreshes)
// This prevents users from being logged out on page refresh
if (!useEmulators) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error);
  });
}

// Track if emulators have been connected (to prevent duplicate connections)
let emulatorsConnected = false;

// Connect to emulators if enabled (only once)
if (useEmulators && !emulatorsConnected) {
  try {
    // Connect Auth emulator
    connectAuthEmulator(auth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`, {
      disableWarnings: true,
    });
    console.log('🔧 Connected to Auth Emulator');

    // Connect Firestore emulator
    connectFirestoreEmulator(db, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
    console.log('🔧 Connected to Firestore Emulator');

    // Connect Functions emulator
    connectFunctionsEmulator(functions, EMULATOR_CONFIG.functions.host, EMULATOR_CONFIG.functions.port);
    console.log('🔧 Connected to Functions Emulator');

    // Connect Storage emulator
    connectStorageEmulator(storage, EMULATOR_CONFIG.storage.host, EMULATOR_CONFIG.storage.port);
    console.log('🔧 Connected to Storage Emulator');

    emulatorsConnected = true;
    console.log('🎮 Firebase Emulators connected. Access UI at http://127.0.0.1:4000');
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase Emulators:', error);
  }
}

// Export Firebase services (no longer nullable since validation ensures config is present)
export { app, auth, db, functions, storage, useEmulators };

// Type exports for convenience
export type { FirebaseApp, Auth, Firestore, Functions, FirebaseStorage };
