# 🚀 XPeak.app Deployment Checklist

**Domain:** xpeak.app (Namecheap)  
**Firebase Project:** xpeak-prod-25154  
**Date:** February 9, 2026

---

## ✅ PRE-DEPLOYMENT TASKS (Do These First!)

### 1️⃣ Configure Environment Variables

**ACTION REQUIRED:** Fill in `.env.production` with your actual Firebase values:

```bash
# Get Firebase config:
# 1. Go to: https://console.firebase.google.com/project/xpeak-prod-25154/settings/general
# 2. Scroll to "Your apps" → Web app
# 3. Copy all values to .env.production
```

**Get Sentry DSN:**
1. Sign up at https://sentry.io (free tier is fine)
2. Create new project → Select "React"
3. Copy DSN to `.env.production` (VITE_SENTRY_DSN)

---

### 2️⃣ Enable Firebase App Check (CRITICAL!)

**Why:** Protects your Cloud Functions from abuse and unauthorized access.

**Steps:**
1. Go to: https://console.firebase.google.com/project/xpeak-prod-25154/appcheck
2. Click "Get Started"
3. Register your web app

**Configure reCAPTCHA v3:**
1. Go to: https://www.google.com/recaptcha/admin
2. Create new site:
   - **Label:** XPeak App
   - **Type:** reCAPTCHA v3
   - **Domains:** 
     - `xpeak.app`
     - `www.xpeak.app`
     - `xpeak-prod-25154.web.app`
     - `xpeak-prod-25154.firebaseapp.com`
3. Copy site key and secret key
4. Back in Firebase App Check:
   - Select reCAPTCHA v3
   - Enter both keys
   - Save

**Enable Enforcement:**
1. In App Check → "Enforcement" tab
2. Enable for:
   - ✅ Cloud Functions
   - ✅ Firestore
3. Save changes

---

### 3️⃣ Set Firebase Function Secrets

**Required secrets:**

```powershell
# Set Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
# Get from: https://aistudio.google.com/app/apikey

# Set Polar Access Token
firebase functions:secrets:set POLAR_ACCESS_TOKEN
# Get from: https://polar.sh/settings → API Keys

# Set Polar Webhook Secret
firebase functions:secrets:set POLAR_WEBHOOK_SECRET
# Get from: https://polar.sh/settings/webhooks
```

**Verify secrets are set:**
```powershell
firebase functions:secrets:access GEMINI_API_KEY
```

---

### 4️⃣ Configure Custom Domain on Firebase

**Steps:**
1. Go to: https://console.firebase.google.com/project/xpeak-prod-25154/hosting/sites
2. Click "Add custom domain"
3. Enter: `xpeak.app`
4. Firebase will provide DNS records

**Add DNS Records in Namecheap:**
1. Log into Namecheap
2. Go to Domain List → xpeak.app → Manage
3. Click "Advanced DNS"
4. Add the records Firebase provides (usually A records and/or TXT records)

**Also add www subdomain:**
- Repeat the process for `www.xpeak.app`
- Or set up a redirect from www → apex domain

**Wait Time:** DNS propagation can take 24-48 hours (usually faster)

---

### 5️⃣ Review Firestore Security Rules

Current rules are secure, but verify:

```powershell
# Check current rules
firebase firestore:rules
```

Key security features implemented:
- ✅ Friend request security fixed
- ✅ Rate limits collection protected
- ✅ User data isolated
- ✅ Admin-only maintenance mode

---

### 6️⃣ Build and Test Locally

```powershell
# Build the app
npm run build

# Preview production build locally
npm run preview
```

**Test checklist:**
- [ ] App loads without errors
- [ ] Can sign in/up
- [ ] Can create tasks
- [ ] Console has no critical errors

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Firestore Rules & Indexes

```powershell
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes (takes 5-10 minutes to build)
firebase deploy --only firestore:indexes
```

**Verify indexes:**
- Go to: https://console.firebase.google.com/project/xpeak-prod-25154/firestore/databases/-default-/indexes
- Wait until all show "Enabled" (green)

---

### Step 2: Deploy Cloud Functions

```powershell
# Build functions
cd functions
npm run build
cd ..

# Deploy all functions
firebase deploy --only functions
```

**Expected functions (9 total):**
1. ✅ createPolarCheckout
2. ✅ cancelPolarSubscription
3. ✅ getPolarCustomerPortal
4. ✅ getPolarInvoices
5. ✅ geminiProxy
6. ✅ polarWebhook
7. ✅ cleanupOldChatMessages
8. ✅ setMaintenanceMode
9. ✅ cleanupUserData

**Verify:**
- Go to: https://console.firebase.google.com/project/xpeak-prod-25154/functions
- All 9 functions should show "Active"

---

### Step 3: Deploy Frontend to Firebase Hosting

```powershell
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Initial URLs (before custom domain):**
- https://xpeak-prod-25154.web.app
- https://xpeak-prod-25154.firebaseapp.com

**After DNS propagation (24-48 hours):**
- https://xpeak.app
- https://www.xpeak.app

---

### Step 4: Configure Polar Webhook

Once deployed, configure Polar webhook endpoint:

1. Go to: https://polar.sh/settings/webhooks
2. Add new webhook:
   - **URL:** `https://us-central1-xpeak-prod-25154.cloudfunctions.net/polarWebhook`
   - **Events:** Select all subscription events
   - **Secret:** Use the same secret you set in Firebase secrets
3. Save

**Test webhook:**
- Create a test subscription in Polar
- Check Firebase Functions logs for webhook events

---

### Step 5: Set Up Monitoring

**Sentry Dashboard:**
1. Go to your Sentry project
2. Set up alerts:
   - Error rate > 10/minute
   - New error types
   - Performance degradation

**Firebase Monitoring:**
- Functions: https://console.firebase.google.com/project/xpeak-prod-25154/functions
- Firestore: https://console.firebase.google.com/project/xpeak-prod-25154/firestore
- Analytics: https://console.firebase.google.com/project/xpeak-prod-25154/analytics

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Critical Checks (Do within 1 hour of deployment)

**1. App Loads:**
- [ ] Visit https://xpeak.app (or Firebase URL if DNS not ready)
- [ ] App loads without errors
- [ ] No console errors

**2. Authentication Works:**
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out

**3. Core Features Work:**
- [ ] Create a new task
- [ ] Mark task complete
- [ ] View profile
- [ ] Check leaderboard

**4. App Check is Enforcing:**
```powershell
# Try to call function without valid token (should fail)
curl -X POST https://us-central1-xpeak-prod-25154.cloudfunctions.net/geminiProxy
# Expected: 401 Unauthorized or "App Check token is invalid"
```

**5. Sentry is Receiving Events:**
- Check Sentry dashboard
- Should see initialization event
- Test by triggering an error (then fix it!)

**6. Check Firebase Costs:**
- Go to: https://console.firebase.google.com/project/xpeak-prod-25154/usage
- Verify you're within free tier initially

---

## 📊 MONITORING SCHEDULE

### First 24 Hours
**Check every 2-4 hours:**
- [ ] Sentry error dashboard
- [ ] Firebase Functions execution times
- [ ] Firebase Functions error rate
- [ ] User reports/feedback

### First Week
**Check daily:**
- [ ] Sentry error trends
- [ ] Firebase costs (Functions + Firestore)
- [ ] User feedback and bug reports
- [ ] Performance metrics

**Look for:**
- Error spikes
- Function timeouts
- Rate limit violations
- Unexpected costs

### First Month
**Check weekly:**
- [ ] Overall stability
- [ ] Cost trends
- [ ] Feature usage
- [ ] Plan improvements

---

## 🚨 TROUBLESHOOTING

### Issue: Functions Return 401 Errors

**Cause:** App Check not configured properly

**Solution:**
1. Verify App Check is enabled in Firebase Console
2. Check reCAPTCHA site key is correct
3. Verify domains are whitelisted in reCAPTCHA console
4. Check browser console for App Check token errors

**Temporary workaround:**
```typescript
// In functions/src/index.ts, temporarily set:
enforceAppCheck: false
// Then redeploy functions
// DON'T FORGET TO RE-ENABLE!
```

---

### Issue: Custom Domain Not Working

**Cause:** DNS not propagated or misconfigured

**Solution:**
1. Check DNS records in Namecheap match Firebase requirements
2. Wait 24-48 hours for propagation
3. Test with DNS checker: https://dnschecker.org/
4. Verify SSL certificate is provisioned in Firebase Console

**Check propagation:**
```powershell
nslookup xpeak.app
```

---

### Issue: Rate Limiting Too Aggressive

**Symptom:** Users getting "Rate limit exceeded" errors

**Solution:**
1. Check `rateLimits` collection in Firestore
2. Adjust limits in `functions/src/index.ts`:
```typescript
const RATE_LIMITS = {
  PER_MINUTE: 20,  // Increase from 10
  PER_DAY: 200,    // Increase from 100
};
```
3. Redeploy functions

---

### Issue: High Firebase Costs

**Causes:**
- Missing indexes (expensive queries)
- Function retry loops
- Excessive reads/writes

**Solutions:**
1. Check all indexes are built (Firestore → Indexes)
2. Review Cloud Function logs for errors/retries
3. Check `cleanupOldChatMessages` execution
4. Add pagination to large queries
5. Implement caching where appropriate

---

## 📈 ESTIMATED COSTS

### Firebase (100 active users/day)
- **Firestore:** $5-15/month
- **Functions:** $5-20/month
- **Hosting:** Free (within limits)
- **Storage:** <$1/month
- **Total:** ~$10-35/month

### Sentry
- **Free tier:** 5,000 errors/month (sufficient for launch)
- **Paid plans:** Start at $26/month (only if you exceed free tier)

### Total Monthly Cost
**Expected:** $10-35/month (Firebase) + $0 (Sentry free tier)

---

## 📝 IMPORTANT NOTES

### Security
- ✅ Never commit `.env.production` to git
- ✅ Rotate secrets if exposed
- ✅ Keep Firebase API keys secure (they're domain-restricted)
- ✅ Monitor Sentry for security issues

### Performance
- ✅ All critical indexes deployed
- ✅ App Check enabled (prevents abuse)
- ✅ Rate limiting active
- ✅ Optimized cleanup functions

### Compliance
- ✅ User data deletion (GDPR compliance)
- ✅ Cascading deletes on account deletion
- ✅ Privacy-focused Sentry configuration

---

## 🎯 NEXT STEPS AFTER LAUNCH

### Week 1 Priorities
1. Monitor errors closely (check Sentry daily)
2. Gather user feedback
3. Fix critical bugs immediately
4. Monitor costs

### Week 2-4 Priorities
1. Implement Challenge Refactoring (24-34 hours)
   - See: `CHALLENGE_REFACTORING_DESIGN.md`
2. Add basic memoization (2-3 hours)
   - See: `PHASE3_CODE_QUALITY_FIXES.md`
3. Collect feature usage data
4. Plan v1.1 improvements

### Month 2+ Priorities
1. Complete type safety improvements
2. Add accessibility features
3. Create reusable components
4. Performance optimizations

---

## 📞 SUPPORT RESOURCES

### Documentation
- **This Guide:** `XPEAK_DEPLOYMENT_CHECKLIST.md`
- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **Security:** `PHASE1_SECURITY_FIXES.md`
- **Scalability:** `PHASE2_SCALABILITY_FIXES.md`

### External Resources
- **Firebase Console:** https://console.firebase.google.com/project/xpeak-prod-25154
- **Firebase Docs:** https://firebase.google.com/docs
- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Namecheap Support:** https://www.namecheap.com/support/

### Community
- Firebase Discord: https://discord.gg/firebase
- Reddit: r/Firebase, r/webdev
- Stack Overflow: [firebase] [react] tags

---

## ✅ FINAL CHECKLIST BEFORE LAUNCH

- [ ] `.env.production` configured with all values
- [ ] Sentry account created and DSN added
- [ ] App Check enabled with reCAPTCHA v3
- [ ] Firebase Function secrets set (all 3)
- [ ] Custom domain DNS configured in Namecheap
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed and enabled
- [ ] Cloud Functions deployed (all 9 active)
- [ ] Frontend deployed to Firebase Hosting
- [ ] Polar webhook configured
- [ ] Monitoring set up (Sentry + Firebase)
- [ ] All critical features tested
- [ ] App Check enforcement verified
- [ ] Error tracking confirmed working
- [ ] DNS propagation complete (if using custom domain)

---

**🎉 You're ready to launch XPeak!**

**Estimated deployment time:** 2-4 hours (excluding DNS propagation)

Good luck! 🚀
