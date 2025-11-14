import { task } from "@trigger.dev/sdk/v3";
// TODO: Implement @/lib/captcha module with solve2Captcha function
// import { solve2Captcha } from "@/lib/captcha";
import logger from "@/lib/logger";

// Temporary stub for solve2Captcha - replace with actual implementation
async function solve2Captcha(params: { pageurl: string; googlekey: string }): Promise<string> {
  throw new Error("solve2Captcha not implemented - please implement @/lib/captcha module");
}

export interface CaptchaSolvePayload {
  pageUrl: string;
  sitekey: string;
  maxAttempts?: number;
}

export interface CaptchaSolveResult {
  success: boolean;
  solution?: string;
  attempt: number;
  executionTime: number;
  error?: string;
}

/**
 * Dedicated CAPTCHA solving task with intelligent retry logic
 *
 * This task handles CAPTCHA solving separately from music generation,
 * allowing for fine-tuned retry strategies and better monitoring.
 */
export const solveCaptchaTask = task({
  id: "solve-captcha",
  retry: {
    maxAttempts: 5, // Up to 5 attempts for CAPTCHA
    minTimeoutInMs: 2000, // Start with 2s delay
    maxTimeoutInMs: 30000, // Max 30s between retries
    factor: 1.5, // Gentler backoff for CAPTCHA
    randomize: true,
  },
  queue: {
    concurrencyLimit: 10, // Allow multiple CAPTCHA solves in parallel
  },
  run: async (payload: CaptchaSolvePayload, { ctx }): Promise<CaptchaSolveResult> => {
    const attempt = ctx.attempt.number;
    const maxAttempts = payload.maxAttempts || 5;

    logger.info({
      runId: ctx.run.id,
      attempt,
      maxAttempts,
      pageUrl: payload.pageUrl,
    }, "Starting CAPTCHA solve attempt");

    try {
      // Solve CAPTCHA using 2Captcha service
      const solution = await solve2Captcha({
        pageurl: payload.pageUrl,
        googlekey: payload.sitekey,
      });

      logger.info({
        runId: ctx.run.id,
        attempt,
        solutionLength: solution.length,
        executionTime: ctx.run.durationMs,
      }, "CAPTCHA solved successfully");

      return {
        success: true,
        solution,
        attempt,
        executionTime: ctx.run.durationMs || 0,
      };

    } catch (error: any) {
      logger.warn({
        runId: ctx.run.id,
        attempt,
        maxAttempts,
        error: error.message || 'Unknown error',
      }, "CAPTCHA solve attempt failed");

      // If we've hit max attempts, return failure
      if (attempt >= maxAttempts) {
        logger.error({
          runId: ctx.run.id,
          totalAttempts: attempt,
        }, "Maximum CAPTCHA attempts reached");

        return {
          success: false,
          attempt,
          executionTime: ctx.run.durationMs || 0,
          error: 'MAX_CAPTCHA_ATTEMPTS_REACHED',
        };
      }

      // Otherwise, throw to trigger retry
      throw error;
    }
  },
});
