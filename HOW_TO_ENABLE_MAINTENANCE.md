# 🚀 How to Enable Maintenance Mode - Step by Step

## ⚡ Super Quick Method (After Setup)

### Method 1: Firebase Console (30 seconds, no code)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" in the left menu
4. Find the `config` collection
5. Click on the `maintenance` document
6. Find the `isMaintenanceMode` field
7. Click on it and change `false` to `true`
8. Click "Update"
9. **Done!** All users will see the maintenance page immediately

To disable: Just change it back to `false`

---

### Method 2: Browser Console (45 seconds, copy-paste)

1. Open your app at https://your-app-url.com
2. Log in with your admin account
3. Press **F12** to open Developer Tools
4. Click on the **Console** tab
5. Copy and paste this code:

```javascript
const functions = firebase.functions();
const setMaintenanceMode = functions.httpsCallable('setMaintenanceMode');

// ENABLE maintenance mode
setMaintenanceMode({
  isMaintenanceMode: true,
  title: 'Down for Maintenance',
  subtitle: "We're making some improvements. Check back soon!",
  date: ''
}).then(() => {
  console.log('✅ Maintenance mode ENABLED!');
  window.location.reload();
}).catch(err => console.error('Error:', err));
```

6. Press **Enter**
7. Page will reload and show maintenance page
8. **Done!**

To disable, paste this instead:

```javascript
const functions = firebase.functions();
const setMaintenanceMode = functions.httpsCallable('setMaintenanceMode');

// DISABLE maintenance mode
setMaintenanceMode({
  isMaintenanceMode: false
}).then(() => {
  console.log('✅ Maintenance mode DISABLED!');
  window.location.reload();
}).catch(err => console.error('Error:', err));
```

---

## 📋 One-Time Setup (Do This First)

### Step 1: Create the Maintenance Document ⏱️ 2 minutes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your XPeak project
3. Click **Firestore Database** (left sidebar)
4. Click **+ Start collection** (or **+ Add collection** if you have existing data)
5. Enter Collection ID: `config`
6. Click **Next**
7. Enter Document ID: `maintenance`
8. Add the following fields by clicking **+ Add field** for each:

| Field Name | Field Type | Value |
|------------|------------|-------|
| `isMaintenanceMode` | boolean | **false** (uncheck the box) |
| `title` | string | `Down for Maintenance` |
| `subtitle` | string | `We're making some improvements. Check back soon!` |
| `date` | string | (leave empty) |
| `lastUpdatedAt` | timestamp | Click **"Use current time"** button |

9. Click **Save**
10. ✅ Done! Document created

---

### Step 2: Make Yourself an Admin ⏱️ 3 minutes

**You need to become an admin to control maintenance mode.**

#### Download Service Account Key:
1. Go to Firebase Console → ⚙️ **Project Settings** (top left)
2. Click **Service accounts** tab
3. Click **Generate new private key** button
4. Save the JSON file as `serviceAccountKey.json` in your project folder

#### Get Your User ID:
1. Firebase Console → **Authentication**
2. Find your email in the user list
3. Click on it
4. Copy the **User UID** (looks like: `Abc123XYZ456...`)

#### Run the Script:
```bash
# In your project folder
node scripts/setAdminClaim.js YOUR_USER_ID_HERE
```

Replace `YOUR_USER_ID_HERE` with the UID you copied.

You should see:
```
✅ Admin claim set successfully!
⚠️  IMPORTANT: The user must sign out and sign in again for changes to take effect.
```

#### Sign Out and Back In:
1. Go to your app
2. Sign out
3. Sign in again
4. ✅ You're now an admin!

---

### Step 3: Deploy Cloud Function ⏱️ 2 minutes

```bash
cd functions
npm install
firebase deploy --only functions:setMaintenanceMode
```

Wait for deployment to complete. You should see:
```
✔  functions[setMaintenanceMode(...)] Successful update operation.
```

---

## ✅ Test It!

1. Use Method 1 or 2 above to **enable** maintenance mode
2. Open your app in an **incognito window** (or different browser)
3. You should see a beautiful purple maintenance page with a wrench icon! 🎉
4. Use Method 1 or 2 to **disable** maintenance mode
5. Refresh - app should work normally

---

## 🎨 What Users Will See

When maintenance mode is enabled, users see:

```
┌─────────────────────────────────────────┐
│                                         │
│              🔧 (rotating)              │
│                                         │
│       Down for Maintenance              │
│                                         │
│   We're making some improvements.       │
│      Check back soon!                   │
│                                         │
│  Expected completion (if date set):     │
│  ┌───────────────────────────────────┐ │
│  │  Monday, February 10, 2026        │ │
│  │  3:00 PM                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│      [🔄 Check Again]                  │
│                                         │
│   Last updated: [timestamp]             │
│                                         │
└─────────────────────────────────────────┘
```

Beautiful gradient purple background, white card, professional styling!

---

## 💡 Pro Tips

### Scheduled Maintenance
If you know when you'll be done, set a date:

```javascript
setCustomMaintenance({
  enabled: true,
  title: "Scheduled Maintenance",
  subtitle: "We're upgrading our servers. Expected completion:",
  date: "2026-02-10T15:00:00-05:00" // Include timezone
});
```

### Emergency Maintenance
Quick enable during a bug:

```javascript
enableMaintenance(); // Uses default message
```

### Custom Messages
Get creative:

```javascript
setCustomMaintenance({
  enabled: true,
  title: "Leveling Up Our Systems! 🎮",
  subtitle: "We're adding awesome new features. Quest resumes in 1 hour!",
  date: "2026-02-10T14:00:00"
});
```

---

## 🆘 Troubleshooting

### "Permission denied" Error
- ❌ You're not an admin yet
- ✅ Run `setAdminClaim.js` script
- ✅ Sign out and sign in again

### Maintenance Page Not Showing
- ❌ Document doesn't exist or has wrong values
- ✅ Check Firebase Console → Firestore → `config/maintenance`
- ✅ Verify `isMaintenanceMode` is `true` (boolean, not string)
- ✅ Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Cloud Function Not Found
- ❌ Functions not deployed
- ✅ Run `firebase deploy --only functions:setMaintenanceMode`
- ✅ Check Firebase Console → Functions for errors

### "firebase is not defined" in Console
- ❌ Script might not be loading Firebase correctly
- ✅ Use Method 1 (Firebase Console) instead
- ✅ Make sure you're on your app's page, not Firebase Console

---

## 🎯 Summary

**To Enable Maintenance:**
1. Go to Firebase Console → Firestore → `config/maintenance`
2. Set `isMaintenanceMode` to `true`
3. Done!

**To Disable:**
1. Set it back to `false`
2. Done!

**That's it!** Simple, powerful, instant.

---

## 📞 Need More Help?

See these guides:
- `MAINTENANCE_MODE_SUMMARY.md` - Overview of the feature
- `MAINTENANCE_MODE.md` - Complete documentation
- `scripts/QUICK_START_MAINTENANCE.md` - Alternative setup guide
- `scripts/README_MAINTENANCE.md` - Script documentation
