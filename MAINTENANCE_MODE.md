# 🔧 Maintenance Mode Guide

This guide explains how to enable and disable maintenance mode for your XPeak application.

## 📋 Overview

Maintenance mode allows you to temporarily restrict access to your application for all users. This is useful when:
- You need to deploy critical updates
- There's a bug that needs immediate fixing
- You're performing database migrations
- The application requires scheduled maintenance

When maintenance mode is enabled, all users will see a maintenance page instead of the normal application.

## 🚀 How It Works

The maintenance mode system consists of:

1. **Firestore Document**: `config/maintenance` - Stores the maintenance configuration
2. **Maintenance Service**: Subscribes to real-time updates from Firestore
3. **App Integration**: Checks maintenance status on app load and shows maintenance page when enabled
4. **Cloud Function**: Admin-only function to toggle maintenance mode
5. **Maintenance Page**: Beautiful, user-friendly page shown during maintenance

## 📦 Setup (First Time Only)

### Step 1: Initialize the Maintenance Document

You need to create the maintenance document in Firestore. Choose one of these methods:

#### Option A: Using Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Click "Start collection"
5. Collection ID: `config`
6. Document ID: `maintenance`
7. Add these fields:
   - `isMaintenanceMode` (boolean): `false`
   - `title` (string): `"Down for Maintenance"`
   - `subtitle` (string): `"We're making some improvements. Check back soon!"`
   - `date` (string): `""`
   - `lastUpdatedAt` (timestamp): Click "Use current time"
8. Click "Save"

#### Option B: Using Node Script
```bash
# Make sure you have Firebase Admin SDK set up
npm install firebase-admin dotenv

# Run the initialization script
npx tsx scripts/initMaintenance.ts
```

### Step 2: Set Up Admin User

The Cloud Function requires admin authentication. You need to set a custom claim on your user:

```javascript
// Run this in Firebase Admin SDK or Cloud Functions
const admin = require('firebase-admin');
admin.initializeApp();

// Set admin claim for your user
const uid = 'YOUR_USER_ID'; // Get this from Firebase Authentication
await admin.auth().setCustomUserClaims(uid, { admin: true });

console.log('Admin claim set for user:', uid);
```

Or manually in Firebase Console:
1. Go to Firebase Console → Authentication
2. Find your user
3. Copy the UID
4. Use Firebase CLI or Admin SDK to set custom claims

### Step 3: Deploy Cloud Functions

Make sure your Cloud Functions are deployed:

```bash
cd functions
npm install
firebase deploy --only functions:setMaintenanceMode
```

## 🎯 How to Enable/Disable Maintenance Mode

### Method 1: Using Browser Console (Recommended for Quick Toggles)

1. Open your app in the browser
2. Log in as an admin user
3. Open browser console (F12)
4. Copy and paste the entire contents of `scripts/toggleMaintenance.js`
5. Run one of these commands:

```javascript
// Enable maintenance mode with default message
enableMaintenance();

// Disable maintenance mode
disableMaintenance();

// Enable with custom message and date
setCustomMaintenance({
  enabled: true,
  title: "Scheduled Maintenance",
  subtitle: "We're upgrading our servers to serve you better. Expected downtime: 2 hours.",
  date: "2026-02-10T03:00:00" // ISO date string
});
```

### Method 2: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Find `config` collection → `maintenance` document
4. Edit fields:
   - Set `isMaintenanceMode` to `true` (to enable) or `false` (to disable)
   - Update `title` and `subtitle` as needed
   - Set `date` for expected completion time (optional)
   - `lastUpdatedAt` will update automatically
5. Save changes

Changes take effect immediately for all users!

### Method 3: Using Cloud Function Directly

If you have a backend or admin panel, you can call the Cloud Function:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setMaintenanceMode = httpsCallable(functions, 'setMaintenanceMode');

// Enable maintenance mode
try {
  const result = await setMaintenanceMode({
    isMaintenanceMode: true,
    title: "System Maintenance",
    subtitle: "We'll be back soon!",
    date: "2026-02-10T15:00:00"
  });
  
  console.log('Maintenance mode enabled:', result.data);
} catch (error) {
  console.error('Error:', error);
}
```

## 🔍 Checking Current Status

### In Browser Console
```javascript
// Check current maintenance status
const { doc, getDoc } = firebase.firestore;
const db = firebase.firestore();

const maintenanceRef = doc(db, 'config', 'maintenance');
const snap = await getDoc(maintenanceRef);
console.log('Current maintenance config:', snap.data());
```

### In Firebase Console
1. Go to Firestore Database
2. Navigate to `config` → `maintenance`
3. View the `isMaintenanceMode` field

## 🎨 Customizing the Maintenance Page

The maintenance page is located at `pages/Maintenance.tsx`. You can customize:

- Colors and styling
- Icon (currently shows a wrench)
- Layout and animations
- Additional information or links

## 🔐 Security

- Only users with `admin: true` custom claim can toggle maintenance mode
- The `config/maintenance` document is read-only for all users (enforced by Firestore rules)
- Only Cloud Functions and Firebase Admin SDK can write to this document
- All users (including unauthenticated) can read the maintenance status

## 📱 Real-Time Updates

The app subscribes to maintenance mode changes in real-time:
- When you enable maintenance mode, all active users will see the maintenance page immediately
- When you disable it, users can refresh to access the app again

## 🚨 Emergency Procedures

### Quick Enable (Emergency Maintenance)
```bash
# In Firebase Console, set isMaintenanceMode to true
# Or run in browser console after loading the script:
enableMaintenance();
```

### Quick Disable (Restore Service)
```bash
# In Firebase Console, set isMaintenanceMode to false
# Or run in browser console:
disableMaintenance();
```

## 📊 Example Scenarios

### Scenario 1: Scheduled Maintenance (2-hour window)
```javascript
setCustomMaintenance({
  enabled: true,
  title: "Scheduled Maintenance",
  subtitle: "We're performing scheduled maintenance to improve your experience. We'll be back at 3:00 PM EST.",
  date: "2026-02-10T15:00:00-05:00"
});
```

### Scenario 2: Emergency Bug Fix
```javascript
enableMaintenance({
  title: "Emergency Maintenance",
  subtitle: "We've discovered a critical issue and are working on a fix. We'll be back shortly!"
});
```

### Scenario 3: Disable After Completion
```javascript
disableMaintenance();
```

## 🔧 Troubleshooting

### Users can still access the app
- Check that the maintenance document exists in Firestore
- Verify `isMaintenanceMode` is set to `true`
- Users may need to refresh their browsers

### Can't toggle maintenance mode
- Verify you're logged in as an admin user
- Check that your user has the `admin: true` custom claim
- Ensure Cloud Functions are deployed
- Check browser console for errors

### Maintenance page not showing
- Check `App.tsx` imports the maintenance service
- Verify the maintenance page component exists
- Check browser console for JavaScript errors

## 📚 Related Files

- `services/maintenanceService.ts` - Maintenance mode service
- `pages/Maintenance.tsx` - Maintenance page component
- `App.tsx` - App entry point with maintenance check
- `functions/src/index.ts` - Cloud Functions (setMaintenanceMode)
- `scripts/toggleMaintenance.js` - Browser console helper script
- `scripts/initMaintenance.ts` - Node script for initialization
- `firestore.rules` - Security rules for maintenance document

## 🎉 That's It!

You now have a fully functional maintenance mode system. Use it wisely to keep your users informed during updates and maintenance windows.
