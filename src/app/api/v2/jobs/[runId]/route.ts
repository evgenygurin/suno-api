import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";
import { runs } from "@trigger.dev/sdk/v3";
import type { GenerateMusicResult } from "@/trigger";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    runId: string;
  };
}

/**
 * GET /api/v2/jobs/{runId} - Check status of background music generation job
 *
 * Possible statuses:
 * - QUEUED: Job is waiting to start
 * - EXECUTING: Job is currently running
 * - REATTEMPTING: Job failed and is retrying
 * - COMPLETED: Job finished successfully
 * - FAILED: Job failed after all retries
 * - CANCELED: Job was canceled
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const { runId } = params;

  try {
    logger.info({
      runId,
      endpoint: '/api/v2/jobs',
    }, 'Checking job status');

    // Retrieve run status from Trigger.dev
    const run = await runs.retrieve(runId);

    if (!run) {
      return NextResponse.json({
        error: 'Job not found',
        message: `No job found with ID: ${runId}`,
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Build response based on run status
    const response: any = {
      jobId: run.id,
      status: run.status,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };

    // Add attempt information
    if (run.attempts && run.attempts.length > 0) {
      response.attempts = run.attempts.length;
      response.lastAttempt = run.attempts[run.attempts.length - 1];
    }

    // If completed, include the result
    if (run.status === 'COMPLETED' && run.output) {
      const result = run.output as GenerateMusicResult;
      response.success = result.success;

      if (result.success) {
        response.data = result.data;
      } else {
        response.error = result.error;
      }
    }

    // If failed, include error information
    if (run.status === 'FAILED') {
      response.success = false;
      response.error = 'Job failed after all retry attempts';

      if (run.output) {
        const result = run.output as GenerateMusicResult;
        response.errorDetails = result.error;
      }
    }

    // If still processing
    if (['QUEUED', 'EXECUTING', 'REATTEMPTING'].includes(run.status)) {
      response.message = 'Job is still processing. Check back later.';
    }

    logger.info({
      runId,
      status: run.status,
      endpoint: '/api/v2/jobs',
    }, 'Job status retrieved');

    return NextResponse.json(response, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error: any) {
    logger.error({
      runId,
      error: error.message,
      stack: error.stack,
      endpoint: '/api/v2/jobs',
    }, 'Failed to retrieve job status');

    return NextResponse.json({
      error: 'Failed to retrieve job status',
      message: error.message || 'Internal server error',
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
