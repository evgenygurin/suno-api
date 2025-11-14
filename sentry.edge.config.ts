/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures the Sentry SDK for Edge runtime (Vercel Edge Functions, Middleware).
 * It provides error tracking for middleware and edge API routes.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Data Source Name - connects to your Sentry project
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (development, staging, production)
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

  // Release version for tracking deployments
  release: process.env.SENTRY_RELEASE,

  // Performance Monitoring
  // Edge functions should have lower sample rates to reduce overhead
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.05'),

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Scrub cookies and sensitive headers
    if (event.request) {
      if (event.request.cookies) {
        delete event.request.cookies;
      }

      if (event.request.headers) {
        const sensitiveHeaders = ['cookie', 'authorization', 'x-api-key'];
        sensitiveHeaders.forEach((header) => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[Filtered]';
          }
        });
      }
    }

    return event;
  },

  // Custom tags for filtering
  initialScope: {
    tags: {
      'app.component': 'edge',
      'app.runtime': 'vercel-edge',
    },
  },
});
