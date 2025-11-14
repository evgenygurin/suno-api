import { schedules } from "@trigger.dev/sdk/v3";
import { sunoApi } from "@/lib/SunoApi";
import logger from "@/lib/logger";

export interface CookieRefreshResult {
  success: boolean;
  creditsLeft?: number;
  monthlyLimit?: number;
  monthlyUsage?: number;
  error?: string;
  timestamp: string;
}

/**
 * Periodic cookie refresh task - runs every 4 hours
 *
 * This scheduled task keeps Suno.ai authentication cookies fresh
 * by making a simple API call to verify they're still valid.
 * If cookies expire, manual intervention is needed to update them.
 */
export const refreshCookiesSchedule = schedules.task({
  id: "refresh-suno-cookies",
  // Run every 4 hours to keep cookies fresh
  cron: "0 */4 * * *",
  run: async (payload, { ctx }) => {
    logger.info({
      runId: ctx.run.id,
      scheduledFor: ctx.run.createdAt,
    }, "Starting scheduled cookie refresh");

    try {
      // Initialize Suno API with default cookie
      const api = await sunoApi();

      // Test API with simple call to verify cookies are valid
      const limit = await api.get_limit();

      logger.info({
        runId: ctx.run.id,
        creditsLeft: limit.credits_left,
        monthlyLimit: limit.monthly_limit,
        monthlyUsage: limit.monthly_usage,
      }, "Cookies are valid - refresh successful");

      return {
        success: true,
        creditsLeft: limit.credits_left,
        monthlyLimit: limit.monthly_limit,
        monthlyUsage: limit.monthly_usage,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      logger.error({
        runId: ctx.run.id,
        error: error.message || 'Unknown error',
      }, "Cookie refresh failed - manual intervention needed");

      // TODO: Send alert to monitoring system (Sentry/Slack)
      // This indicates cookies need to be manually updated
      // Example: await sendSlackAlert('Cookie refresh failed - update SUNO_COOKIE env var');

      return {
        success: false,
        error: error.message || 'Cookie validation failed',
        timestamp: new Date().toISOString(),
      };
    }
  },
});
