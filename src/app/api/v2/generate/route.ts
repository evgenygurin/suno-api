import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateMusicTask } from "@/trigger/tasks/generate-music";
import type { GenerateMusicPayload } from "@/trigger";

export const dynamic = "force-dynamic";

/**
 * POST /api/v2/generate - Trigger background music generation
 *
 * This is the async version of the API that returns immediately with a job ID.
 * Use /api/v2/jobs/{runId} to check status and get results.
 *
 * Benefits over sync version (/api/generate):
 * - No HTTP timeout (can handle long CAPTCHA solving)
 * - Automatic retries on failures
 * - Better handling of concurrent requests
 * - Job status tracking
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, make_instrumental, model, wait_audio } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "prompt" field' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key from Authorization header or environment variable
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || process.env.SUNO_API_KEY;

    // Prepare task payload
    const payload: GenerateMusicPayload = {
      prompt,
      make_instrumental: Boolean(make_instrumental),
      model: model || undefined,
      wait_audio: Boolean(wait_audio),
      apiKey,
    };

    logger.info({
      endpoint: '/api/v2/generate',
      prompt: prompt.substring(0, 50) + '...',
      instrumental: payload.make_instrumental,
    }, 'Triggering background music generation');

    // Trigger background task using Trigger.dev v3 SDK
    const handle = await tasks.trigger<typeof generateMusicTask>(
      "generate-music",
      payload
    );

    logger.info({
      runId: handle.id,
      endpoint: '/api/v2/generate',
    }, 'Background job triggered successfully');

    // Return job information immediately
    return NextResponse.json({
      success: true,
      jobId: handle.id,
      status: "processing",
      message: "Music generation started. Use /api/v2/jobs/{jobId} to check status.",
      checkStatusUrl: `/api/v2/jobs/${handle.id}`,
    }, {
      status: 202, // Accepted
      headers: corsHeaders,
    });

  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
      endpoint: '/api/v2/generate',
    }, 'Failed to trigger background job');

    return NextResponse.json({
      error: 'Failed to start music generation',
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
