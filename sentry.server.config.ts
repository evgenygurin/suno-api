/**
 * Sentry Server-side Configuration
 *
 * This file configures the Sentry SDK for Node.js (server-side).
 * It initializes error tracking and performance monitoring for API routes,
 * server components, and server actions.
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
  // Adjust this value in production to reduce data volume
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Profiling (optional, requires additional setup)
  // profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

  // Server-specific integrations
  integrations: [
    // HTTP integration for tracing HTTP requests
    Sentry.httpIntegration(),

    // Node.js native error tracking
    Sentry.nativeNodeFetchIntegration(),
  ],

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      console.log('Sentry event (not sent in dev):', event);
      return null;
    }

    // Remove sensitive environment variables
    if (event.contexts?.runtime?.name === 'node') {
      // Don't send full environment variables
      delete event.contexts.runtime;
    }

    // Scrub cookies and sensitive headers
    if (event.request) {
      // Remove cookies
      if (event.request.cookies) {
        delete event.request.cookies;
      }

      // Filter sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = ['cookie', 'authorization', 'x-api-key', 'set-cookie'];
        sensitiveHeaders.forEach((header) => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[Filtered]';
          }
        });
      }
    }

    // Filter CAPTCHA and API keys from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        // Remove sensitive data from breadcrumb data
        if (breadcrumb.data) {
          const sensitiveKeys = [
            'apiKey',
            'api_key',
            'token',
            'cookie',
            'authorization',
            'captcha_response',
            'captcha_key',
            'SUNO_COOKIE',
            'CAPTCHA_API_KEY',
          ];

          sensitiveKeys.forEach((key) => {
            if (breadcrumb.data?.[key]) {
              breadcrumb.data[key] = '[Filtered]';
            }
          });
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore specific errors that are expected in browser automation
  ignoreErrors: [
    // Playwright/browser automation expected errors
    'TimeoutError',
    'Navigation timeout',
    'Page crashed',
    'Target closed',
    // CAPTCHA service errors (expected)
    'CAPTCHA_BALANCE_ZERO',
    'CAPTCHA_TIMEOUT',
    // Rate limit errors (handled by application)
    'TOO_MANY_REQUESTS',
    'RATE_LIMIT_EXCEEDED',
  ],

  // Custom tags for better filtering
  initialScope: {
    tags: {
      'app.component': 'server',
      'app.framework': 'nextjs',
      'app.version': process.env.npm_package_version || 'unknown',
    },
  },
});
