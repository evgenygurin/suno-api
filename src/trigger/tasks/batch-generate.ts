import { schemaTask, runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateMusicTask } from "./generate-music";
import logger from "@/lib/logger";

/**
 * Zod schema for batch music generation payload validation
 */
const BatchGenerateSchema = z.object({
  prompts: z.array(z.string().min(1, "Prompt cannot be empty"))
    .min(1, "At least one prompt is required")
    .max(50, "Batch size limited to 50 prompts"),
  make_instrumental: z.boolean(),
  model: z.string().optional(),
  wait_audio: z.boolean().default(true),
  apiKey: z.string().optional(),
  userId: z.string().optional(),
});

// Infer TypeScript type from Zod schema
export type BatchGeneratePayload = z.infer<typeof BatchGenerateSchema>;

export interface BatchGenerateResult {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  taskRuns: string[];
  results: Array<{
    prompt: string;
    runId: string;
    status: string;
    output?: any;
    error?: string;
  }>;
}

/**
 * Batch music generation task - processes multiple prompts in parallel
 *
 * Features:
 * - Automatic Zod validation (validates array size and content)
 * - Processes up to 50 prompts in parallel
 * - Orchestrates individual music generation tasks
 * - Returns aggregated results with status tracking
 */
export const batchGenerateTask = schemaTask({
  id: "batch-generate-music",
  schema: BatchGenerateSchema,
  retry: {
    maxAttempts: 2, // Limited retries for batch operations
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload, { ctx }): Promise<BatchGenerateResult> => {
    // Payload is already validated by Zod
    const { prompts, make_instrumental, model, wait_audio, apiKey, userId } = payload;

    logger.info({
      runId: ctx.run.id,
      promptCount: prompts.length,
      userId,
      make_instrumental,
    }, "Starting batch music generation");

    try {
      // Trigger individual music generation tasks for each prompt
      const taskRuns = await Promise.all(
        prompts.map(async (prompt, index) => {
          logger.info({
            batchRunId: ctx.run.id,
            promptIndex: index,
            prompt: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
          }, "Triggering individual generation task");

          return await runs.create(generateMusicTask, {
            prompt,
            make_instrumental,
            model,
            wait_audio,
            apiKey,
          });
        })
      );

      logger.info({
        runId: ctx.run.id,
        triggered: taskRuns.length,
      }, "All batch tasks triggered");

      // Wait for all tasks to complete
      const results = await Promise.all(
        taskRuns.map(async (run) => {
          try {
            const retrievedRun = await runs.retrieve(run.id);
            return {
              prompt: prompts[taskRuns.indexOf(run)],
              runId: run.id,
              status: retrievedRun.status,
              output: retrievedRun.output,
              error: retrievedRun.error,
            };
          } catch (error: any) {
            return {
              prompt: prompts[taskRuns.indexOf(run)],
              runId: run.id,
              status: "ERROR",
              error: error.message || "Failed to retrieve run status",
            };
          }
        })
      );

      // Count results by status
      const successful = results.filter(r => r.status === "COMPLETED" && r.output?.success).length;
      const failed = results.filter(r => r.status === "FAILED" || r.status === "ERROR").length;
      const pending = results.filter(r => r.status === "PENDING" || r.status === "EXECUTING").length;

      logger.info({
        runId: ctx.run.id,
        total: prompts.length,
        successful,
        failed,
        pending,
      }, "Batch generation completed");

      return {
        total: prompts.length,
        successful,
        failed,
        pending,
        taskRuns: taskRuns.map(r => r.id),
        results,
      };

    } catch (error: any) {
      logger.error({
        runId: ctx.run.id,
        error: error.message || 'Unknown error',
        promptCount: prompts.length,
      }, "Batch generation failed");

      throw error;
    }
  },
});
