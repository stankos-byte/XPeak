# 🔒 Quick Security Checklist Before Deployment

## ✅ Critical Items (MUST DO)

### 1. Set Production Environment Variables
- [ ] Create `.env` file (not `.env.local`) with production values
- [ ] Set `VITE_USE_FIREBASE_EMULATORS=false` in `.env`
- [ ] Verify all Firebase config values are correct

### 2. Configure Firebase Secrets
Run these commands and enter the actual values when prompted:

```bash
# Set Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY

# Set Polar Access Token
firebase functions:secrets:set POLAR_ACCESS_TOKEN

# Set Polar Webhook Secret (if using webhooks)
firebase functions:secrets:set POLAR_WEBHOOK_SECRET
```

**Verify secrets are set:**
```bash
firebase functions:secrets:access GEMINI_API_KEY
firebase functions:secrets:access POLAR_ACCESS_TOKEN
```

### 3. Deploy Cloud Functions First
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Wait for functions to deploy successfully before deploying the frontend.

### 4. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

### 6. Test Build Locally
```bash
npm run build
npm run preview
```

Visit http://localhost:4173 and test:
- [ ] Login/Signup works
- [ ] AI features work (Quest Oracle, Assistant)
- [ ] No console errors

### 7. Deploy Frontend
```bash
npm run build && firebase deploy --only hosting
```

---

## 💡 Recommended (Should Do)

### Enable Firebase App Check
1. Go to Firebase Console → App Check
2. Click "Get Started"
3. Register your web app with reCAPTCHA v3
4. Update Cloud Functions to set `enforceAppCheck: true`
5. Redeploy functions

### Clean Up Repository
```bash
# Remove .env.local from git if it contains real values
git rm --cached .env.local
git add .gitignore
git commit -m "Remove .env.local from version control"
```

---

## 🎯 Post-Deployment Verification

After deploying, verify these features work:

### Authentication
- [ ] Email/Password signup
- [ ] Email/Password login
- [ ] Google login (if enabled)
- [ ] Password reset

### AI Features
- [ ] Quest Oracle generates quests
- [ ] Task analysis works
- [ ] Assistant chat responds
- [ ] No "API key not configured" errors

### Payment Features (if using Polar)
- [ ] Checkout redirects to Polar
- [ ] Subscription status updates after payment
- [ ] Cancel subscription works

### Data Security
- [ ] Users can only see their own data
- [ ] Profile pictures upload successfully
- [ ] File size limits enforced
- [ ] Unauthorized access returns proper errors

---

## 🚨 Security Red Flags to Watch For

If you see any of these, **DO NOT DEPLOY**:

- ❌ API keys visible in browser DevTools Network tab
- ❌ Users can access other users' data
- ❌ Cloud Functions return 500 errors with stack traces
- ❌ Unauthenticated users can call AI functions
- ❌ `.env` file committed to git
- ❌ Console shows "Firebase not configured" errors

---

## 📊 Quick Security Status

**Current Status: ✅ SECURE - Ready to Deploy**

Your app has:
- ✅ API keys properly secured in Firebase Secrets
- ✅ Authentication required for all sensitive operations
- ✅ Firestore rules enforce data isolation
- ✅ Storage rules validate file uploads
- ✅ Payment webhooks verify signatures
- ✅ No secrets in source code

**Minor improvements:**
- ⚠️ Firebase App Check not enabled (recommended but optional)
- ⚠️ Some console.log statements in production code (low priority)

---

## 🎉 You're Ready!

Once you've completed the **Critical Items** checklist above, your app is secure and ready for production deployment!

**Estimated time to deploy:** 15-30 minutes

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
