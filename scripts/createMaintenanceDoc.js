/**
 * Quick Browser Console Script to Create Maintenance Document
 * 
 * Instructions:
 * 1. Open your app in the browser (must be logged into Firebase)
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run it
 * 
 * This will create the config/maintenance document in Firestore
 * if it doesn't already exist.
 * 
 * Note: This temporarily bypasses the security rules by using
 * the Firebase Admin setup. For production, use Firebase Console
 * or Cloud Functions instead.
 */

(async function createMaintenanceDocument() {
  console.log('🚀 Creating maintenance configuration document...');
  
  try {
    // Import Firestore functions
    const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Get db instance from your app
    // Adjust this import path based on your project structure
    const { db } = await import('./config/firebase');
    
    if (!db) {
      console.error('❌ Firestore is not initialized');
      return;
    }
    
    const maintenanceRef = doc(db, 'config', 'maintenance');
    
    // Check if it already exists
    const docSnap = await getDoc(maintenanceRef);
    
    if (docSnap.exists()) {
      console.log('⚠️  Document already exists!');
      console.log('Current data:', docSnap.data());
      
      const overwrite = confirm('Document already exists. Do you want to overwrite it?');
      
      if (!overwrite) {
        console.log('❌ Cancelled. Document not modified.');
        return;
      }
    }
    
    // Create/update the document
    // Note: This will fail in production due to security rules
    // Use this only in development or when rules allow it
    const initialData = {
      isMaintenanceMode: false,
      title: 'Down for Maintenance',
      subtitle: "We're making some improvements. Check back soon!",
      date: '',
      lastUpdatedAt: serverTimestamp(),
    };
    
    await setDoc(maintenanceRef, initialData);
    
    console.log('✅ Maintenance document created successfully!');
    console.log('📄 Path: config/maintenance');
    console.log('📊 Data:', initialData);
    console.log('\n🎉 Setup complete! You can now manage maintenance mode.');
    
  } catch (error) {
    console.error('❌ Error creating document:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. This is expected in production.');
      console.log('Please create the document manually using one of these methods:');
      console.log('1. Firebase Console (Firestore Database)');
      console.log('2. Firebase Admin SDK (server-side)');
      console.log('3. Firebase Emulator (local development)');
      console.log('\nSee MAINTENANCE_SETUP.md for detailed instructions.');
    }
  }
})();
