import { NextResponse, NextRequest } from "next/server";
import logger from "@/lib/logger";
import { verifyTriggerWebhookSignature, parseTriggerWebhookEvent } from "@/lib/webhook-verify";
import type { GenerateMusicResult } from "@/trigger";

export const dynamic = "force-dynamic";

/**
 * POST /api/v2/webhooks/trigger - Receive webhook notifications from Trigger.dev
 *
 * This endpoint receives notifications when background jobs complete.
 * Configure this URL in your Trigger.dev dashboard under Webhooks.
 *
 * Webhook URL: https://your-domain.com/api/v2/webhooks/trigger
 *
 * Events:
 * - run.completed: Job finished successfully
 * - run.failed: Job failed after all retries
 * - run.canceled: Job was canceled
 *
 * Security:
 * - Webhook signatures are verified using HMAC SHA256
 * - Set TRIGGER_WEBHOOK_SECRET in environment variables
 * - Signatures prevent unauthorized webhook calls
 */
export async function POST(req: NextRequest) {
  try {
    // Get signature and secret
    const signature = req.headers.get('x-trigger-signature');
    const webhookSecret = process.env.TRIGGER_WEBHOOK_SECRET;

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature (production security)
    if (webhookSecret && signature) {
      const isValid = verifyTriggerWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!isValid) {
        logger.warn({
          signature: signature?.substring(0, 10) + '...',
        }, 'Invalid webhook signature - rejecting request');

        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      logger.debug('Webhook signature verified successfully');
    } else if (!webhookSecret) {
      // Warning: running without signature verification
      logger.warn(
        'TRIGGER_WEBHOOK_SECRET not configured - webhooks are not verified! ' +
        'This is insecure for production. Generate a secret with: openssl rand -hex 32'
      );
    }

    // Parse and validate event
    const event = parseTriggerWebhookEvent(rawBody);
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    logger.info({
      eventType: event.type,
      runId: event.run?.id,
      taskId: event.run?.taskIdentifier,
    }, 'Received Trigger.dev webhook');

    // Handle different event types
    switch (event.type) {
      case 'run.completed':
        await handleRunCompleted(event);
        break;

      case 'run.failed':
        await handleRunFailed(event);
        break;

      case 'run.canceled':
        await handleRunCanceled(event);
        break;

      default:
        logger.info({
          eventType: event.type,
        }, 'Unhandled webhook event type');
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    }, {
      status: 200,
    });

  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
      endpoint: '/api/v2/webhooks/trigger',
    }, 'Failed to process webhook');

    return NextResponse.json({
      error: 'Failed to process webhook',
      message: error.message || 'Internal server error',
    }, {
      status: 500,
    });
  }
}

/**
 * Handle successful job completion
 */
async function handleRunCompleted(event: any) {
  const { run } = event;
  const result = run.output as GenerateMusicResult;

  logger.info({
    runId: run.id,
    success: result.success,
    hasData: !!result.data,
  }, 'Music generation job completed');

  // Here you can:
  // - Store results in database
  // - Send notification to user
  // - Trigger downstream workflows
  // - Update cache
  // - Send email/SMS
  // etc.

  if (result.success && result.data) {
    // Example: Log successful generation
    logger.info({
      runId: run.id,
      audioCount: Array.isArray(result.data) ? result.data.length : 1,
    }, 'Music files generated successfully');

    // TODO: Add your custom logic here
    // await database.saveGeneratedMusic(run.id, result.data);
    // await notifications.sendToUser(userId, 'Your music is ready!');
  }
}

/**
 * Handle job failure
 */
async function handleRunFailed(event: any) {
  const { run } = event;

  logger.error({
    runId: run.id,
    attempts: run.attempts?.length,
    error: run.output?.error,
  }, 'Music generation job failed');

  // Here you can:
  // - Send failure notification to user
  // - Log to error tracking (Sentry, etc.)
  // - Trigger manual review workflow
  // - Refund credits if applicable
  // etc.

  // TODO: Add your custom logic here
  // await errorTracking.logFailedJob(run);
  // await notifications.sendFailureNotice(userId, run.output?.error);
}

/**
 * Handle job cancellation
 */
async function handleRunCanceled(event: any) {
  const { run } = event;

  logger.info({
    runId: run.id,
  }, 'Music generation job canceled');

  // TODO: Add your custom logic here
  // await database.markJobAsCanceled(run.id);
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
  });
}
