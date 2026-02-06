# 🛡️ How to Enable Firebase App Check (Optional but Recommended)

Firebase App Check protects your backend resources from abuse by ensuring requests come from your authentic app, not bots or unauthorized clients.

## Why Enable App Check?

- 🛡️ **Prevents bot abuse** of your AI API (Gemini costs money per request)
- 🔒 **Protects Cloud Functions** from unauthorized access
- 💰 **Reduces costs** by blocking fake traffic
- ✅ **Industry best practice** for production apps

## Prerequisites

- ✅ Your app is deployed to Firebase Hosting
- ✅ You have access to Firebase Console
- ✅ You have the Firebase CLI installed

---

## Step 1: Enable App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/xpeak-prod-25154)
2. Click **App Check** in the left sidebar
3. Click **Get Started**
4. Select your web app from the list
5. Choose **reCAPTCHA v3** as the provider
6. Click **Save**

---

## Step 2: Register Your Site with reCAPTCHA

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click **+** to create a new site
3. Fill in the form:
   - **Label**: XPeak Production
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `xpeak-prod-25154.web.app`
     - `xpeak-prod-25154.firebaseapp.com`
     - `localhost` (for testing)
4. Accept the terms and click **Submit**
5. Copy your **Site Key** and **Secret Key**

---

## Step 3: Configure App Check in Firebase

1. Back in Firebase Console → App Check
2. Click on your web app
3. Paste the **reCAPTCHA Site Key** you just got
4. Click **Save**

---

## Step 4: Add App Check to Your Frontend

Install the App Check SDK:

```bash
npm install firebase/app-check
```

Update `config/firebase.ts`:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// After initializing Firebase app
if (isFirebaseConfigured() && !useEmulators) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Initialize App Check
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
  
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app);
}
```

---

## Step 5: Enable App Check in Cloud Functions

Update `functions/src/index.ts` for each Cloud Function:

### Before:
```typescript
export const geminiProxy = onCall(
  {
    secrets: [geminiApiKey],
    enforceAppCheck: false, // ❌ Currently disabled
  },
  async (request) => { ... }
);
```

### After:
```typescript
export const geminiProxy = onCall(
  {
    secrets: [geminiApiKey],
    enforceAppCheck: true, // ✅ Now enforced
  },
  async (request) => { ... }
);
```

**Update these functions:**
- `geminiProxy` (line 1081)
- `createPolarCheckout` (line 418)
- `cancelPolarSubscription` (line 772)
- `getPolarCustomerPortal` (line 882)
- `getPolarInvoices` (line 952)

---

## Step 6: Deploy Everything

```bash
# 1. Commit your changes
git add .
git commit -m "Enable Firebase App Check for production security"

# 2. Rebuild and deploy frontend
npm run build
firebase deploy --only hosting

# 3. Redeploy Cloud Functions with App Check enabled
firebase deploy --only functions
```

---

## Step 7: Test App Check

1. Open your deployed app in a browser
2. Open DevTools → Console
3. You should see: `Firebase App Check token refreshed`
4. Try using AI features - they should work normally
5. Check Firebase Console → App Check → Metrics to see token validation

---

## Troubleshooting

### Error: "App Check token is invalid"

**Solution:**
```typescript
// Add debug token for testing
declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
  }
}

if (import.meta.env.DEV) {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

### Error: "reCAPTCHA site key is invalid"

**Solution:** Double-check that you:
1. Registered the correct domains in reCAPTCHA admin
2. Copied the Site Key (not Secret Key) to your code
3. Entered the Site Key in Firebase Console → App Check

### App Check working but AI calls fail

**Solution:** Make sure you redeployed Cloud Functions with `enforceAppCheck: true`

---

## Monitoring App Check

### View Metrics

1. Go to Firebase Console → App Check
2. Click on your app
3. View:
   - **Token verifications** - How many requests were validated
   - **Invalid tokens** - Potential abuse attempts blocked
   - **Error rate** - If high, may need to adjust reCAPTCHA threshold

### Alert on Abuse

Set up Cloud Monitoring alerts:
1. Firebase Console → App Check → Metrics
2. Click "Create Alert"
3. Set threshold for invalid tokens (e.g., > 100/hour)
4. Add your email for notifications

---

## Cost Considerations

### reCAPTCHA Pricing
- **Free tier**: 1,000,000 assessments per month
- **After free tier**: $1 per 1,000 assessments
- For most apps, you'll stay in the free tier

### Firebase App Check
- **Free** - No additional cost from Firebase
- Only reCAPTCHA costs apply (if you exceed free tier)

---

## Security Benefits

With App Check enabled, your app is protected against:
- ✅ **Bot attacks** - Automated abuse of your AI API
- ✅ **Credential stuffing** - Brute force login attempts
- ✅ **API scraping** - Unauthorized data extraction
- ✅ **DDoS attacks** - Distributed denial of service
- ✅ **Cost exploitation** - Running up your Gemini API bill

---

## Development vs Production

### Development (Local)
```typescript
// .env.local
VITE_USE_FIREBASE_EMULATORS=true
// App Check automatically bypassed with emulators
```

### Production
```typescript
// .env
VITE_USE_FIREBASE_EMULATORS=false
// App Check fully enforced
```

---

## When to Enable App Check

**Enable Now (Before Launch):**
- ✅ If you're launching to public users
- ✅ If AI features are core to your app (they cost money per request)
- ✅ If you want maximum security from day 1

**Enable Later:**
- ⚠️ If you're in private beta with trusted users only
- ⚠️ If you want to test production without it first
- ⚠️ If you're debugging deployment issues

---

## Summary Checklist

- [ ] Enable App Check in Firebase Console
- [ ] Register site with Google reCAPTCHA
- [ ] Add App Check SDK to frontend code
- [ ] Set `enforceAppCheck: true` in all Cloud Functions
- [ ] Deploy frontend and functions
- [ ] Test that AI features still work
- [ ] Monitor App Check metrics in Firebase Console

---

**Estimated Setup Time:** 15-20 minutes

**Security Impact:** High - Protects against bots and API abuse

**Recommended:** Yes, especially if you're launching publicly

---

For more information:
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
