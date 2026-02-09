# Maintenance Mode Scripts

This folder contains helper scripts for managing maintenance mode.

## 📁 Available Scripts

### `setAdminClaim.js`
**Purpose:** Make a user an admin so they can control maintenance mode

**Usage:**
```bash
node scripts/setAdminClaim.js YOUR_USER_ID
```

**Prerequisites:**
- Firebase service account JSON file (`serviceAccountKey.json` in project root)
- User ID from Firebase Console → Authentication

**What it does:**
- Sets the `admin: true` custom claim on a user
- Allows that user to call the `setMaintenanceMode` Cloud Function
- User must sign out and sign in again for changes to take effect

---

### `toggleMaintenance.js`
**Purpose:** Browser console script for quick maintenance mode control

**Usage:**
1. Open your app in browser
2. Log in as an admin user
3. Open browser console (F12)
4. Copy and paste the entire script
5. Run one of these commands:
   - `enableMaintenance()` - Enable with default message
   - `disableMaintenance()` - Disable maintenance mode
   - `setCustomMaintenance({...})` - Enable with custom settings

**Example:**
```javascript
// Enable with custom message
setCustomMaintenance({
  enabled: true,
  title: "Scheduled Maintenance",
  subtitle: "We'll be back in 2 hours!",
  date: "2026-02-10T15:00:00"
});

// Disable
disableMaintenance();
```

---

### `initMaintenance.ts`
**Purpose:** Initialize the maintenance configuration document in Firestore

**Usage:**
```bash
npx tsx scripts/initMaintenance.ts
```

**Prerequisites:**
- Firebase Admin SDK set up
- Service account JSON file OR using emulators

**What it does:**
- Creates the `config/maintenance` document in Firestore
- Sets default values (maintenance mode disabled)
- Only needed once during initial setup

**Note:** You can also create this document manually in Firebase Console (see `QUICK_START_MAINTENANCE.md`)

---

### `createMaintenanceDoc.js`
**Purpose:** Browser console script to create maintenance document

**Usage:**
1. Open Firebase Console → Firestore
2. Open browser console
3. Copy and paste the script
4. Run it

**Alternative to:** Using Firebase Console UI to manually create the document

---

## 🎯 Typical Workflow

### First-Time Setup
1. Create maintenance document:
   - **Option A:** Use Firebase Console (recommended, easiest)
   - **Option B:** Run `npx tsx scripts/initMaintenance.ts`

2. Make yourself admin:
   ```bash
   node scripts/setAdminClaim.js YOUR_USER_ID
   ```

3. Deploy Cloud Functions:
   ```bash
   cd functions
   firebase deploy --only functions:setMaintenanceMode
   ```

### Daily Use
1. Open your app
2. Log in as admin
3. Press F12 for console
4. Paste `toggleMaintenance.js` script
5. Run `enableMaintenance()` or `disableMaintenance()`

**OR**

Just go to Firebase Console → Firestore → `config/maintenance` and toggle `isMaintenanceMode` field

## 📚 Documentation

For complete guides, see:
- `../MAINTENANCE_MODE_SUMMARY.md` - Quick overview
- `QUICK_START_MAINTENANCE.md` - Step-by-step setup
- `../MAINTENANCE_MODE.md` - Full documentation

## 🔒 Security Note

- Only users with `admin: true` custom claim can control maintenance mode
- The Firestore document is read-only for all users (write access via Cloud Functions only)
- This ensures only authorized admins can enable/disable maintenance mode
