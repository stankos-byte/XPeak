# 🚀 Quick Start: Maintenance Mode

## ⚡ 3-Step Setup (First Time Only)

### Step 1: Create the Maintenance Document in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Firestore Database
3. Click "+ Start collection"
4. Collection ID: **`config`**
5. Click "Next"
6. Document ID: **`maintenance`**
7. Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `isMaintenanceMode` | boolean | `false` |
| `title` | string | `Down for Maintenance` |
| `subtitle` | string | `We're making some improvements. Check back soon!` |
| `date` | string | (leave empty) |
| `lastUpdatedAt` | timestamp | Click "Use current time" |

8. Click "Save"

### Step 2: Make Yourself an Admin

You need to set yourself as an admin to control maintenance mode.

**Option A: Using Firebase Console CLI**
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login
firebase login

# Set custom claim (replace YOUR_USER_ID with your Firebase Auth UID)
firebase auth:export users.json --project your-project-id
# Find your UID in the exported JSON, then:

# Create a small script or use Firebase Functions to set the claim
```

**Option B: Using a Temporary Cloud Function**

Create a one-time function to make yourself admin:

```typescript
// Add this to functions/src/index.ts temporarily

export const makeAdmin = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');
  
  // Set admin claim
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  
  return { success: true, message: `User ${uid} is now an admin` };
});
```

Then deploy and call it once:
```bash
cd functions
firebase deploy --only functions:makeAdmin

# Call it from your browser console while logged in:
const functions = firebase.functions();
const makeAdmin = functions.httpsCallable('makeAdmin');
makeAdmin().then(result => console.log(result.data));
```

**Option C: Quick Script (Easiest)**

Create `scripts/makeAdmin.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = 'YOUR_USER_ID_HERE'; // Get from Firebase Console → Authentication

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('✅ Admin claim set successfully!');
    console.log('User must sign out and sign in again for changes to take effect.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

Run it:
```bash
node scripts/makeAdmin.js
```

### Step 3: Deploy the Cloud Function

```bash
cd functions
npm install
firebase deploy --only functions:setMaintenanceMode
```

## 🎯 How to Use (After Setup)

### Enable Maintenance Mode

**Quick Method (Browser Console):**
1. Open your app
2. Log in as admin
3. Press F12 to open console
4. Paste this:

```javascript
const functions = firebase.functions();
const setMaintenanceMode = functions.httpsCallable('setMaintenanceMode');
setMaintenanceMode({
  isMaintenanceMode: true,
  title: 'Down for Maintenance',
  subtitle: "We're making some improvements. Check back soon!",
  date: ''
}).then(() => {
  console.log('✅ Maintenance enabled!');
  window.location.reload();
});
```

**Manual Method (Firebase Console):**
1. Go to Firestore
2. Find `config` → `maintenance`
3. Set `isMaintenanceMode` to `true`
4. Save

### Disable Maintenance Mode

**Quick Method (Browser Console):**
```javascript
const functions = firebase.functions();
const setMaintenanceMode = functions.httpsCallable('setMaintenanceMode');
setMaintenanceMode({
  isMaintenanceMode: false
}).then(() => {
  console.log('✅ Maintenance disabled!');
  window.location.reload();
});
```

**Manual Method (Firebase Console):**
1. Go to Firestore
2. Find `config` → `maintenance`
3. Set `isMaintenanceMode` to `false`
4. Save

## ✅ Verification

### Check if it's working:
1. Enable maintenance mode (using either method above)
2. Open your app in a new incognito window
3. You should see the maintenance page
4. Disable maintenance mode
5. Refresh - app should work normally

## 🆘 Troubleshooting

**"Permission denied" error:**
- Make sure you're logged in
- Verify your user has `admin: true` custom claim
- Sign out and sign in again after setting admin claim

**Maintenance page not showing:**
- Check that the document exists in Firestore
- Verify `isMaintenanceMode` is `true`
- Hard refresh the page (Ctrl+Shift+R)

**Can't update maintenance status:**
- Ensure Cloud Functions are deployed
- Check Firebase Console for function errors
- Verify you're calling the correct function name

## 📞 Need Help?

See the full guide: `MAINTENANCE_MODE.md`
