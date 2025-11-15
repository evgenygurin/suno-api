import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
  project: process.env.TRIGGER_PROJECT_REF || "proj_awhveiuvdurduhbyvrxw",
  // Maximum duration for a single task run (in seconds)
  maxDuration: 300, // 5 minutes
  // Your other config settings...
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
};
