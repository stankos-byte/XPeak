# Security Documentation

This document outlines the security measures implemented in XPeak.

## AI API Security

### Server-Side Proxy
- **All AI API calls are proxied through Firebase Cloud Functions**
- The Gemini API key is stored securely in Firebase Secrets Manager
- The API key is **never** exposed to the client-side code
- All requests require Firebase Authentication

### Authentication
- All AI features require user authentication via Firebase Auth
- Unauthenticated requests are rejected with `unauthenticated` error
- User identity is verified on every request

### Input Validation
The Cloud Function implements strict input validation:

1. **Action Whitelisting**: Only allowed actions can be executed
   - `generateQuest`
   - `analyzeTask`
   - `generateChatResponse`
   - `generateFollowUpResponse`

2. **Input Length Limits**:
   - Quest titles: 1-500 characters
   - Task titles: 1-200 characters
   - User input: 1-2000 characters
   - System prompts: Max 5000 characters
   - Messages: Max 50 messages per request
   - Individual messages: Max 2000 characters

3. **Type Validation**: All inputs are validated for correct types
4. **Sanitization**: Inputs are trimmed and validated before processing

### Error Handling
- Internal errors are not exposed to clients
- Generic error messages prevent information leakage
- Detailed errors are logged server-side only

## Client-Side Security

### Environment Variables
- Firebase configuration uses public API keys (safe to expose)
- No sensitive secrets in client-side code
- All `.env` files are in `.gitignore`

### Input Sanitization
- User inputs are validated and sanitized before sending to API
- HTML escaping is applied where needed (see `utils/validation.ts`)

### Authentication State
- Firebase Auth state is checked before all AI operations
- Users are prompted to sign in if not authenticated

## Firestore Security Rules

Security rules are defined in `firestore.rules`:

- Users can only read/write their own data
- Friend requests require proper authentication
- Challenges require participant verification
- All operations require authenticated users

## Rate Limiting Considerations

While not currently implemented, consider adding:

1. **Per-User Rate Limiting**: Limit requests per user per time period
2. **Per-IP Rate Limiting**: Prevent abuse from single IPs
3. **Cost Monitoring**: Track API usage to prevent unexpected costs

Example implementation (to be added):

```typescript
// In Cloud Function
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const userId = context.auth.uid;
const rateLimitRef = db.collection("rateLimits").doc(userId);

// Check rate limit
const rateLimit = await rateLimitRef.get();
const now = Date.now();
const windowMs = 60 * 1000; // 1 minute
const maxRequests = 10;

if (rateLimit.exists) {
  const data = rateLimit.data();
  if (data && now - data.windowStart < windowMs) {
    if (data.count >= maxRequests) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Please try again later."
      );
    }
    await rateLimitRef.update({ count: data.count + 1 });
  } else {
    await rateLimitRef.set({ count: 1, windowStart: now });
  }
} else {
  await rateLimitRef.set({ count: 1, windowStart: now });
}
```

## Best Practices

1. **Never commit secrets**: All secrets are in Firebase Secrets Manager
2. **Validate all inputs**: Both client and server-side validation
3. **Use HTTPS**: All Firebase Functions use HTTPS by default
4. **Monitor usage**: Check Firebase Console for unusual activity
5. **Keep dependencies updated**: Regularly update npm packages
6. **Review security rules**: Periodically audit Firestore rules
7. **Error logging**: Log errors server-side, show generic messages to users

## Security Checklist

- [x] API key stored in Firebase Secrets Manager
- [x] All AI requests require authentication
- [x] Input validation and sanitization
- [x] Input length limits
- [x] Action whitelisting
- [x] Error message sanitization
- [x] Firestore security rules deployed
- [ ] Rate limiting (recommended for production)
- [ ] Request logging/monitoring
- [ ] Cost alerts configured

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not create a public issue
2. Contact the project maintainer privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure
