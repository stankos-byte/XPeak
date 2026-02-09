# 🚀 Quick Deploy Guide - XPeak.app

**Total Time:** 2-4 hours (+ 24-48h for DNS)

---

## ⚡ QUICK START (Follow in order)

### 1. Configure Environment (10 minutes)

**Get Firebase Config:**
```powershell
# Open Firebase Console
start https://console.firebase.google.com/project/xpeak-prod-25154/settings/general

# Scroll to "Your apps" → Web app
# Copy all values into .env.production file
```

**Get Sentry DSN:**
```powershell
# Sign up at Sentry (free)
start https://sentry.io

# Create project → Select React → Copy DSN
# Add to .env.production
```

---

### 2. Enable App Check (15 minutes)

**Step 1:** Get reCAPTCHA keys
```powershell
start https://www.google.com/recaptcha/admin
```
- Create site (reCAPTCHA v3)
- Add domains: `xpeak.app`, `www.xpeak.app`, `xpeak-prod-25154.web.app`
- Copy site key + secret key

**Step 2:** Enable in Firebase
```powershell
start https://console.firebase.google.com/project/xpeak-prod-25154/appcheck
```
- Click "Get Started"
- Register app → reCAPTCHA v3
- Enter keys → Save
- Go to "Enforcement" → Enable for Cloud Functions

---

### 3. Set Secrets (5 minutes)

```powershell
# Gemini API (get from: https://aistudio.google.com/app/apikey)
firebase functions:secrets:set GEMINI_API_KEY

# Polar tokens (get from: https://polar.sh/settings)
firebase functions:secrets:set POLAR_ACCESS_TOKEN
firebase functions:secrets:set POLAR_WEBHOOK_SECRET
```

---

### 4. Deploy Everything (30 minutes)

```powershell
# Deploy Firestore rules & indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Build and deploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions

# Build and deploy frontend
npm run build
firebase deploy --only hosting
```

**Your app is now live at:**
- https://xpeak-prod-25154.web.app
- https://xpeak-prod-25154.firebaseapp.com

---

### 5. Configure Custom Domain (20 minutes + DNS wait)

**In Firebase Console:**
```powershell
start https://console.firebase.google.com/project/xpeak-prod-25154/hosting/sites
```
- Add custom domain → `xpeak.app`
- Copy DNS records shown

**In Namecheap:**
1. Log in → Domain List → xpeak.app → Manage
2. Advanced DNS → Add records Firebase provided
3. Save changes

**Wait:** 24-48 hours for DNS propagation (usually 1-4 hours)

---

### 6. Configure Polar Webhook (5 minutes)

```powershell
start https://polar.sh/settings/webhooks
```
- Add webhook
- URL: `https://us-central1-xpeak-prod-25154.cloudfunctions.net/polarWebhook`
- Secret: Same as POLAR_WEBHOOK_SECRET you set earlier
- Events: Select all subscription events
- Save

---

### 7. Verify Everything Works (15 minutes)

**Test checklist:**
- [ ] Visit https://xpeak-prod-25154.web.app
- [ ] Sign up with new account
- [ ] Create a task
- [ ] Check console for errors
- [ ] Verify Sentry received events (check dashboard)
- [ ] Test App Check (functions should require valid tokens)

**Check indexes:**
```powershell
start https://console.firebase.google.com/project/xpeak-prod-25154/firestore/databases/-default-/indexes
```
- All should show "Enabled" (wait 5-10 min if building)

---

## 🎯 DONE!

Your app is live! Now monitor:
- **Sentry:** https://sentry.io (check for errors)
- **Firebase Console:** https://console.firebase.google.com/project/xpeak-prod-25154
- **Custom domain:** https://xpeak.app (after DNS propagates)

---

## 🚨 Quick Troubleshooting

**Functions return 401?**
- Check App Check is enabled
- Verify reCAPTCHA keys are correct
- Check domains are whitelisted

**Custom domain not working?**
- Wait 24-48 hours
- Verify DNS records in Namecheap
- Check: https://dnschecker.org/

**Rate limit errors?**
- Edit `functions/src/index.ts` → increase `RATE_LIMITS`
- Redeploy functions

---

## 📋 Full Documentation

For detailed information, see:
- **Quick Checklist:** `XPEAK_DEPLOYMENT_CHECKLIST.md`
- **Complete Guide:** `DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `XPEAK_DEPLOYMENT_CHECKLIST.md` (Troubleshooting section)

---

**Estimated cost:** $10-35/month for 100 active users

**Questions?** Check the full guides above or Firebase/Sentry documentation.

🎉 **Congratulations on launching XPeak!** 🚀
