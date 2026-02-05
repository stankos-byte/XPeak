# Firebase Setup Guide for XPeak

This guide will help you set up Firebase for XPeak, including secure AI API proxying through Cloud Functions.

## Prerequisites

- Node.js 20+ installed
- A Firebase account
- A Google Cloud project (created automatically with Firebase)
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "xpeak")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 3: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

## Step 4: Initialize Firebase in Your Project

```bash
# Navigate to your project root
cd /path/to/xpeak

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Functions: Configure a Cloud Functions directory
# - Firestore: Configure security rules and indexes files
# - Use existing project (select your Firebase project)
# - Language: TypeScript
# - ESLint: Yes (optional)
# - Install dependencies: Yes
```

## Step 5: Configure Firebase in Your App

1. Get your Firebase configuration:
   - Go to Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Copy the `firebaseConfig` object

2. Create `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Step 6: Set Up Firebase Secrets Manager

The Gemini API key and Polar access token are stored securely in Firebase Secrets Manager:

```bash
# Make sure you're in the project root
firebase use your-project-id

# Set the Gemini API key secret
firebase functions:secrets:set GEMINI_API_KEY

# When prompted, paste your Gemini API key
# The secret will be encrypted and stored securely

# Set the Polar access token secret (for billing/payments)
firebase functions:secrets:set POLAR_ACCESS_TOKEN

# When prompted, paste your Polar access token
# Get it from: https://polar.sh/settings
```

**Important:** Never commit your API keys to version control. They're stored securely in Firebase Secrets Manager.

## Step 7: Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 8: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy a specific function
firebase deploy --only functions:geminiProxy
```

## Step 9: Enable Firebase Authentication

1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable authentication providers:
   - **Email/Password**: Recommended for basic auth
   - **Google**: For Google Sign-In
   - **Apple**: For Apple Sign-In (if needed)

## Step 10: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

## Step 11: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test AI features:
   - Sign up/login to your app
   - Try using the Quest Oracle or AI Assistant
   - Check browser console for any errors

3. Check Cloud Functions logs:
   ```bash
   firebase functions:log
   ```

## Troubleshooting

### Error: "User must be authenticated"
- Make sure Firebase Authentication is enabled
- Verify users can sign up/login
- Check that `getAuth()` is properly initialized

### Error: "Gemini API key is not configured"
- Verify the secret is set: `firebase functions:secrets:access GEMINI_API_KEY`
- Redeploy functions after setting the secret
- Check function logs for detailed errors

### Error: "Firebase is not configured"
- Verify `.env` file exists with all required variables
- Check that environment variables start with `VITE_`
- Restart the dev server after changing `.env`

### Functions deployment fails
- Check Node.js version (should be 20+)
- Verify `functions/package.json` has correct dependencies
- Check Firebase CLI is up to date: `npm install -g firebase-tools@latest`

## Security Best Practices

1. **Never commit secrets**: The `.env` file is in `.gitignore`
2. **Use Firebase Secrets**: API keys are stored in Firebase Secrets Manager
3. **Enable Authentication**: All AI features require user authentication
4. **Review Security Rules**: Firestore rules are in `firestore.rules`
5. **Monitor Usage**: Check Firebase Console for function invocations and costs

## Cost Considerations

- Firebase Functions: Free tier includes 2 million invocations/month
- Gemini API: Check [Google AI pricing](https://ai.google.dev/pricing)
- Firestore: Free tier includes 1 GB storage and 50K reads/day

## Polar Payment Integration

XPeak uses Polar.sh for subscription payments. Here's how to set it up:

### 1. Create a Polar Account

1. Go to [Polar.sh](https://polar.sh) and sign up
2. Complete your organization setup
3. Set up your payment methods and bank account

### 2. Create Products in Polar

Create two products for the Pro plan:

1. **Monthly Plan**:
   - Price: $4/month
   - Recurring: Monthly
   - Copy the Product ID (e.g., `fa779526-2149-490e-ad0b-0b087525d8a0`)

2. **Yearly Plan**:
   - Price: $40/year
   - Recurring: Yearly
   - Copy the Product ID (e.g., `42ab603f-1f3b-4592-931b-b25f0d615437`)

### 3. Get Your Polar Access Token

1. Go to Polar Settings → [API Keys](https://polar.sh/settings)
2. Click "Create Access Token"
3. Give it a name (e.g., "XPeak Production")
4. Copy the access token (starts with `polar_`)

### 4. Set the Polar Secret in Firebase

```bash
firebase functions:secrets:set POLAR_ACCESS_TOKEN
# Paste your Polar access token when prompted
```

### 5. Update Product IDs (if different)

If your Polar product IDs are different from the defaults, update them in:

`services/billingService.ts`:

```typescript
export const POLAR_PRODUCTS = {
  MONTHLY: 'your-monthly-product-id',
  YEARLY: 'your-yearly-product-id',
} as const;
```

### 6. Deploy Functions

```bash
firebase deploy --only functions
```

### 7. Test the Checkout Flow

1. Run your app: `npm run dev`
2. Navigate to the Plans page
3. Click "Upgrade to Pro"
4. You should be redirected to Polar checkout

### Polar Webhook Integration (Optional)

For production, you should set up webhooks to handle subscription events:

1. Go to Polar Settings → Webhooks
2. Add endpoint: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/polarWebhook`
3. Select events: `checkout.completed`, `subscription.updated`, `subscription.canceled`
4. Create a Cloud Function to handle these webhooks

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Secrets Manager](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Polar.sh Documentation](https://docs.polar.sh)
