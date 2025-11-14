import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_awhveiuvdurduhbyvrxw",
  // Your Trigger.dev project ref (from dashboard)
  // You can also set via TRIGGER_PROJECT_REF env var
  runtime: "node",
  logLevel: "info",
  // Maximum duration for tasks (in seconds) - required in v4.1.0+
  // Can be overridden per task in task definition
  maxDuration: 300, // 5 minutes default
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
});
