# Maintenance Mode Setup Guide

This guide explains how to set up and manage the maintenance mode configuration in Firebase Firestore.

## Overview

The maintenance mode system allows you to display a maintenance page to users when the app is undergoing updates or experiencing issues. The configuration is stored in Firestore at:

```
config/maintenance
```

## Document Structure

```typescript
{
  isMaintenanceMode: boolean,      // Whether maintenance mode is active
  title: string,                   // Title to display (e.g., "Down for Maintenance")
  subtitle: string,                // Message to display to users
  date: string,                    // Optional: Scheduled end date/time
  lastUpdatedAt: Timestamp         // Last update timestamp
}
```

## Initial Setup

### Method 1: Firebase Console (Easiest)

1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to your project
3. Go to **Firestore Database**
4. Click **Start collection** (if no collections exist) or **Add collection**
5. Collection ID: `config`
6. Click **Next**
7. Document ID: `maintenance`
8. Add the following fields:

   | Field Name | Type | Value |
   |------------|------|-------|
   | `isMaintenanceMode` | boolean | `false` |
   | `title` | string | `Down for Maintenance` |
   | `subtitle` | string | `We're making some improvements. Check back soon!` |
   | `date` | string | (leave empty) |
   | `lastUpdatedAt` | timestamp | (click "Set to current time") |

9. Click **Save**

### Method 2: Using Admin Script (For Developers)

1. Install dependencies:
   ```bash
   npm install firebase-admin dotenv tsx --save-dev
   ```

2. Set up Firebase Admin credentials:
   - Download your service account JSON from Firebase Console
   - Add to `.env.local`:
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
     ```

3. Run the initialization script:
   ```bash
   npx tsx scripts/initMaintenance.ts
   ```

### Method 3: Firebase Emulator (For Local Development)

1. Make sure emulators are running:
   ```bash
   firebase emulators:start
   ```

2. Use the Firestore Emulator UI at http://localhost:4000
3. Follow the same steps as Method 1 in the emulator UI

## Using Maintenance Mode in Your App

### Reading Maintenance Status

```typescript
import { getMaintenanceConfig, isMaintenanceMode } from './services/maintenanceService';

// Check if maintenance mode is active
const isInMaintenance = await isMaintenanceMode();

if (isInMaintenance) {
  // Show maintenance page
}

// Get full configuration
const config = await getMaintenanceConfig();
console.log(config.title, config.subtitle);
```

### Subscribing to Changes (Real-time)

```typescript
import { subscribeToMaintenanceMode } from './services/maintenanceService';

// Subscribe to real-time updates
const unsubscribe = subscribeToMaintenanceMode((config) => {
  if (config.isMaintenanceMode) {
    // Show maintenance page
    console.log('Maintenance mode activated:', config.title);
  } else {
    // Show normal app
    console.log('App is operational');
  }
});

// Later, to unsubscribe:
unsubscribe();
```

## Updating Maintenance Mode

### Option 1: Firebase Console (Quickest)

1. Open Firestore in Firebase Console
2. Navigate to `config > maintenance`
3. Click **Edit document**
4. Update fields (especially `isMaintenanceMode` and `lastUpdatedAt`)
5. Click **Update**

### Option 2: Cloud Function (Recommended for Production)

Create a cloud function to update maintenance mode with admin access:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const setMaintenanceMode = functions.https.onCall(async (data, context) => {
  // Verify admin user (implement your own auth logic)
  if (!context.auth || !isAdminUser(context.auth.uid)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can update maintenance mode'
    );
  }
  
  const { isMaintenanceMode, title, subtitle, date } = data;
  
  await admin.firestore()
    .collection('config')
    .doc('maintenance')
    .set({
      isMaintenanceMode: isMaintenanceMode ?? false,
      title: title || 'Down for Maintenance',
      subtitle: subtitle || "We're making some improvements. Check back soon!",
      date: date || '',
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  
  return { 
    success: true, 
    message: `Maintenance mode ${isMaintenanceMode ? 'enabled' : 'disabled'}` 
  };
});

function isAdminUser(uid: string): boolean {
  // Implement your admin check logic
  // Could check against a list of admin UIDs or custom claims
  return true; // Replace with actual logic
}
```

Call from your app:

```typescript
import { functions } from './config/firebase';
import { httpsCallable } from 'firebase/functions';

const setMaintenanceModeFunc = httpsCallable(functions, 'setMaintenanceMode');

// Enable maintenance mode
await setMaintenanceModeFunc({
  isMaintenanceMode: true,
  title: 'Scheduled Maintenance',
  subtitle: 'We are upgrading our servers. Expected completion: 3:00 PM EST',
  date: '2026-02-07T15:00:00Z',
});

// Disable maintenance mode
await setMaintenanceModeFunc({
  isMaintenanceMode: false,
});
```

## Security Rules

The Firestore security rules are already configured:

- ✅ **Read**: Public access (anyone can check maintenance status, even when not logged in)
- ❌ **Write**: Disabled (only Admin SDK/Cloud Functions can update)

This ensures that users can check if the app is in maintenance mode, but only administrators can change the configuration.

## Integration with App Router

To implement a maintenance check in your app's routing:

```typescript
// In your main App component or router
import { useEffect, useState } from 'react';
import { subscribeToMaintenanceMode } from './services/maintenanceService';
import MaintenancePage from './pages/MaintenancePage';

function App() {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((config) => {
      setIsInMaintenance(config.isMaintenanceMode);
      setMaintenanceConfig(config);
    });

    return () => unsubscribe();
  }, []);

  if (isInMaintenance) {
    return <MaintenancePage config={maintenanceConfig} />;
  }

  return (
    // Your normal app
  );
}
```

## Best Practices

1. **Always update `lastUpdatedAt`**: This helps track when changes were made
2. **Test in emulator first**: Use Firebase Emulators to test maintenance mode before deploying
3. **Use Cloud Functions for production**: Don't allow client-side writes to maintenance config
4. **Monitor in real-time**: Subscribe to changes rather than polling
5. **Provide clear messages**: Use descriptive titles and subtitles that tell users when to expect the app to be back
6. **Set a date if possible**: If you know when maintenance will end, include it in the `date` field

## Troubleshooting

### Document doesn't exist
- Check that you've created the `config/maintenance` document in Firestore
- Verify your Firestore rules are deployed
- The app will use default values if the document is missing

### Can't update from app
- This is by design for security
- Use Firebase Console or Cloud Functions to update
- Check that you're using Admin SDK with proper credentials

### Changes not reflecting
- Check that you're subscribed to real-time updates
- Verify the document path is correct: `config/maintenance`
- Check browser console for errors

## Quick Reference

| Action | Method |
|--------|--------|
| Check if in maintenance | `await isMaintenanceMode()` |
| Get full config | `await getMaintenanceConfig()` |
| Subscribe to changes | `subscribeToMaintenanceMode(callback)` |
| Update (admin only) | Firebase Console or Cloud Function |
| Document path | `config/maintenance` |
