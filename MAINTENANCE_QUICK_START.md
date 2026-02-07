# 🚀 Maintenance Mode - Quick Start

A simple 3-step guide to get maintenance mode working.

## ✅ Step 1: Create the Document in Firebase

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database

Click **Start collection**:
- Collection ID: `config`
- Document ID: `maintenance`

Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `isMaintenanceMode` | boolean | `false` |
| `title` | string | `Down for Maintenance` |
| `subtitle` | string | `We're making some improvements. Check back soon!` |
| `date` | string | _(leave empty)_ |
| `lastUpdatedAt` | timestamp | _(set to current time)_ |

Click **Save**.

## ✅ Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## ✅ Step 3: Use in Your App

Add this to your main App component:

```typescript
import { useEffect, useState } from 'react';
import { subscribeToMaintenanceMode } from './services/maintenanceService';
import MaintenancePage from './pages/Maintenance';

function App() {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToMaintenanceMode((maintenanceConfig) => {
      setIsInMaintenance(maintenanceConfig.isMaintenanceMode);
      setConfig(maintenanceConfig);
    });
    return () => unsubscribe();
  }, []);

  if (isInMaintenance) {
    return <MaintenancePage config={config} />;
  }

  return <YourNormalApp />;
}
```

## 🎯 That's It!

### To Enable Maintenance:
1. Go to Firebase Console
2. Open `config/maintenance` document
3. Set `isMaintenanceMode` to `true`
4. Save

### To Disable Maintenance:
1. Go to Firebase Console
2. Open `config/maintenance` document
3. Set `isMaintenanceMode` to `false`
4. Save

Changes are instant - no app restart needed! 🎉

---

## 📚 More Information

- **Full Setup Guide**: [MAINTENANCE_SETUP.md](./MAINTENANCE_SETUP.md)
- **Implementation Details**: [MAINTENANCE_IMPLEMENTATION.md](./MAINTENANCE_IMPLEMENTATION.md)
- **Integration Examples**: [MAINTENANCE_INTEGRATION_EXAMPLE.md](./MAINTENANCE_INTEGRATION_EXAMPLE.md)

## 📁 Files Created

- ✅ `firestore.rules` - Updated with config/maintenance rules
- ✅ `services/firebasePaths.ts` - Added maintenance paths
- ✅ `services/maintenanceService.ts` - Service to read maintenance config
- ✅ `types.ts` - Added MaintenanceConfig interface
- ✅ `pages/Maintenance.tsx` - Example maintenance page component
- ✅ Documentation files

## 🔍 Quick Troubleshooting

**Can't read document?**
- Check document exists at `config/maintenance`
- Deploy firestore rules: `firebase deploy --only firestore:rules`

**Changes not showing?**
- Make sure you're using `subscribeToMaintenanceMode()` (not `getMaintenanceConfig()`)
- Check browser console for errors

**Can't update from app?**
- This is expected! Update via Firebase Console only
- Or use Cloud Functions with Admin SDK
