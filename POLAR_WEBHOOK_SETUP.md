# Polar Webhook Configuration Guide

This guide explains how to configure webhooks in your Polar dashboard to enable real-time subscription updates.

## Prerequisites

Before configuring webhooks, ensure you have:
1. Deployed Cloud Functions to Firebase (with the `polarWebhook` function)
2. Set the `POLAR_WEBHOOK_SECRET` in Firebase Secrets Manager
3. Your Firebase project URL

## Steps to Configure Polar Webhooks

### 1. Get Your Webhook URL

Your webhook URL will be in this format:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/polarWebhook
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID (e.g., `xpeak-prod-25154`).

**Example:**
```
https://us-central1-xpeak-prod-25154.cloudfunctions.net/polarWebhook
```

### 2. Access Polar Dashboard

1. Go to [Polar.sh](https://polar.sh/)
2. Sign in to your account
3. Navigate to **Settings** → **Webhooks**

### 3. Create a New Webhook

1. Click **"Add Webhook"** or **"Create Webhook"**
2. Enter your webhook URL (from step 1)
3. Generate a webhook secret (Polar will provide this)
4. Select the following events to subscribe to:
   - `checkout.completed` - When a user completes checkout
   - `subscription.updated` - When subscription details change
   - `subscription.canceled` - When a subscription is canceled

### 4. Save the Webhook Secret

Copy the webhook secret provided by Polar and set it in Firebase:

```bash
firebase functions:secrets:set POLAR_WEBHOOK_SECRET
```

When prompted, paste the webhook secret from Polar.

### 5. Deploy Your Functions

After setting the secret, deploy your Cloud Functions:

```bash
firebase deploy --only functions
```

### 6. Test the Webhook

To verify the webhook is working:

1. In Polar dashboard, find the webhook you just created
2. Look for a **"Test"** or **"Send Test Event"** button
3. Send a test event
4. Check Firebase Functions logs to verify the event was received:

```bash
firebase functions:log --only polarWebhook
```

You should see logs indicating the webhook was received and processed.

## Webhook Events

The `polarWebhook` function handles these events:

### `checkout.completed`
Triggered when a user successfully completes a checkout.
- Creates a new subscription document in Firestore
- Sets subscription status to "active"
- Records billing cycle and period dates

### `subscription.updated`
Triggered when subscription details change (e.g., renewal, status change).
- Updates subscription status
- Updates period dates
- Updates `cancelAtPeriodEnd` flag

### `subscription.canceled`
Triggered when a subscription is canceled.
- Updates subscription status to "canceled"
- Downgrades plan to "free"

## Troubleshooting

### Webhook not receiving events

1. **Verify URL**: Ensure the webhook URL is correct
2. **Check deployment**: Verify the function is deployed: `firebase functions:list`
3. **Check logs**: Look for errors in Firebase logs
4. **Verify secret**: Ensure `POLAR_WEBHOOK_SECRET` is set correctly

### Signature validation failing

1. **Secret mismatch**: Ensure the secret in Firebase matches the one in Polar
2. **Redeploy**: After setting secret, redeploy functions
3. **Check headers**: Verify Polar is sending `svix-id`, `svix-timestamp`, and `svix-signature` headers

### Events not updating Firestore

1. **Check permissions**: Ensure Cloud Functions have permission to write to Firestore
2. **Check metadata**: Verify user ID is being passed in webhook payload metadata
3. **Review logs**: Check function logs for specific error messages

## Security Notes

- The webhook validates signatures using Svix standard
- Only valid, signed requests from Polar will be processed
- Firestore rules prevent direct client writes to subscription documents
- All subscription updates must go through the webhook or Cloud Functions

## Support

If you encounter issues:
1. Check Firebase Functions logs: `firebase functions:log`
2. Review Polar webhook delivery logs in their dashboard
3. Consult Polar API documentation: https://api.polar.sh/docs
4. Check Firestore for subscription document updates
