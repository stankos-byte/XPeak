# Maintenance Mode Implementation Summary

## ✅ What Was Created

The maintenance mode system has been successfully set up with the following components:

### 1. **Firestore Security Rules** (`firestore.rules`)
- Added rules for `config/maintenance` collection
- Public read access (anyone can check maintenance status)
- Write access restricted to Admin SDK only

### 2. **Firebase Paths Service** (`services/firebasePaths.ts`)
- Added `CONFIG` collection constant
- Added path helpers:
  - `paths.configMaintenance()` - String path
  - `fbPaths.configCollection()` - Collection reference
  - `fbPaths.maintenanceDoc()` - Document reference

### 3. **Type Definitions** (`types.ts`)
- Added `MaintenanceConfig` interface with fields:
  - `isMaintenanceMode: boolean`
  - `title: string`
  - `subtitle: string`
  - `date?: string`
  - `lastUpdatedAt: Date | string`

### 4. **Maintenance Service** (`services/maintenanceService.ts`)
- `getMaintenanceConfig()` - Fetch current configuration
- `isMaintenanceMode()` - Quick check if maintenance is active
- `subscribeToMaintenanceMode()` - Real-time updates
- Default configuration fallback
- Timestamp conversion handling

### 5. **Documentation**
- `MAINTENANCE_SETUP.md` - Complete setup and usage guide
- `MAINTENANCE_IMPLEMENTATION.md` - This summary document

### 6. **Scripts** (Optional)
- `scripts/initMaintenance.ts` - Admin SDK initialization script
- `scripts/createMaintenanceDoc.js` - Browser console script

## 🚀 Quick Start Guide

### Step 1: Create the Document in Firestore

**Option A: Firebase Console (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **Start collection** (or **Add collection**)
5. Collection ID: `config`
6. Document ID: `maintenance`
7. Add these fields:

```
isMaintenanceMode: boolean = false
title: string = "Down for Maintenance"
subtitle: string = "We're making some improvements. Check back soon!"
date: string = ""
lastUpdatedAt: timestamp = [current time]
```

8. Click **Save**

**Option B: Firebase Emulator (For Development)**

If using emulators, access the Firestore UI at `http://localhost:4000` and follow the same steps.

### Step 2: Deploy Firestore Rules

Make sure your updated `firestore.rules` are deployed:

```bash
firebase deploy --only firestore:rules
```

### Step 3: Use in Your App

```typescript
import { subscribeToMaintenanceMode } from './services/maintenanceService';

// In your main App component
useEffect(() => {
  const unsubscribe = subscribeToMaintenanceMode((config) => {
    if (config.isMaintenanceMode) {
      // Show maintenance page
      setShowMaintenance(true);
      setMaintenanceInfo(config);
    } else {
      // Show normal app
      setShowMaintenance(false);
    }
  });

  return () => unsubscribe();
}, []);
```

## 📊 Firestore Document Structure

Your Firestore database will now have this structure:

```
📁 Firestore Database
├── 📁 users/
├── 📁 challenges/
├── 📁 friendRequests/
└── 📁 config/
    └── 📄 maintenance
        ├── isMaintenanceMode: false
        ├── title: "Down for Maintenance"
        ├── subtitle: "We're making some improvements. Check back soon!"
        ├── date: ""
        └── lastUpdatedAt: Timestamp
```

## 🔧 Managing Maintenance Mode

### To Enable Maintenance Mode:

1. Open Firebase Console
2. Go to Firestore → `config` → `maintenance`
3. Edit the document:
   - Set `isMaintenanceMode` to `true`
   - Update `title` and `subtitle` if needed
   - Optionally set `date` with expected completion time
   - Update `lastUpdatedAt` to current timestamp
4. Save

### To Disable Maintenance Mode:

1. Open Firebase Console
2. Go to Firestore → `config` → `maintenance`
3. Edit the document:
   - Set `isMaintenanceMode` to `false`
   - Update `lastUpdatedAt` to current timestamp
4. Save

## 🔐 Security

The security rules ensure:

✅ **Anyone can READ** the maintenance status (even when not authenticated)
- This allows users to see the maintenance message
- No sensitive data is exposed

❌ **Nobody can WRITE** from the client
- Only Admin SDK (Cloud Functions) can update
- Prevents unauthorized changes
- Forces updates through Firebase Console or server-side code

## 🎨 Example Maintenance Page Component

```typescript
import React from 'react';
import { MaintenanceConfig } from './types';

interface MaintenancePageProps {
  config: MaintenanceConfig;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ config }) => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-content">
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
        {config.date && (
          <p className="expected-time">
            Expected completion: {new Date(config.date).toLocaleString()}
          </p>
        )}
        <div className="maintenance-icon">🔧</div>
      </div>
    </div>
  );
};

export default MaintenancePage;
```

## 🧪 Testing

### Local Testing with Emulator

1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Access Firestore UI at `http://localhost:4000`

3. Create the maintenance document

4. Toggle `isMaintenanceMode` to test the behavior

### Production Testing

1. Create the document in production Firestore
2. Keep `isMaintenanceMode` as `false` initially
3. Test by temporarily setting it to `true`
4. Verify the app shows maintenance page
5. Set back to `false`

## 📝 Next Steps

### Optional Enhancements:

1. **Create a Maintenance Page Component**
   - Design a nice UI for the maintenance page
   - Show title, subtitle, and expected completion time
   - Add a refresh button to check status again

2. **Add Admin Panel** (Optional)
   - Create a Cloud Function to update maintenance mode
   - Build an admin UI to toggle maintenance mode
   - Add admin authentication

3. **Notifications**
   - Send push notifications when entering/exiting maintenance
   - Email notifications to admins
   - Slack/Discord webhooks

4. **Scheduled Maintenance**
   - Implement automatic activation based on `date` field
   - Add start and end dates
   - Auto-disable when maintenance window ends

5. **Monitoring**
   - Log maintenance mode changes
   - Track how long maintenance lasted
   - Analytics on user impact

## 🐛 Troubleshooting

### Document Not Found
**Problem**: App can't read maintenance config

**Solution**: 
- Verify document exists at `config/maintenance`
- Check Firestore rules are deployed
- App will use default values if document is missing

### Can't Update from App
**Problem**: Getting permission denied when trying to update

**Solution**: 
- This is expected and by design
- Use Firebase Console to update
- Or implement a Cloud Function with admin access

### Changes Not Reflecting
**Problem**: Updates in Console not showing in app

**Solution**: 
- Verify you're using `subscribeToMaintenanceMode()` for real-time updates
- Check browser console for errors
- Try refreshing the page
- Verify correct document path

## 📚 Additional Resources

- [MAINTENANCE_SETUP.md](./MAINTENANCE_SETUP.md) - Detailed setup guide
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## ✨ Summary

You now have a complete maintenance mode system that:

- ✅ Stores configuration in Firestore
- ✅ Has proper security rules
- ✅ Provides type-safe access via service
- ✅ Supports real-time updates
- ✅ Works with both production and emulators
- ✅ Has comprehensive documentation

To activate it, simply create the document in Firebase Console and toggle the `isMaintenanceMode` field as needed!
