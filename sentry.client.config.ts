/**
 * Sentry Client-side Configuration
 *
 * This file configures the Sentry SDK for the browser (client-side).
 * It initializes error tracking, performance monitoring, and session replay.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Data Source Name - connects to your Sentry project
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (development, staging, production)
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

  // Release version for tracking deployments
  // Automatically set by sentry-cli during build
  release: process.env.SENTRY_RELEASE,

  // Performance Monitoring
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for testing
  // In production, adjust this value to reduce data volume and costs
  // Range: 0.0 (0%) to 1.0 (100%)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Session Replay
  // This sets the sample rate at 10%. You may want to change it to 100% while
  // in development and then sample at a lower rate in production.
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Integrations for enhanced tracking
  integrations: [
    // Sentry.replayIntegration({
    //   // Additional SDK configuration for session replay
    //   maskAllText: true,
    //   blockAllMedia: true,
    // }),

    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration(),
  ],

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      console.log('Sentry event (not sent in dev):', event);
      return null;
    }

    // Filter out known noise
    if (event.exception?.values) {
      const firstException = event.exception.values[0];
      const errorMessage = firstException?.value || '';

      // Ignore common browser errors
      const ignoredPatterns = [
        /ResizeObserver loop limit exceeded/,
        /Non-Error promise rejection captured/,
        /Network request failed/,
        /Failed to fetch/,
        /Load failed/,
      ];

      if (ignoredPatterns.some((pattern) => pattern.test(errorMessage))) {
        return null;
      }
    }

    // Remove sensitive data from request
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Scrub cookie headers from all breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data?.['Set-Cookie']) {
          breadcrumb.data['Set-Cookie'] = '[Filtered]';
        }
        if (breadcrumb.data?.cookie) {
          breadcrumb.data.cookie = '[Filtered]';
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Third-party scripts
    'fb_xd_fragment',
    // Random network errors
    'NetworkError',
    'Non-Error exception captured',
  ],

  // Don't report errors from certain URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
});
