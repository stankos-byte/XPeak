/**
 * Set Admin Claim Script
 * 
 * This script sets the admin custom claim on a Firebase user,
 * allowing them to control maintenance mode.
 * 
 * Prerequisites:
 * 1. Firebase Admin SDK installed: npm install firebase-admin
 * 2. Service account JSON file downloaded from Firebase Console
 * 3. Set environment variable or update the script with the path to your service account
 * 
 * Usage:
 *   node scripts/setAdminClaim.js YOUR_USER_ID
 * 
 * To get your user ID:
 * 1. Go to Firebase Console → Authentication
 * 2. Find your user in the list
 * 3. Click on the user to see details
 * 4. Copy the "User UID"
 */

const admin = require('firebase-admin');
const path = require('path');

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.log('Usage: node scripts/setAdminClaim.js YOUR_USER_ID');
  console.log('\nTo find your user ID:');
  console.log('1. Go to Firebase Console → Authentication');
  console.log('2. Find your user in the list');
  console.log('3. Copy the "User UID"');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  // Try to use service account from environment variable or default location
  const serviceAccountPath = 
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '../serviceAccountKey.json');
  
  console.log('📂 Looking for service account at:', serviceAccountPath);
  
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📋 Steps to fix:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "serviceAccountKey.json" in the project root');
  console.log('   OR set FIREBASE_SERVICE_ACCOUNT_PATH environment variable');
  process.exit(1);
}

// Set admin claim
async function setAdminClaim() {
  try {
    console.log(`\n🔐 Setting admin claim for user: ${userId}`);
    
    // First, verify the user exists
    try {
      const userRecord = await admin.auth().getUser(userId);
      console.log('✅ User found:', userRecord.email || userRecord.phoneNumber || 'No email/phone');
    } catch (error) {
      console.error('❌ User not found:', error.message);
      console.log('\nMake sure the user ID is correct.');
      process.exit(1);
    }
    
    // Set the admin custom claim
    await admin.auth().setCustomUserClaims(userId, { admin: true });
    
    console.log('✅ Admin claim set successfully!');
    console.log('\n⚠️  IMPORTANT: The user must sign out and sign in again for changes to take effect.');
    console.log('\n📝 Next steps:');
    console.log('1. Sign out of your app');
    console.log('2. Sign in again');
    console.log('3. You can now use maintenance mode controls');
    
    // Verify the claim was set
    const user = await admin.auth().getUser(userId);
    console.log('\n✅ Verification - Custom claims:', user.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error.message);
    process.exit(1);
  }
}

// Run the script
setAdminClaim();
