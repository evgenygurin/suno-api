# Trigger.dev Integration Guide

This guide explains how to use Trigger.dev for background task processing in the suno-api project.

## 🎯 Why Trigger.dev for suno-api?

Given the nature of this project (browser automation + CAPTCHA solving), Trigger.dev provides critical capabilities:

### Key Benefits

1. **Long-Running Tasks** ⏱️
   - Music generation can take 30+ seconds
   - CAPTCHA solving is unpredictable (5-30 seconds)
   - Browser automation needs proper timeout management
   - Trigger.dev handles tasks up to hours long

2. **Retry Logic** 🔄
   - CAPTCHA failures need intelligent retries
   - Cookie expiration recovery
   - Rate limit handling with exponential backoff

3. **Queue Management** 📊
   - Handle concurrent music generation requests
   - Prevent browser context overload
   - Priority queuing for premium users

4. **Monitoring & Debugging** 🔍
   - Real-time task status tracking
   - Detailed execution logs
   - Performance metrics
   - Integration with Sentry for errors

## 📋 Installation & Setup

### Step 1: MCP Server (Already Installed ✅)

The Trigger.dev MCP Server is already configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "trigger": {
      "command": "npx",
      "args": ["trigger.dev@latest", "mcp", "--dev-only"]
    }
  }
}
```

**Restart Claude Code** to activate the MCP tools.

### Step 2: Add API Key to .env

Add your Trigger.dev API key to `.env` file:

```bash
# Your development API key
TRIGGER_API_KEY=tr_dev_iJdGQx8YD3cF3Vjy7gyK

# Get your project ref from Trigger.dev dashboard
TRIGGER_PROJECT_REF=proj_your_project_ref_here
```

**⚠️ Important:**
- The `.env` file is gitignored (contains secrets)
- Never commit API keys to the repository
- Use environment variables in production

### Step 3: Install Trigger.dev in Project

Initialize Trigger.dev in your project:

```bash
# Install Trigger.dev CLI and SDK
npm install trigger.dev@latest

# Initialize Trigger.dev
npx trigger.dev@latest init

# Follow the prompts:
# 1. Select "Next.js" framework
# 2. Choose "App Router"
# 3. Enter your API key when prompted
```

This creates:
- `trigger.config.ts` - Trigger.dev configuration
- `src/trigger/` - Directory for task definitions

### Step 4: Verify Installation

Test the MCP connection through Claude Code:

```text
Ask me: "Search Trigger.dev docs for task examples"
```

## 🚀 Task Examples for suno-api

### Example 1: Async Music Generation

**Use Case:** Offload long-running music generation to background

**File:** `src/trigger/generate-music.ts`

```typescript
import { task } from "@trigger.dev/sdk/v3";
import { sunoApi } from "@/lib/SunoApi";
import logger from "@/lib/logger";

interface MusicGenerationPayload {
  prompt: string;
  make_instrumental: boolean;
  wait_audio: boolean;
  apiKey?: string;
  userId?: string;
}

export const generateMusicTask = task({
  id: "generate-music",
  maxDuration: 300, // 5 minutes max
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: MusicGenerationPayload, { ctx }) => {
    logger.info({
      runId: ctx.run.id,
      userId: payload.userId,
      prompt: payload.prompt.substring(0, 50)
    }, "Starting music generation task");

    try {
      // Initialize Suno API with provided or default key
      const api = await sunoApi(payload.apiKey);

      // Generate music (handles CAPTCHA internally)
      const result = await api.custom_generate(
        payload.prompt,
        payload.make_instrumental,
        payload.wait_audio
      );

      logger.info({
        runId: ctx.run.id,
        songIds: result.map(s => s.id)
      }, "Music generation completed");

      return {
        success: true,
        songs: result,
        executionTime: ctx.run.durationMs,
      };

    } catch (error) {
      logger.error({
        runId: ctx.run.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, "Music generation failed");

      // Retry on specific errors
      if (error instanceof Error) {
        if (error.message.includes('CAPTCHA')) {
          throw new Error('CAPTCHA_FAILED'); // Will retry
        }
        if (error.message.includes('rate limit')) {
          throw new Error('RATE_LIMITED'); // Will retry with backoff
        }
      }

      throw error; // Other errors fail immediately
    }
  },
});
```

### Example 2: CAPTCHA Retry with Smart Backoff

**File:** `src/trigger/solve-captcha.ts`

```typescript
import { task } from "@trigger.dev/sdk/v3";
import { Page } from "rebrowser-playwright-core";
import { solve2Captcha } from "@/lib/2captcha";
import logger from "@/lib/logger";

interface CaptchaSolvePayload {
  pageUrl: string;
  sitekey: string;
  maxAttempts?: number;
}

export const solveCaptchaTask = task({
  id: "solve-captcha",
  maxDuration: 120, // 2 minutes max per attempt
  retry: {
    maxAttempts: 5, // Up to 5 attempts
    factor: 1.5, // Gentler backoff for CAPTCHA
    minTimeoutInMs: 2000, // Start with 2s delay
    maxTimeoutInMs: 30000, // Max 30s between retries
  },
  run: async (payload: CaptchaSolvePayload, { ctx }) => {
    const attempt = ctx.attempt.number;

    logger.info({
      runId: ctx.run.id,
      attempt,
      maxAttempts: payload.maxAttempts || 5
    }, "Solving CAPTCHA");

    try {
      // Solve CAPTCHA using 2Captcha service
      const solution = await solve2Captcha({
        pageurl: payload.pageUrl,
        googlekey: payload.sitekey,
      });

      logger.info({
        runId: ctx.run.id,
        attempt,
        solutionLength: solution.length
      }, "CAPTCHA solved successfully");

      return {
        success: true,
        solution,
        attempt,
        executionTime: ctx.run.durationMs,
      };

    } catch (error) {
      logger.warn({
        runId: ctx.run.id,
        attempt,
        error: error instanceof Error ? error.message : 'Unknown'
      }, "CAPTCHA solve attempt failed");

      // If we've hit max attempts, give up
      if (attempt >= (payload.maxAttempts || 5)) {
        throw new Error('MAX_CAPTCHA_ATTEMPTS_REACHED');
      }

      // Otherwise, retry
      throw error;
    }
  },
});
```

### Example 3: Periodic Cookie Refresh

**File:** `src/trigger/refresh-cookies.ts`

```typescript
import { schedules } from "@trigger.dev/sdk/v3";
import { sunoApi } from "@/lib/SunoApi";
import logger from "@/lib/logger";

// Run every 4 hours to keep cookies fresh
export const refreshCookiesSchedule = schedules.task({
  id: "refresh-suno-cookies",
  cron: "0 */4 * * *", // Every 4 hours
  maxDuration: 180, // 3 minutes max
  run: async (payload, { ctx }) => {
    logger.info({ runId: ctx.run.id }, "Starting cookie refresh");

    try {
      const api = await sunoApi();

      // Test API with simple call
      const limit = await api.get_limit();

      logger.info({
        runId: ctx.run.id,
        credits: limit.credits_left,
        monthly: limit.monthly_limit
      }, "Cookies are valid");

      return {
        success: true,
        creditsLeft: limit.credits_left,
        monthlyLimit: limit.monthly_limit,
      };

    } catch (error) {
      logger.error({
        runId: ctx.run.id,
        error: error instanceof Error ? error.message : 'Unknown'
      }, "Cookie refresh failed - manual intervention needed");

      // Send alert (integrate with Sentry or Slack)
      // await sendAlert('Cookie refresh failed');

      throw error;
    }
  },
});
```

### Example 4: Batch Music Generation

**File:** `src/trigger/batch-generate.ts`

```typescript
import { task, runs } from "@trigger.dev/sdk/v3";
import { generateMusicTask } from "./generate-music";
import logger from "@/lib/logger";

interface BatchPayload {
  prompts: string[];
  make_instrumental: boolean;
  userId?: string;
}

export const batchGenerateTask = task({
  id: "batch-generate-music",
  maxDuration: 1800, // 30 minutes for batch
  run: async (payload: BatchPayload, { ctx }) => {
    logger.info({
      runId: ctx.run.id,
      count: payload.prompts.length
    }, "Starting batch generation");

    // Trigger individual tasks for each prompt
    const taskRuns = await Promise.all(
      payload.prompts.map((prompt, index) =>
        runs.create(generateMusicTask, {
          prompt,
          make_instrumental: payload.make_instrumental,
          wait_audio: true,
          userId: payload.userId,
        })
      )
    );

    logger.info({
      runId: ctx.run.id,
      triggered: taskRuns.length
    }, "Batch tasks triggered");

    // Wait for all to complete (optional)
    const results = await Promise.all(
      taskRuns.map(run => runs.retrieve(run))
    );

    const successful = results.filter(r => r.output?.success).length;

    return {
      total: payload.prompts.length,
      successful,
      failed: payload.prompts.length - successful,
      taskRuns: taskRuns.map(r => r.id),
    };
  },
});
```

## 🔧 Usage in API Routes

### Trigger Task from API Endpoint

**File:** `src/app/api/generate-async/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { generateMusicTask } from "@/trigger/generate-music";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, make_instrumental = false } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key from request or environment
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || process.env.SUNO_API_KEY;

    // Trigger background task
    const run = await runs.trigger(generateMusicTask, {
      prompt,
      make_instrumental,
      wait_audio: false, // Don't wait in background
      apiKey,
      userId: req.headers.get('x-user-id') || 'anonymous',
    });

    logger.info({ runId: run.id, prompt }, "Music generation triggered");

    // Return immediately with task ID
    return NextResponse.json({
      success: true,
      runId: run.id,
      status: 'processing',
      message: 'Music generation started. Check status with run ID.',
      statusUrl: `/api/status/${run.id}`,
    }, {
      status: 202, // Accepted
      headers: corsHeaders,
    });

  } catch (error: any) {
    logger.error({ error: error.message }, 'Error triggering music generation');

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
```

### Check Task Status

**File:** `src/app/api/status/[runId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;

    // Retrieve task status
    const run = await runs.retrieve(runId);

    logger.info({ runId, status: run.status }, "Status check");

    return NextResponse.json({
      runId: run.id,
      status: run.status, // "PENDING", "EXECUTING", "COMPLETED", "FAILED"
      output: run.output, // Task result if completed
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      error: run.error,
    }, {
      headers: corsHeaders,
    });

  } catch (error: any) {
    logger.error({ error: error.message }, 'Error checking status');

    return NextResponse.json(
      { error: error.message || 'Not found' },
      { status: 404, headers: corsHeaders }
    );
  }
}
```

## 🎛️ Configuration

### trigger.config.ts

```typescript
import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
  project: process.env.TRIGGER_PROJECT_REF!,
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
  logLevel: "info",
  triggerDirectories: ["./src/trigger"],
};
```

### Environment Variables

Add to `.env`:

```bash
# Trigger.dev Configuration
TRIGGER_API_KEY=tr_dev_iJdGQx8YD3cF3Vjy7gyK
TRIGGER_PROJECT_REF=proj_your_project_ref_here
TRIGGER_API_URL=https://api.trigger.dev
```

## 📊 Monitoring & Debugging

### Via Claude Code (MCP Tools)

Once the MCP server is active, you can:

```text
# Search documentation
"Search Trigger.dev docs for retry logic examples"

# List tasks
"Get all tasks in my Trigger.dev project"

# Trigger a task
"Trigger the generate-music task with prompt 'happy song'"

# Check run status
"Get details of run run_1234567890"

# List recent runs
"List all runs for the generate-music task"

# Deploy to production
"Deploy my Trigger.dev project to production"
```

### Via Trigger.dev Dashboard

1. Visit [Trigger.dev Dashboard](https://cloud.trigger.dev)
2. View all runs, filter by status
3. Inspect logs and execution timeline
4. Replay failed runs
5. Monitor performance metrics

### Via API

```typescript
import { runs } from "@trigger.dev/sdk/v3";

// List recent runs
const recentRuns = await runs.list({
  limit: 10,
  status: ["COMPLETED", "FAILED"],
  taskIdentifier: "generate-music",
});

// Replay a failed run
await runs.replay(failedRunId);

// Cancel a running task
await runs.cancel(runId);
```

## 🚀 Deployment

### Development

```bash
# Run dev server (hot reload for tasks)
npx trigger.dev@latest dev

# Test a task locally
npx trigger.dev@latest run generate-music --payload '{"prompt":"test"}'
```

### Staging/Production

**Option 1: Via CLI**

```bash
# Deploy to staging
npx trigger.dev@latest deploy --env staging

# Deploy to production
npx trigger.dev@latest deploy --env production
```

**Option 2: Via CI/CD (CircleCI)**

Add to `.circleci/config.yml`:

```yaml
jobs:
  deploy-trigger:
    executor: node-executor
    steps:
      - restore-workspace
      - run:
          name: Deploy Trigger.dev Tasks
          command: |
            # Install Trigger.dev CLI
            npm install -g trigger.dev@latest

            # Deploy to appropriate environment
            if [ "${CIRCLE_BRANCH}" = "main" ]; then
              npx trigger.dev@latest deploy --env production
            else
              npx trigger.dev@latest deploy --env staging
            fi
        env:
          TRIGGER_API_KEY: ${{ secrets.TRIGGER_API_KEY }}
```

## 🔐 Security Best Practices

1. **Never commit API keys**
   - Use `.env` for local development
   - Use CircleCI contexts for CI/CD
   - Rotate keys regularly

2. **Validate task payloads**
   - Use TypeScript interfaces
   - Validate input data
   - Sanitize user input

3. **Rate limiting**
   - Implement per-user quotas
   - Use task concurrency limits
   - Monitor queue depth

4. **Error handling**
   - Don't expose internal errors
   - Log sensitive data carefully
   - Use Sentry for error tracking

## 📚 Additional Resources

- **Trigger.dev Documentation:** https://trigger.dev/docs
- **MCP Tools Reference:** https://trigger.dev/docs/mcp-tools
- **Task Examples:** https://trigger.dev/docs/tasks
- **Retry Strategies:** https://trigger.dev/docs/tasks-retries
- **Scheduling:** https://trigger.dev/docs/tasks-scheduling

## 🐛 Troubleshooting

### Task not appearing in dashboard

**Problem:** Tasks defined but not showing up

**Solution:**
1. Ensure `triggerDirectories` in `trigger.config.ts` is correct
2. Restart dev server: `npx trigger.dev@latest dev`
3. Check task ID is unique

### Authentication errors

**Problem:** "Unauthorized" or "Invalid API key"

**Solution:**
1. Verify `TRIGGER_API_KEY` in `.env`
2. Check API key format: `tr_dev_` or `tr_prod_`
3. Restart Claude Code to reload environment

### Tasks failing silently

**Problem:** Tasks show as failed without clear error

**Solution:**
1. Check task logs in dashboard
2. Add more logging to task definition
3. Test task locally: `npx trigger.dev@latest run <task-id>`

---

**Questions?**
- Trigger.dev Discord: https://trigger.dev/discord
- Email support: help@trigger.dev
- GitHub Issues: https://github.com/triggerdotdev/trigger.dev/issues
