/**
 * Trigger.dev v4 Client
 *
 * Note: In Trigger.dev v4, the TriggerClient pattern from v2/v3 is no longer used.
 * Instead, tasks are defined directly using the `task()` function from "@trigger.dev/sdk"
 * and triggered using the `tasks.trigger()` API.
 *
 * Configuration is handled via:
 * - trigger.config.ts in the project root
 * - Environment variables (TRIGGER_SECRET_KEY, TRIGGER_PROJECT_REF)
 *
 * For triggering tasks from your application code, use:
 * ```typescript
 * import { tasks } from "@trigger.dev/sdk";
 * import type { myTask } from "./trigger/tasks/my-task";
 *
 * const handle = await tasks.trigger<typeof myTask>("my-task-id", payload);
 * ```
 *
 * @see https://trigger.dev/docs/v4
 */

// This file is intentionally empty - v4 doesn't use a client pattern
export {};
