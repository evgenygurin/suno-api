# Trigger.dev Webhooks Setup - Real-Time Notifications

**Time required:** ~10 minutes
**Prerequisites:** First deployment completed, public URL (production) or ngrok (local dev)

## 🎯 Why Use Webhooks?

**Without webhooks (polling):**
```typescript
// Client must poll every few seconds
while (status !== 'COMPLETED') {
  const response = await fetch(`/api/v2/jobs/${jobId}`);
  const { status } = await response.json();
  await sleep(3000); // Wait 3 seconds
}
```

**With webhooks (event-driven):**
```typescript
// Server notifies you immediately when job completes
POST /api/v2/webhooks/trigger
{
  "type": "run.completed",
  "run": { "id": "run_123", "output": {...} }
}
```

**Benefits:**
- ⚡ **Instant notifications** - No waiting, no polling
- 💰 **Reduced costs** - Fewer API calls
- 🔋 **Lower load** - Server pushes instead of client pulling
- 🎯 **Better UX** - Real-time updates for users

## 🌐 Step 1: Get Public URL

Webhooks require a **publicly accessible URL**. Choose your scenario:

### Option A: Production Deployment (Vercel, AWS, etc.)

If already deployed:
```text
Your webhook URL: https://your-domain.com/api/v2/webhooks/trigger
```

**Example:**
- Vercel: `https://suno-api.vercel.app/api/v2/webhooks/trigger`
- AWS: `https://api.myapp.com/api/v2/webhooks/trigger`
- Custom domain: `https://music.yoursite.com/api/v2/webhooks/trigger`

### Option B: Local Development (ngrok)

For testing webhooks locally:

**1. Install ngrok:**
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

**2. Start ngrok tunnel:**
```bash
# In a new terminal
ngrok http 3000
```

**3. Copy public URL:**
```text
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
              ^^^^^^^^^^^^^^^^^^^^^^^^
              Use this URL
```

Your webhook URL: `https://abc123.ngrok.io/api/v2/webhooks/trigger`

⚠️ **Note:** Free ngrok URLs change every restart. For persistent URLs, upgrade to ngrok paid plan.

## 🔐 Step 2: Generate Webhook Secret

Security best practice: verify webhook signatures.

**Generate a secure secret:**
```bash
# Option 1: OpenSSL (recommended)
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Example output:**
```text
a1b2c3d4e5f6789012345678901234567890abcdefabcdef0123456789abcdef
```

**Save this secret:**
1. Add to `.env`:
   ```bash
   TRIGGER_WEBHOOK_SECRET=a1b2c3d4e5f6789012345678901234567890abcdefabcdef0123456789abcdef
   ```

2. Save it separately - you'll need it for Trigger.dev dashboard

## ⚙️ Step 3: Configure Webhook in Trigger.dev Dashboard

### 3.1 Navigate to Webhooks Settings

1. Go to [https://cloud.trigger.dev](https://cloud.trigger.dev)
2. Select your project (`suno-api`)
3. Click **"Settings"** in sidebar
4. Click **"Webhooks"** tab

### 3.2 Add Webhook Endpoint

**Click "Add Endpoint" or "Create Webhook"**

**Fill in the form:**

| Field | Value | Example |
|-------|-------|---------|
| **Name** | Descriptive name | "Production Webhook" or "Development Webhook" |
| **URL** | Your public webhook URL | `https://your-domain.com/api/v2/webhooks/trigger` |
| **Secret** | Your generated secret | `a1b2c3d4e5f6...` |
| **Events** | Select events to receive | `run.completed`, `run.failed`, `run.canceled` |
| **Active** | Enable/Disable | ✅ Checked |

**Events explanation:**

| Event | When Triggered | Use Case |
|-------|----------------|----------|
| `run.completed` | ✅ Job finished successfully | Send success notification, save result to DB |
| `run.failed` | ❌ Job failed after all retries | Log error, alert admin, refund user |
| `run.canceled` | 🚫 Job was manually canceled | Update UI, clean up resources |
| `run.started` | ▶️ Job started executing | Update status to "processing" |
| `run.reattempting` | 🔄 Job is retrying | Log retry attempt |

**Recommended for production:**
- Select: `run.completed`, `run.failed`, `run.canceled`
- These cover the main lifecycle events

### 3.3 Save Webhook

Click **"Save"** or **"Create Webhook"**

You should see:
- ✅ Webhook created successfully
- Webhook listed in "Endpoints" table
- Status: Active

## 🧪 Step 4: Test Webhook

### 4.1 Send Test Event from Dashboard

1. In Webhooks settings, find your endpoint
2. Click **"Test"** or **"Send Test Event"**
3. Select event type: `run.completed`
4. Click **"Send Test"**

**Expected result:**
- ✅ Status: 200 OK
- Message: "Webhook received"
- Check your server logs for received event

### 4.2 Trigger Real Job

```bash
# Trigger a music generation job
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUNO_API_KEY" \
  -d '{
    "prompt": "webhook test - short happy tune",
    "make_instrumental": false,
    "wait_audio": true
  }'

# Save the jobId from response
# Wait 10-30 seconds for job to complete
# Your webhook should receive a run.completed event
```

### 4.3 Check Webhook Logs

**In your server logs**, you should see:
```text
INFO: Received Trigger.dev webhook
  eventType: run.completed
  runId: run_abc123xyz
  taskId: generate-music

INFO: Music generation job completed
  runId: run_abc123xyz
  success: true
  hasData: true
```

**In Trigger.dev dashboard:**
1. Go to Settings → Webhooks
2. Click on your endpoint
3. View **"Recent Deliveries"**
4. Should show recent webhook attempts with status codes

## 🔒 Step 5: Implement Webhook Signature Verification

For **production security**, verify that webhooks are actually from Trigger.dev.

### 5.1 Current Implementation

The webhook handler is already set up in:
`src/app/api/v2/webhooks/trigger/route.ts`

But signature verification is commented out:
```typescript
// TODO: Implement signature verification
```

### 5.2 Implement Verification

**Install crypto (built-in Node.js module):**
No installation needed - `crypto` is part of Node.js

**Create verification utility:**

```typescript
// src/lib/webhook-verify.ts
import crypto from 'crypto';

export function verifyTriggerWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Trigger.dev uses HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Update webhook handler:**

```typescript
// src/app/api/v2/webhooks/trigger/route.ts
import { verifyTriggerWebhookSignature } from '@/lib/webhook-verify';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-trigger-signature');
  const webhookSecret = process.env.TRIGGER_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('TRIGGER_WEBHOOK_SECRET not configured');
    // Decide: allow webhook or reject?
    // For dev: allow, for prod: reject
  }

  if (webhookSecret && signature) {
    const payload = await req.text();
    const isValid = verifyTriggerWebhookSignature(
      payload,
      signature,
      webhookSecret
    );

    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse JSON after verification
    const event = JSON.parse(payload);
    // ... continue processing
  }
}
```

## 📊 Step 6: Custom Webhook Handlers

### 6.1 Save Results to Database

```typescript
// src/app/api/v2/webhooks/trigger/route.ts

async function handleRunCompleted(event: any) {
  const { run } = event;
  const result = run.output as GenerateMusicResult;

  if (result.success && result.data) {
    // Example: Save to database (implement your DB logic)
    await database.musicGenerations.create({
      runId: run.id,
      songs: result.data,
      userId: run.metadata?.userId, // if you passed metadata
      status: 'completed',
      createdAt: new Date(),
    });

    logger.info({ runId: run.id }, 'Saved music generation to database');
  }
}
```

### 6.2 Send User Notification

```typescript
async function handleRunCompleted(event: any) {
  const { run } = event;
  const userId = run.metadata?.userId; // passed during trigger

  if (userId) {
    // Email notification
    await sendEmail({
      to: getUserEmail(userId),
      subject: 'Your music is ready! 🎵',
      body: `Your song "${run.output.data[0].title}" has been generated successfully!`,
    });

    // Or push notification
    await sendPushNotification({
      userId,
      title: 'Music Ready',
      body: 'Your song is ready to listen!',
      data: { runId: run.id, songUrl: run.output.data[0].audio_url },
    });
  }
}
```

### 6.3 Trigger Downstream Workflow

```typescript
async function handleRunCompleted(event: any) {
  const { run } = event;

  // Trigger another task (e.g., upload to S3, transcode, etc.)
  await tasks.trigger('upload-to-storage', {
    audioUrl: run.output.data[0].audio_url,
    songId: run.output.data[0].id,
  });

  logger.info({ runId: run.id }, 'Triggered upload task');
}
```

### 6.4 Update Cache

```typescript
async function handleRunCompleted(event: any) {
  const { run } = event;

  // Invalidate cache
  await redis.del(`job:${run.id}`);

  // Set cache with result
  await redis.setex(
    `song:${run.output.data[0].id}`,
    3600, // 1 hour TTL
    JSON.stringify(run.output.data[0])
  );
}
```

## 🛡️ Step 7: Production Security Checklist

Before going to production:

- [ ] **Webhook secret configured** in `.env`
- [ ] **Signature verification enabled** (uncomment TODO)
- [ ] **HTTPS only** (no HTTP webhooks)
- [ ] **Rate limiting** on webhook endpoint
- [ ] **Idempotency** - handle duplicate events
- [ ] **Error handling** - don't expose internals
- [ ] **Logging** - log all webhook events
- [ ] **Monitoring** - alert on webhook failures

### 7.1 Rate Limiting Example

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Continue with webhook processing
}
```

### 7.2 Idempotency Example

```typescript
// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();

export async function POST(req: NextRequest) {
  const event = await req.json();
  const webhookId = event.id; // Trigger.dev sends unique ID

  if (processedWebhooks.has(webhookId)) {
    logger.info({ webhookId }, 'Duplicate webhook, skipping');
    return NextResponse.json({ success: true, message: 'Already processed' });
  }

  // Process webhook
  await handleRunCompleted(event);

  // Mark as processed
  processedWebhooks.add(webhookId);

  // Clean up old IDs (keep last 1000)
  if (processedWebhooks.size > 1000) {
    const firstId = processedWebhooks.values().next().value;
    processedWebhooks.delete(firstId);
  }

  return NextResponse.json({ success: true });
}
```

## 🧪 Step 8: Testing Webhooks Locally

### 8.1 Use ngrok for Local Testing

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Terminal 3: Trigger job
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "make_instrumental": false, "wait_audio": true}'

# Watch logs in Terminal 1 for webhook event
```

### 8.2 Manual Webhook Testing

Use curl to simulate a webhook:

```bash
curl -X POST http://localhost:3000/api/v2/webhooks/trigger \
  -H "Content-Type: application/json" \
  -H "x-trigger-signature: test_signature" \
  -d '{
    "type": "run.completed",
    "run": {
      "id": "run_test123",
      "status": "COMPLETED",
      "output": {
        "success": true,
        "data": [{"id": "song_1", "title": "Test Song"}]
      }
    }
  }'
```

## 📈 Step 9: Monitor Webhook Deliveries

### 9.1 Dashboard Monitoring

1. Go to Trigger.dev dashboard
2. Settings → Webhooks
3. Click on your endpoint
4. View **"Recent Deliveries"**:
   - ✅ Success: 200 status
   - ⚠️ Warning: 4xx status (client error)
   - ❌ Error: 5xx status (server error)

### 9.2 Automatic Retries

Trigger.dev automatically retries failed webhooks:
- **Retry schedule**: Exponential backoff
- **Max attempts**: 3-5 (configurable)
- **Timeout**: 30 seconds per attempt

If webhook fails after all retries:
- Event is marked as "Failed" in dashboard
- You can manually retry from dashboard

## 🔧 Troubleshooting Webhooks

### Issue: "Webhooks not received"

**Check:**
1. Webhook URL is publicly accessible
2. Firewall allows incoming POST requests
3. HTTPS certificate is valid
4. Endpoint returns 200 status
5. No rate limiting blocking requests

**Test connectivity:**
```bash
curl -X POST https://your-domain.com/api/v2/webhooks/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

### Issue: "401 Unauthorized" in webhook deliveries

**Causes:**
- Invalid signature verification
- Missing `TRIGGER_WEBHOOK_SECRET`
- Secret mismatch between dashboard and `.env`

**Fix:**
1. Regenerate secret
2. Update both dashboard and `.env`
3. Restart application
4. Test again

### Issue: "Duplicate events received"

**Solution:** Implement idempotency (see Step 7.2)

### Issue: "ngrok URL changes on restart"

**Solutions:**
1. Use ngrok paid plan for static URLs
2. For development, update webhook URL in dashboard when ngrok restarts
3. Use a development server with static IP

## ✅ Webhook Setup Checklist

After completing setup:

- [x] Public URL obtained (production or ngrok)
- [x] Webhook secret generated and saved
- [x] Webhook configured in Trigger.dev dashboard
- [x] Events selected (run.completed, run.failed, run.canceled)
- [x] Test webhook sent successfully
- [x] Real job triggered and webhook received
- [x] Signature verification implemented (production)
- [x] Custom handlers added for your use case
- [x] Security measures implemented (rate limiting, idempotency)
- [x] Monitoring set up in dashboard

## 🎉 Success!

You now have **real-time webhooks** configured! Your application will:
- ✅ Receive instant notifications when jobs complete
- ✅ Automatically retry failed webhooks
- ✅ Verify webhook authenticity with signatures
- ✅ Execute custom logic based on job outcomes

## 📚 Next Steps

- **Add more webhook handlers** for different events
- **Integrate with notification services** (email, SMS, push)
- **Store results in database** automatically
- **Build real-time UI updates** with websockets
- **Set up monitoring alerts** for failed webhooks

---

**Need help?** Check [Trigger.dev webhook docs](https://trigger.dev/docs/guides/frameworks/nextjs-webhooks)
