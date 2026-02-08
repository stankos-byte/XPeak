# 🔐 Security Setup & Credential Rotation Guide

## 🚨 URGENT: Rotate Your Exposed Firebase Credentials

Your Firebase credentials were exposed and **MUST be rotated immediately**.

### Exposed Credentials:
- **API Key**: `AIzaSyARBy_sJLAGIuYU0Boo2VsrwEOYVomrrcg`
- **Project**: `xpeak-prod-25154`

---

## Step 1: Rotate Firebase Credentials (DO THIS NOW)

### Option A: Restrict API Key (Recommended - 5 minutes)

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select project: `xpeak-prod-25154`

2. **Find Your Web API Key**:
   - Look for the key starting with `AIzaSyARBy_sJLAGIuYU0Boo2VsrwEOYVomrrcg`

3. **Add Restrictions**:
   - Click on the API key
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add your domains:
       ```
       https://your-domain.com/*
       http://localhost:5173/*
       ```
   - Under "API restrictions":
     - Select "Restrict key"
     - Enable only:
       - Identity Toolkit API
       - Firebase Authentication
       - Cloud Firestore API
       - Cloud Functions API
   - Click **Save**

4. **Update Your .env.local**:
   - The key stays the same, but it's now restricted to your domains

### Option B: Create New Firebase Web App (More Secure - 10 minutes)

1. **Firebase Console**:
   - Visit: https://console.firebase.google.com/
   - Select project: `xpeak-prod-25154`

2. **Delete Old Web App**:
   - Go to: Project Settings → General
   - Scroll to "Your apps" section
   - Find your existing web app
   - Click the 3-dot menu → Delete app
   - Confirm deletion

3. **Create New Web App**:
   - Click "Add app" → Web (</>) icon
   - App nickname: `XPeak Web App`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

4. **Copy New Configuration**:
   ```javascript
   const firebaseConfig = {
     apiKey: "NEW_API_KEY_HERE",
     authDomain: "xpeak-prod-25154.firebaseapp.com",
     projectId: "xpeak-prod-25154",
     storageBucket: "xpeak-prod-25154.firebasestorage.app",
     messagingSenderId: "NEW_SENDER_ID",
     appId: "NEW_APP_ID",
     measurementId: "NEW_MEASUREMENT_ID"
   };
   ```

5. **Update Your .env.local**:
   ```env
   VITE_FIREBASE_API_KEY=NEW_API_KEY_HERE
   VITE_FIREBASE_AUTH_DOMAIN=xpeak-prod-25154.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=xpeak-prod-25154
   VITE_FIREBASE_STORAGE_BUCKET=xpeak-prod-25154.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=NEW_SENDER_ID
   VITE_FIREBASE_APP_ID=NEW_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID=NEW_MEASUREMENT_ID
   VITE_USE_FIREBASE_EMULATORS=false
   ```

6. **Test Your App**:
   ```bash
   npm run dev
   ```

---

## Step 2: Verify Security Setup ✅

Your project now has the following security measures in place:

### ✅ Automated Secret Scanning
- **Husky pre-commit hook**: Automatically scans for secrets before each commit
- **Secretlint**: Detects hardcoded API keys, tokens, and credentials
- **Manual check**: Run `npm run check-secrets` anytime

### ✅ AI Protection
- **`.cursorignore`**: Prevents Cursor AI from reading `.env.local` and other sensitive files

### ✅ Git Protection
- **`.gitignore`**: Prevents `.env` files from being committed
- **Pre-commit hooks**: Blocks commits containing secrets

### ✅ Documentation
- **`.env.example`**: Template with security best practices
- **This guide**: Step-by-step rotation instructions

---

## Step 3: Test the Secret Scanning

### Test 1: Manual Scan
```bash
npm run check-secrets
```
Expected: Should complete with no errors (or warnings about existing .env files)

### Test 2: Pre-commit Hook Test
```bash
# Stage a test file
git add .

# Try to commit (hook will run automatically)
git commit -m "Test security setup"
```
Expected: Hook scans files before commit proceeds

### Test 3: Intentional Secret Detection (Optional)
1. Create a test file: `test-secret.txt`
2. Add a fake API key: `AKIAIOSFODNN7EXAMPLE`
3. Try to stage and commit it
4. Expected: Hook should detect and block the commit

---

## Security Best Practices

### ✅ DO:
- ✅ Keep `.env.local` in `.gitignore` (already configured)
- ✅ Rotate credentials immediately if exposed
- ✅ Use different credentials for dev/staging/prod
- ✅ Run `npm run check-secrets` before pushing
- ✅ Review pre-commit hook output carefully
- ✅ Restrict Firebase API keys to your domains
- ✅ Use Firebase Functions secrets for server-side keys

### ❌ DON'T:
- ❌ Commit `.env` or `.env.local` files
- ❌ Share credentials in chat, email, or Slack
- ❌ Use production keys in development
- ❌ Hardcode secrets in source code
- ❌ Disable pre-commit hooks
- ❌ Ignore secret detection warnings

---

## Firebase Functions Secrets

Server-side secrets (Gemini API, Polar tokens) are managed separately:

```bash
cd functions

# Set secrets (will prompt for values)
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set POLAR_ACCESS_TOKEN
firebase functions:secrets:set POLAR_WEBHOOK_SECRET

# List all secrets
firebase functions:secrets:list

# Delete a secret
firebase functions:secrets:delete SECRET_NAME
```

---

## Emergency Response Plan

### If credentials are accidentally committed:

1. **Immediately rotate** the exposed credentials (see Step 1)
2. **Remove from Git history** (if already pushed):
   ```bash
   # Install BFG Repo-Cleaner or use git-filter-repo
   git filter-repo --path .env.local --invert-paths
   git push origin --force --all
   ```
3. **Verify rotation** - test that old credentials no longer work
4. **Monitor logs** - check Firebase/Polar for suspicious activity
5. **Update team** - notify all developers of the rotation

---

## Monitoring & Maintenance

### Weekly Checks:
- Review Firebase Authentication logs for suspicious activity
- Check Firestore usage metrics for unusual patterns
- Verify API key restrictions are still in place

### Monthly:
- Rotate API keys as a precaution
- Review and update security rules
- Audit user permissions

---

## Additional Security Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Secretlint Documentation](https://github.com/secretlint/secretlint)
- [Husky Git Hooks](https://typicode.github.io/husky/)

---

## Questions?

If you encounter issues:
1. Check Firebase Console for error messages
2. Verify API key restrictions
3. Test with Firebase Emulators first (`VITE_USE_FIREBASE_EMULATORS=true`)
4. Review Cloud Functions logs in Firebase Console

**Remember**: Security is an ongoing process, not a one-time setup!
