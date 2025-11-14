import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Performance monitoring
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing
  // We recommend adjusting this value in production (e.g., 0.1 for 10%)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/.*\.vercel\.app/,
    /^https:\/\/.*suno.*\.com/,
  ],

  // Session Replay
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
  ],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: parseFloat(
    process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1"
  ),
  replaysOnErrorSampleRate: parseFloat(
    process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1.0"
  ),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Set environment
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    // Random network errors
    "NetworkError",
    "Network request failed",
  ],

  // Filter out development errors
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.SENTRY_DEBUG
    ) {
      return null;
    }
    return event;
  },
});

// Export router transition capture for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
