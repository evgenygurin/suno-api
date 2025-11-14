// Export Trigger.dev client
export { client } from "./client";

// Export all tasks
export { generateMusicTask } from "./tasks/generate-music";
export type { GenerateMusicPayload, GenerateMusicResult } from "./tasks/generate-music";

export { solveCaptchaTask } from "./tasks/solve-captcha";
export type { CaptchaSolvePayload, CaptchaSolveResult } from "./tasks/solve-captcha";

export { refreshCookiesSchedule } from "./tasks/refresh-cookies";
export type { CookieRefreshResult } from "./tasks/refresh-cookies";

export { batchGenerateTask } from "./tasks/batch-generate";
export type { BatchGeneratePayload, BatchGenerateResult } from "./tasks/batch-generate";
