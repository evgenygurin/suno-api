/**
 * Next.js Instrumentation Hook
 *
 * This file is used to initialize Sentry on the server-side for Next.js 15+.
 * It runs once when the server starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
