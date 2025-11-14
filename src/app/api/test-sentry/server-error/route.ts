import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Test endpoint for Sentry server-side error tracking
 *
 * GET /api/test-sentry/server-error?type=<error_type>
 *
 * Error types:
 * - throw: Throws an unhandled error
 * - captured: Captures an error with Sentry.captureException
 * - message: Captures a message with Sentry.captureMessage
 * - timeout: Simulates a timeout error (ETIMEDOUT) - should be filtered
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type') || 'throw';

  try {
    switch (errorType) {
      case 'throw':
        // Test unhandled error
        throw new Error('Test server-side error from Sentry test endpoint');

      case 'captured':
        // Test captured exception
        const error = new Error('Test captured exception');
        Sentry.captureException(error, {
          tags: {
            test: 'sentry-integration',
            type: 'captured-exception',
          },
          extra: {
            endpoint: '/api/test-sentry/server-error',
            timestamp: new Date().toISOString(),
          },
        });
        return NextResponse.json({
          success: true,
          message: 'Error captured with Sentry.captureException',
          sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
        });

      case 'message':
        // Test message capture
        Sentry.captureMessage('Test Sentry message from server', {
          level: 'warning',
          tags: {
            test: 'sentry-integration',
            type: 'message',
          },
        });
        return NextResponse.json({
          success: true,
          message: 'Message sent to Sentry with level: warning',
          sentryEnabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
        });

      case 'timeout':
        // Test filtered error (should not be sent to Sentry)
        const timeoutError = new Error('ETIMEDOUT');
        timeoutError.name = 'ETIMEDOUT';
        throw timeoutError;

      default:
        return NextResponse.json({
          error: 'Invalid error type',
          validTypes: ['throw', 'captured', 'message', 'timeout'],
        }, { status: 400 });
    }
  } catch (error) {
    // Let Next.js error boundary handle it
    // Sentry should automatically capture unhandled errors
    throw error;
  }
}
