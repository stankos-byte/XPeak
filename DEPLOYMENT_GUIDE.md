# 🚀 XPeak Deployment Guide

This guide will help you deploy your XPeak app to Firebase Hosting.

## 📋 Pre-Deployment Checklist

Before your first deployment, complete these steps:

### 1. Set Up Firebase Hosting

```bash
firebase init hosting
```

Choose these options:
- ✅ Use existing project: `xpeak-prod-25154`
- ✅ Public directory: `dist`
- ✅ Single-page app: **Yes**
- ✅ Automatic builds with GitHub: **Optional** (recommended)
- ❌ Overwrite index.html: **No**

This will update your `firebase.json` with hosting configuration.

### 2. Verify Environment Variables

Make sure you have a `.env` file (not `.env.example`):

```env
VITE_FIREBASE_API_KEY=AIzaSyARBy_sJLAGIuYU0Boo2VsrwEOYVomrrcg
VITE_FIREBASE_AUTH_DOMAIN=xpeak-prod-25154.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xpeak-prod-25154
VITE_FIREBASE_STORAGE_BUCKET=xpeak-prod-25154.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=646923597963
VITE_FIREBASE_APP_ID=1:646923597963:web:a367494d3cb7fdc40f7c8e
VITE_FIREBASE_MEASUREMENT_ID=G-FM1LPTNEMC
VITE_USE_FIREBASE_EMULATORS=false
```

⚠️ **Important**: Set `VITE_USE_FIREBASE_EMULATORS=false` for production!

### 3. Set Up Firebase Secrets (First Time Only)

```bash
# Gemini API key (for AI features)
firebase functions:secrets:set GEMINI_API_KEY

# Polar access token (for payments)
firebase functions:secrets:set POLAR_ACCESS_TOKEN
```

### 4. Deploy Cloud Functions (First Time)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Deploy Firestore Rules (First Time)

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 🚀 Deployment Commands

### Quick Deploy (Frontend Only)

Most updates are frontend-only and can be deployed quickly:

```bash
npm run build && firebase deploy --only hosting
```

⏱️ **Time**: ~2-5 minutes

### Full Deployment

Deploy everything (frontend + functions + rules):

```bash
npm run build && firebase deploy
```

⏱️ **Time**: ~5-10 minutes

### PowerShell Script (Windows)

Use the included deployment script for an interactive menu:

```powershell
.\deploy.ps1
```

### Manual Deployment Steps

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Preview locally** (optional):
   ```bash
   npm run preview
   ```

3. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

## 🔄 Update Workflow

### Making Frontend Changes

1. **Make changes** (via Cursor AI or manually)
2. **Test locally**:
   ```bash
   npm run dev
   ```
3. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Making Backend Changes

1. **Update Cloud Functions** in `functions/src/index.ts`
2. **Test with emulators**:
   ```bash
   firebase emulators:start
   ```
3. **Deploy functions**:
   ```bash
   firebase deploy --only functions
   ```

### Making Firestore Changes

1. **Update rules** in `firestore.rules`
2. **Deploy rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## 📊 Deployment Checklist

Before each deployment:

- [ ] All changes tested locally with `npm run dev`
- [ ] No console errors in browser
- [ ] `npm run build` completes without errors
- [ ] `.env` file has correct production values
- [ ] Firebase project is correct: `firebase use xpeak-prod`
- [ ] Git changes committed (optional but recommended)

## 🌐 Your App URLs

After deployment, your app will be available at:

- **Primary**: https://xpeak-prod-25154.web.app
- **Alternative**: https://xpeak-prod-25154.firebaseapp.com

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails

```bash
# Check Firebase login
firebase login

# Verify project
firebase projects:list

# Use correct project
firebase use xpeak-prod
```

### Functions Deployment Fails

```bash
# Check Node.js version (should be 20+)
node --version

# Update Firebase CLI
npm install -g firebase-tools@latest

# Check functions logs
firebase functions:log
```

### App Shows Old Version

```bash
# Clear browser cache
# Or use incognito/private browsing mode

# Force cache invalidation (add to firebase.json hosting):
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

## 🎯 Quick Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm run dev` | Local development | - |
| `npm run build` | Build for production | 30s |
| `npm run preview` | Preview production build | - |
| `firebase deploy --only hosting` | Deploy frontend | 2-3 min |
| `firebase deploy --only functions` | Deploy backend | 3-5 min |
| `firebase deploy` | Deploy everything | 5-10 min |
| `firebase emulators:start` | Test locally with Firebase | - |

## 💡 Tips

1. **Fast iterations**: Use `firebase deploy --only hosting` for frontend-only changes
2. **Test locally**: Always test with `npm run dev` before deploying
3. **Use the script**: The `deploy.ps1` script makes deployment easier
4. **Monitor logs**: Check Firebase Console → Functions → Logs for issues
5. **Version control**: Commit changes to git before deploying
6. **Staging environment**: Consider setting up a staging Firebase project

## 🤖 Using Cursor AI for Updates

**Yes, you can prompt changes directly in Cursor and deploy!**

Example workflow:
1. Tell Cursor: *"Make the dashboard cards 20% larger"*
2. Cursor makes the changes
3. Test: `npm run dev`
4. Deploy: `npm run build && firebase deploy --only hosting`
5. Done! ✅

Most UI updates take just **2-5 minutes** from prompt to live!

## 📈 Monitoring

After deployment, monitor your app:

- **Firebase Console**: https://console.firebase.google.com/project/xpeak-prod-25154
- **Hosting metrics**: Check traffic, bandwidth usage
- **Functions logs**: Monitor AI API calls and errors
- **Firestore usage**: Monitor database reads/writes
- **Authentication**: Track user signups and logins

## 🔒 Security Reminders

- ✅ Never commit `.env` file
- ✅ Use Firebase Secrets for API keys
- ✅ Keep Firestore rules secure
- ✅ Monitor Firebase Console for unusual activity
- ✅ Review function logs regularly

---

**Ready to deploy?** Run `.\deploy.ps1` and select your deployment option!
