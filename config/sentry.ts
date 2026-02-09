/**
 * Sentry Error Monitoring Configuration
 * 
 * Provides error tracking, performance monitoring, and crash reporting
 * for production deployments.
 */

import { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error monitoring
 * Should be called at app startup, before React renders
 */
export function initSentry(): void {
  // Only initialize Sentry in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // Environment configuration
      environment: import.meta.env.MODE || 'production',
      
      // Release tracking (use git commit SHA or version)
      release: import.meta.env.VITE_APP_VERSION || 'development',
      
      // Performance monitoring
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration({
          // Trace navigation and route changes
          enableLongTask: true,
          enableInp: true,
        }),
        
        // Replay user sessions when errors occur
        Sentry.replayIntegration({
          maskAllText: true, // Mask sensitive text
          blockAllMedia: true, // Block images/videos for privacy
        }),
        
        // React-specific error tracking
        Sentry.reactRouterV7BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      
      // Performance monitoring - sample rate (0.0 to 1.0)
      // 1.0 = 100% of transactions, 0.1 = 10% of transactions
      tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
      
      // Session replay - sample rate
      // Capture 10% of all sessions, 100% of sessions with errors
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Ignore common errors that aren't actionable
      ignoreErrors: [
        // Browser extensions
        'chrome-extension://',
        'moz-extension://',
        // Network errors
        'NetworkError',
        'Network request failed',
        // ResizeObserver errors (harmless)
        'ResizeObserver loop',
        // Script loading errors (usually ad blockers)
        'Script error.',
        // Firebase auth redirect errors (expected)
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
      ],
      
      // Before sending events, filter out sensitive data
      beforeSend(event, hint) {
        // Filter out development errors
        if (import.meta.env.DEV) {
          return null;
        }
        
        // Remove sensitive data from contexts
        if (event.request) {
          // Remove cookies
          delete event.request.cookies;
          
          // Remove auth headers
          if (event.request.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['Cookie'];
          }
        }
        
        // Remove user's email if present (keep user ID for tracking)
        if (event.user?.email) {
          event.user.email = '[REDACTED]';
        }
        
        return event;
      },
      
      // Breadcrumbs for debugging (disabled in production for privacy)
      maxBreadcrumbs: import.meta.env.DEV ? 100 : 50,
      
      // Attach stack traces to all messages
      attachStacktrace: true,
    });
    
    console.log('✅ Sentry initialized for error monitoring');
  } else if (import.meta.env.PROD) {
    console.warn('⚠️ Sentry DSN not configured. Error monitoring disabled.');
  } else {
    console.log('ℹ️ Sentry disabled in development mode');
  }
}

/**
 * Set user context for Sentry
 * Call this after user logs in
 */
export function setSentryUser(user: { uid: string; email?: string; username?: string }): void {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.uid,
      email: user.email,
      username: user.username,
    });
  }
}

/**
 * Clear user context from Sentry
 * Call this when user logs out
 */
export function clearSentryUser(): void {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Manually capture an exception
 * Use for caught errors that should still be reported
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // In development, just log to console
    console.error('Captured exception:', error, context);
  }
}

/**
 * Manually capture a message
 * Use for important warnings or info that should be tracked
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry ${level}]:`, message);
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs are logged events that help debug errors
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

// Export Sentry for advanced usage
export { Sentry };
