import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import logger from "@/lib/logger";

/**
 * Zod schema for music generation payload validation
 * - Automatic runtime validation before task execution
 * - Type-safe payload with proper error messages
 */
const GenerateMusicSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  make_instrumental: z.boolean(),
  model: z.string().optional(),
  wait_audio: z.boolean(),
  apiKey: z.string().optional(),
});

// Infer TypeScript type from Zod schema
export type GenerateMusicPayload = z.infer<typeof GenerateMusicSchema>;

export interface GenerateMusicResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Background task for generating music with Suno AI
 *
 * Features:
 * - Automatic Zod validation (fails fast on invalid payload)
 * - Automatic retries on CAPTCHA failures (3 attempts)
 * - Long-running operation support (no HTTP timeout)
 * - Structured logging for debugging
 * - Graceful error handling
 */
export const generateMusicTask = schemaTask({
  id: "generate-music",
  schema: GenerateMusicSchema,
  // Retry configuration for CAPTCHA and network failures
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,    // Start with 2s delay
    maxTimeoutInMs: 30000,   // Max 30s delay
    factor: 2,               // Exponential backoff
    randomize: true,         // Add jitter to prevent thundering herd
  },
  // Queue configuration for high-volume scenarios
  queue: {
    concurrencyLimit: 5,     // Max 5 concurrent music generations
  },
  run: async (payload, { ctx }) => {
    // Payload is already validated by Zod - safe to use directly
    const startTime = Date.now();

    logger.info({
      runId: ctx.run.id,
      attempt: ctx.attempt.number,
      payload: {
        prompt: payload.prompt.length > 50 ? payload.prompt.substring(0, 50) + '...' : payload.prompt,
        instrumental: payload.make_instrumental,
        model: payload.model || DEFAULT_MODEL,
      }
    }, 'Starting music generation task');

    try {
      // Initialize Suno API with provided or default API key
      const api = await sunoApi(payload.apiKey);

      // Generate music (this can take 5-30 seconds)
      const audioInfo = await api.generate(
        payload.prompt,
        payload.make_instrumental,
        payload.model || DEFAULT_MODEL,
        payload.wait_audio
      );

      const duration = Date.now() - startTime;

      logger.info({
        runId: ctx.run.id,
        duration,
        audioCount: Array.isArray(audioInfo) ? audioInfo.length : 1,
      }, 'Music generation completed successfully');

      return {
        success: true,
        data: audioInfo,
      } as GenerateMusicResult;

    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error({
        runId: ctx.run.id,
        attempt: ctx.attempt.number,
        duration,
        error: error.message,
        stack: error.stack,
      }, 'Music generation failed');

      // Determine if error is retryable
      const isRetryable =
        error.message?.includes('CAPTCHA') ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.response?.status === 429 || // Rate limit
        error.response?.status >= 500;    // Server error

      if (!isRetryable) {
        // Non-retryable error - fail immediately
        logger.warn({
          runId: ctx.run.id,
          error: error.message,
        }, 'Non-retryable error detected, failing task');

        return {
          success: false,
          error: error.message || 'Music generation failed',
        } as GenerateMusicResult;
      }

      // Retryable error - let Trigger.dev retry
      throw error;
    }
  },
});
