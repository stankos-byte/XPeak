/**
 * Initialize Maintenance Configuration Script
 * 
 * This script creates the initial maintenance configuration document in Firestore.
 * Run this once to set up the config/maintenance document.
 * 
 * Usage:
 *   npx tsx scripts/initMaintenance.ts
 * 
 * Note: This requires Firebase Admin SDK with proper credentials.
 * For local development, you can also create this manually in the Firebase Console.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  // For local development, use the emulator or service account
  const useEmulators = process.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  
  if (useEmulators) {
    // Use emulator
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
    console.log('🔧 Using Firebase Emulator');
  } else {
    // Production: requires service account JSON file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (!serviceAccountPath) {
      console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_PATH environment variable not set');
      console.log('Please set it to the path of your Firebase service account JSON file');
      process.exit(1);
    }
    
    const serviceAccount = require(path.resolve(serviceAccountPath));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Connected to Production Firebase');
  }
}

const db = admin.firestore();

/**
 * Initialize the maintenance configuration document
 */
async function initMaintenanceConfig() {
  try {
    console.log('📝 Creating maintenance configuration document...');
    
    const maintenanceRef = db.collection('config').doc('maintenance');
    
    // Check if document already exists
    const docSnap = await maintenanceRef.get();
    
    if (docSnap.exists) {
      console.log('⚠️  Maintenance document already exists!');
      console.log('Current data:', docSnap.data());
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      return new Promise((resolve) => {
        readline.question('Do you want to overwrite it? (yes/no): ', async (answer: string) => {
          readline.close();
          
          if (answer.toLowerCase() !== 'yes') {
            console.log('❌ Cancelled. Document not modified.');
            resolve(false);
            return;
          }
          
          await createDocument(maintenanceRef);
          resolve(true);
        });
      });
    } else {
      await createDocument(maintenanceRef);
      return true;
    }
  } catch (error) {
    console.error('❌ Error initializing maintenance config:', error);
    return false;
  }
}

/**
 * Create the maintenance document with default values
 */
async function createDocument(ref: admin.firestore.DocumentReference) {
  const initialData = {
    isMaintenanceMode: false,
    title: 'Down for Maintenance',
    subtitle: "We're making some improvements. Check back soon!",
    date: '',
    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await ref.set(initialData);
  
  console.log('✅ Maintenance configuration created successfully!');
  console.log('📄 Document path: config/maintenance');
  console.log('📊 Initial data:', {
    ...initialData,
    lastUpdatedAt: new Date().toISOString(),
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Maintenance Configuration Initialization\n');
  
  const success = await initMaintenanceConfig();
  
  if (success) {
    console.log('\n✅ Setup complete!');
    console.log('\nYou can now:');
    console.log('1. View the document in Firebase Console');
    console.log('2. Update it manually or via Cloud Functions');
    console.log('3. Use the maintenanceService in your app to read the config');
  }
  
  process.exit(success ? 0 : 1);
}

// Run the script
main();
