/**
 * AI-Enhanced Music Generation API Endpoint
 *
 * POST /api/ai-generate
 *
 * Triggers an AI-enhanced music generation task that:
 * 1. Enhances user prompt with OpenAI GPT-4o
 * 2. Analyzes musical style and metadata
 * 3. Generates music via Suno API
 * 4. Returns real-time progress updates
 *
 * @see /docs/AI_SDK_INTEGRATION.md
 * @see /src/trigger/ai-enhanced-generation.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import logger from "@/lib/logger";
import type { aiEnhancedMusicGeneration } from "@/trigger/ai-enhanced-generation";

/**
 * Request body schema
 */
interface AIGenerateRequest {
  prompt: string;
  userId?: string;
  preferences?: {
    genre?: string;
    mood?: string;
    instruments?: string[];
    make_instrumental?: boolean;
  };
}

/**
 * POST /api/ai-generate
 *
 * Trigger AI-enhanced music generation
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIGenerateRequest = await request.json();

    // Validate required fields
    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        {
          error: "ValidationError",
          message: "Prompt is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (body.prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: "ValidationError",
          message: "Prompt cannot be empty",
        },
        { status: 400 }
      );
    }

    if (body.prompt.length > 500) {
      return NextResponse.json(
        {
          error: "ValidationError",
          message: "Prompt must be 500 characters or less",
        },
        { status: 400 }
      );
    }

    logger.info(
      {
        promptLength: body.prompt.length,
        userId: body.userId || "anonymous",
        hasPreferences: !!body.preferences,
      },
      "AI-enhanced generation request received"
    );

    // Trigger the background task
    const handle = await tasks.trigger<typeof aiEnhancedMusicGeneration>(
      "ai-enhanced-music-generation",
      {
        userPrompt: body.prompt,
        userId: body.userId || `anonymous-${Date.now()}`,
        preferences: body.preferences,
      }
    );

    logger.info(
      {
        taskId: handle.id,
        userId: body.userId || "anonymous",
      },
      "AI-enhanced generation task triggered"
    );

    // Return task handle for real-time monitoring
    return NextResponse.json(
      {
        success: true,
        taskId: handle.id,
        message: "AI-enhanced music generation started",
        data: {
          taskId: handle.id,
          status: "processing",
          originalPrompt: body.prompt,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 202 } // 202 Accepted - async processing
    );

  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "AI-enhanced generation request failed"
    );

    return NextResponse.json(
      {
        error: "InternalError",
        message: "Failed to start AI-enhanced music generation",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-generate
 *
 * Check task status (for debugging)
 */
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      {
        error: "ValidationError",
        message: "taskId parameter is required",
      },
      { status: 400 }
    );
  }

  // In production, you would query Trigger.dev API for task status
  // For now, return a helpful message
  return NextResponse.json({
    message: "Use Trigger.dev dashboard to check task status",
    taskId,
    dashboardUrl: `https://cloud.trigger.dev/runs/${taskId}`,
  });
}
