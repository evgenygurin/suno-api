import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";
import { tasks } from "@trigger.dev/sdk/v3";
import type { batchGenerateTask } from "@/trigger/tasks/batch-generate";
import type { BatchGeneratePayload } from "@/trigger";

export const dynamic = "force-dynamic";

/**
 * POST /api/v2/batch - Trigger batch music generation
 *
 * Generates multiple songs in parallel using background tasks.
 * Returns immediately with a job ID to track all generations.
 *
 * Request body:
 * {
 *   "prompts": ["prompt 1", "prompt 2", ...],  // 1-50 prompts
 *   "make_instrumental": boolean,
 *   "model": "string" (optional),
 *   "wait_audio": boolean (optional, default true)
 * }
 *
 * Response (202 Accepted):
 * {
 *   "success": true,
 *   "jobId": "run_...",
 *   "batchSize": 5,
 *   "status": "processing",
 *   "checkStatusUrl": "/api/v2/jobs/{jobId}"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompts, make_instrumental, model, wait_audio } = body;

    // Validate prompts array
    if (!Array.isArray(prompts)) {
      return NextResponse.json(
        { error: 'Invalid "prompts" field - must be an array' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (prompts.length === 0) {
      return NextResponse.json(
        { error: 'At least one prompt is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (prompts.length > 50) {
      return NextResponse.json(
        { error: 'Batch size limited to 50 prompts' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate each prompt
    for (let i = 0; i < prompts.length; i++) {
      if (!prompts[i] || typeof prompts[i] !== 'string') {
        return NextResponse.json(
          { error: `Invalid prompt at index ${i} - must be a non-empty string` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Validate make_instrumental
    if (typeof make_instrumental !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid "make_instrumental" field - must be a boolean' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key from Authorization header or environment variable
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || process.env.SUNO_API_KEY;

    // Prepare task payload
    const payload: BatchGeneratePayload = {
      prompts,
      make_instrumental,
      model: model || undefined,
      wait_audio: typeof wait_audio === 'boolean' ? wait_audio : true,
      apiKey,
    };

    logger.info({
      endpoint: '/api/v2/batch',
      batchSize: prompts.length,
      instrumental: make_instrumental,
    }, 'Triggering batch music generation');

    // Trigger batch background task
    const handle = await tasks.trigger<typeof batchGenerateTask>(
      "batch-generate-music",
      payload
    );

    logger.info({
      runId: handle.id,
      endpoint: '/api/v2/batch',
      batchSize: prompts.length,
    }, 'Batch generation job triggered successfully');

    // Return job information immediately
    return NextResponse.json({
      success: true,
      jobId: handle.id,
      batchSize: prompts.length,
      status: "processing",
      message: `Batch generation started for ${prompts.length} prompts. Use /api/v2/jobs/{jobId} to check status.`,
      checkStatusUrl: `/api/v2/jobs/${handle.id}`,
    }, {
      status: 202, // Accepted
      headers: corsHeaders,
    });

  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
      endpoint: '/api/v2/batch',
    }, 'Failed to trigger batch generation job');

    return NextResponse.json({
      error: 'Failed to start batch generation',
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
