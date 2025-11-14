# Trigger.dev Integration Guide

This guide explains how to set up and use Trigger.dev for background music generation jobs in the Suno API project.

## 🎯 Why Trigger.dev?

For **high-volume production** use cases, Trigger.dev provides:

- ⚡ **No HTTP Timeouts**: Background jobs can run for minutes without blocking HTTP requests
- 🔄 **Automatic Retries**: CAPTCHA failures and network errors are automatically retried (3 attempts with exponential backoff)
- 📋 **Queue Management**: Handles concurrent requests with configurable concurrency limits (5 concurrent jobs)
- 💪 **Reliability**: Jobs aren't lost if server restarts
- 📊 **Monitoring**: Built-in dashboard for tracking job status, failures, and performance
- 🎯 **Webhooks**: Get notified when jobs complete

## 📦 Installation

Already installed! The integration includes:

```bash
npm install @trigger.dev/sdk@latest  # ✅ Done
```

**Files created:**
- `trigger.config.ts` - Trigger.dev configuration
- `src/trigger/client.ts` - Trigger.dev client initialization
- `src/trigger/tasks/generate-music.ts` - Background music generation task
- `src/app/api/v2/generate/route.ts` - Async API endpoint (triggers jobs)
- `src/app/api/v2/jobs/[runId]/route.ts` - Job status endpoint
- `src/app/api/v2/webhooks/trigger/route.ts` - Webhook handler

## 🚀 Quick Start

### 1. Create Trigger.dev Account

1. Go to [https://trigger.dev](https://trigger.dev)
2. Sign up for a free account
3. Create a new project named "suno-api"

### 2. Get API Credentials

From your Trigger.dev dashboard:

**Project Settings → API Keys:**
- Copy your **Development API Key** (starts with `tr_dev_`)
- Copy your **Production API Key** (starts with `tr_prod_`)

**Project Settings → General:**
- Copy your **Project Reference** (starts with `proj_`)

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
# Trigger.dev Configuration
TRIGGER_API_KEY=tr_dev_YOUR_API_KEY_HERE
TRIGGER_PROJECT_REF=proj_YOUR_PROJECT_REF_HERE

# Optional: Webhook secret for security
TRIGGER_WEBHOOK_SECRET=your_random_secret_here
```

**Generate webhook secret:**
```bash
openssl rand -hex 32
```

### 4. Deploy Your Tasks

```bash
# Development mode
npm run dev

# Production deployment
npx trigger-cli deploy
```

### 5. Test the Integration

**Start a background job:**
```bash
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUNO_API_KEY" \
  -d '{
    "prompt": "upbeat electronic dance music",
    "make_instrumental": false,
    "wait_audio": true
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "run_01234567890abcdef",
  "status": "processing",
  "message": "Music generation started. Use /api/v2/jobs/{jobId} to check status.",
  "checkStatusUrl": "/api/v2/jobs/run_01234567890abcdef"
}
```

**Check job status:**
```bash
curl http://localhost:3000/api/v2/jobs/run_01234567890abcdef
```

**Response (while processing):**
```json
{
  "jobId": "run_01234567890abcdef",
  "status": "EXECUTING",
  "createdAt": "2025-01-14T12:00:00Z",
  "updatedAt": "2025-01-14T12:00:15Z",
  "attempts": 1,
  "message": "Job is still processing. Check back later."
}
```

**Response (completed):**
```json
{
  "jobId": "run_01234567890abcdef",
  "status": "COMPLETED",
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Electronic Dance Song",
      "audio_url": "https://cdn.suno.ai/...",
      // ... other fields
    }
  ],
  "createdAt": "2025-01-14T12:00:00Z",
  "updatedAt": "2025-01-14T12:00:45Z"
}
```

## 📊 Monitoring & Dashboard

### Trigger.dev Dashboard

Access at: [https://cloud.trigger.dev](https://cloud.trigger.dev)

**Features:**
- 📈 **Real-time job tracking** - See all running jobs
- 🔍 **Detailed logs** - Debug failures with structured logs
- 📊 **Performance metrics** - Track execution times and success rates
- 🔔 **Alerts** - Get notified of failures
- 📝 **Job history** - Search and filter past jobs

### Job Statuses

| Status | Description |
|--------|-------------|
| `QUEUED` | Job is waiting to start |
| `EXECUTING` | Job is currently running |
| `REATTEMPTING` | Job failed and is retrying |
| `COMPLETED` | Job finished successfully |
| `FAILED` | Job failed after all retries (3 attempts) |
| `CANCELED` | Job was manually canceled |

## 🔄 Retry Strategy

**Automatic retries for:**
- ✅ CAPTCHA solving failures
- ✅ Network timeouts
- ✅ Rate limit errors (429)
- ✅ Server errors (5xx)

**Retry configuration:**
```typescript
retry: {
  maxAttempts: 3,        // Try up to 3 times
  minTimeoutInMs: 2000,  // Start with 2 second delay
  maxTimeoutInMs: 30000, // Max 30 second delay
  factor: 2,             // Exponential backoff (2x each time)
  randomize: true,       // Add jitter to prevent thundering herd
}
```

**Example retry timeline:**
- Attempt 1: Immediate
- Attempt 2: ~2-4 seconds later (random)
- Attempt 3: ~4-8 seconds later (random)

**Non-retryable errors** (fail immediately):
- ❌ Invalid input (bad prompt, etc.)
- ❌ Authentication errors
- ❌ Missing API key

## 🎛️ Configuration

### Concurrency Limits

Prevent overwhelming Suno.ai:

```typescript
// src/trigger/tasks/generate-music.ts
queue: {
  concurrencyLimit: 5,  // Max 5 concurrent music generations
}
```

**Adjust based on:**
- Your Suno.ai account limits
- CAPTCHA frequency (lower = fewer CAPTCHAs)
- Available system resources

### Custom Timeouts

For specific jobs:

```typescript
const handle = await generateMusicTask.trigger(payload, {
  ttl: "1h",  // Job expires after 1 hour if not completed
});
```

## 🪝 Webhooks (Optional)

Get notified when jobs complete instead of polling.

### 1. Configure Webhook URL

In Trigger.dev dashboard → **Webhooks**:
- **URL**: `https://your-domain.com/api/v2/webhooks/trigger`
- **Events**: Select `run.completed`, `run.failed`, `run.canceled`
- **Secret**: Use your `TRIGGER_WEBHOOK_SECRET`

### 2. Handle Webhook Events

The webhook handler is already implemented in:
`src/app/api/v2/webhooks/trigger/route.ts`

**Customize the handlers:**
```typescript
async function handleRunCompleted(event: any) {
  const { run } = event;
  const result = run.output as GenerateMusicResult;

  // YOUR CUSTOM LOGIC HERE:
  // - Save to database
  // - Send notification to user
  // - Update cache
  // - Send email/SMS
  // etc.
}
```

## 🔐 Security Best Practices

### 1. API Key Management

```bash
# Development
TRIGGER_API_KEY=tr_dev_...

# Production (use environment-specific keys)
TRIGGER_API_KEY=tr_prod_...
```

**Never commit API keys to git!**

### 2. Webhook Signature Verification

**TODO: Implement in production:**
```typescript
// src/app/api/v2/webhooks/trigger/route.ts
const isValid = verifyWebhookSignature(body, signature, webhookSecret);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 3. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Consider using @upstash/ratelimit or similar
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1m"), // 10 requests per minute
});
```

## 📈 Production Deployment

### 1. Deploy to Trigger.dev Cloud

```bash
# Install CLI
npm install -g trigger-cli

# Authenticate
npx trigger-cli login

# Deploy tasks
npx trigger-cli deploy
```

### 2. Update Environment Variables

Set production environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add TRIGGER_API_KEY
vercel env add TRIGGER_PROJECT_REF
```

**Other platforms:**
- Ensure `TRIGGER_API_KEY` and `TRIGGER_PROJECT_REF` are set
- Use production API key (`tr_prod_...`)

### 3. Monitor Performance

**Key metrics to track:**
- ⏱️ Average job duration
- ✅ Success rate
- 🔄 Retry frequency
- 📊 Queue depth
- 💰 CAPTCHA cost per job

## 🆚 API Comparison

### Old Sync API (`/api/generate`)

```bash
POST /api/generate
```

**Pros:**
- ✅ Simple to use
- ✅ Immediate response

**Cons:**
- ❌ 30 second HTTP timeout
- ❌ No retries
- ❌ Blocks during CAPTCHA solving
- ❌ No job tracking

### New Async API (`/api/v2/generate`)

```bash
POST /api/v2/generate      # Start job
GET  /api/v2/jobs/{runId}  # Check status
```

**Pros:**
- ✅ No HTTP timeout
- ✅ Automatic retries (3x)
- ✅ Job tracking & monitoring
- ✅ Webhooks for completion
- ✅ Queue management
- ✅ Better for high volume

**Cons:**
- ⚠️ Requires polling or webhooks
- ⚠️ More complex client code
- ⚠️ Additional Trigger.dev dependency

## 🧪 Testing

### Local Development

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Trigger.dev dev CLI (optional, for better logs)
npx trigger-cli dev

# Terminal 3: Test API
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test song", "make_instrumental": false, "wait_audio": true}'
```

### Simulate Failures

Test retry logic by:

1. **Invalid cookie**: Remove `SUNO_COOKIE` temporarily
2. **Network error**: Disconnect internet during job
3. **CAPTCHA failure**: Use a fresh cookie (more CAPTCHAs)

Watch retries in Trigger.dev dashboard!

## 🐛 Troubleshooting

### Jobs Not Starting

**Check:**
- ✅ `TRIGGER_API_KEY` is set correctly
- ✅ `TRIGGER_PROJECT_REF` matches your project
- ✅ Tasks are deployed (`npx trigger-cli deploy`)
- ✅ No syntax errors in task code

### Jobs Failing Immediately

**Check:**
- ✅ `SUNO_COOKIE` or `SUNO_API_KEY` is valid
- ✅ Required environment variables are set
- ✅ Suno.ai account has quota remaining
- ✅ Check error logs in Trigger.dev dashboard

### Webhooks Not Received

**Check:**
- ✅ Webhook URL is publicly accessible (use ngrok for local dev)
- ✅ Webhook URL is correct in Trigger.dev dashboard
- ✅ Events are selected in webhook configuration
- ✅ No firewall blocking requests

## 📚 Resources

- **Trigger.dev Docs**: [https://trigger.dev/docs](https://trigger.dev/docs)
- **Dashboard**: [https://cloud.trigger.dev](https://cloud.trigger.dev)
- **SDK Reference**: [https://trigger.dev/docs/sdk](https://trigger.dev/docs/sdk)
- **Examples**: [https://trigger.dev/docs/examples](https://trigger.dev/docs/examples)

## 🎯 Next Steps

1. **Set up Trigger.dev account** → Get API keys
2. **Configure environment variables** → Add to `.env`
3. **Deploy tasks** → `npx trigger-cli deploy`
4. **Test integration** → Try async API
5. **Set up webhooks** (optional) → For real-time updates
6. **Monitor dashboard** → Track performance
7. **Optimize settings** → Adjust concurrency and retries

---

**Need help?** Check the [Trigger.dev documentation](https://trigger.dev/docs) or open an issue in this repository.
