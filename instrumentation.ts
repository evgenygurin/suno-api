import * as Sentry from "@sentry/nextjs";

// This function is called when the Next.js server starts
export async function register() {
  // Check if we're running on the server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side Sentry initialization
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adds request headers and IP for users
      sendDefaultPii: true,

      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

      // Enable logs to be sent to Sentry
      enableLogs: true,

      // Set environment
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",

      // Server-side integrations
      integrations: [
        // Add Prisma integration if using Prisma
        // Sentry.prismaIntegration(),
      ],

      // Ignore specific errors
      ignoreErrors: [
        "ECONNRESET",
        "ENOTFOUND",
        "ETIMEDOUT",
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

        // Don't send events for specific paths
        const ignorePaths = ["/api/health", "/api/status"];
        if (event.request?.url) {
          const url = new URL(event.request.url);
          if (ignorePaths.some(path => url.pathname.startsWith(path))) {
            return null;
          }
        }

        return event;
      },
    });
  }

  // Check if we're running on the edge runtime
  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime Sentry initialization
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Performance monitoring for edge runtime
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

      // Set environment
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",

      // Edge runtime has limited integrations available
      integrations: [],

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
  }
}
