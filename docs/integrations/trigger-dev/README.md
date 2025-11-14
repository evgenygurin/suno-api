# Trigger.dev Integration Section for README.md

**Add this section to README.md** after the "Features" section or in a new "Advanced Features" section.

---

## 🚀 Background Jobs & Queue Management

For high-volume production use, this project integrates with **Trigger.dev** for reliable background job processing.

### Why Background Jobs?

**Traditional Sync API** (simple but limited):
```typescript
POST /api/generate  // Blocks for 5-30 seconds, 30s HTTP timeout
```

**Background Jobs API** (production-ready):
```typescript
POST /api/v2/generate       // Returns immediately with job ID
GET  /api/v2/jobs/{runId}   // Check status anytime
```

### Key Benefits

| Feature | Sync API | Background Jobs (Trigger.dev) |
|---------|----------|-------------------------------|
| **HTTP Timeout** | ❌ 30 seconds | ✅ No limit |
| **Auto Retries** | ❌ None | ✅ 3 attempts w/ exponential backoff |
| **Queue Management** | ❌ No control | ✅ Concurrency limits (5 jobs) |
| **Job Tracking** | ❌ No status | ✅ Real-time status & monitoring |
| **Webhooks** | ❌ Polling required | ✅ Event-driven notifications |
| **Reliability** | ❌ Lost on crash | ✅ Persistent jobs |

### Quick Setup (5 minutes)

1. **Create Trigger.dev account**: [trigger.dev](https://trigger.dev)
2. **Get API credentials** from dashboard
3. **Configure environment**:
   ```bash
   TRIGGER_API_KEY=tr_dev_YOUR_KEY
   TRIGGER_PROJECT_REF=proj_YOUR_REF
   ```
4. **Deploy tasks**:
   ```bash
   npm run trigger:deploy
   ```

### Usage Example

**Start background job:**
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

**Response (immediate):**
```json
{
  "success": true,
  "jobId": "run_abc123",
  "status": "processing",
  "checkStatusUrl": "/api/v2/jobs/run_abc123"
}
```

**Check status:**
```bash
curl http://localhost:3000/api/v2/jobs/run_abc123
```

**Response (when completed):**
```json
{
  "jobId": "run_abc123",
  "status": "COMPLETED",
  "success": true,
  "data": [{
    "id": "song_123",
    "title": "Electronic Dance Song",
    "audio_url": "https://cdn.suno.ai/...",
    "duration": 180
  }]
}
```

### Features

- ⚡ **Instant Response** - No waiting for music generation
- 🔄 **Automatic Retries** - 3 attempts with smart backoff (2s → 8s → 30s)
- 📋 **Queue Management** - Max 5 concurrent jobs (configurable)
- 📊 **Dashboard** - Monitor all jobs at [cloud.trigger.dev](https://cloud.trigger.dev)
- 🪝 **Webhooks** - Get notified when jobs complete (optional)
- 💪 **Resilient** - Jobs survive server restarts

### Documentation

- **Quick Start (5 min)**: [TRIGGER_DEV_QUICKSTART.md](./TRIGGER_DEV_QUICKSTART.md)
- **Complete Guide**: [docs/TRIGGER_DEV_SETUP.md](./docs/TRIGGER_DEV_SETUP.md)
- **First Deployment**: [docs/TRIGGER_FIRST_DEPLOY.md](./docs/TRIGGER_FIRST_DEPLOY.md)
- **Webhooks Setup**: [docs/TRIGGER_WEBHOOKS_SETUP.md](./docs/TRIGGER_WEBHOOKS_SETUP.md)

### Helper Scripts

```bash
# Pre-deployment checklist
npm run trigger:check

# Deploy tasks to Trigger.dev
npm run trigger:deploy

# Test webhook locally
npm run webhook:test
```

### When to Use

**Use Sync API** (`/api/generate`) if:
- ✅ Low traffic (< 10 requests/day)
- ✅ Simple integration needed
- ✅ Immediate response acceptable

**Use Background Jobs** (`/api/v2/generate`) if:
- ✅ High volume production (> 100 requests/day)
- ✅ Need reliability & retries
- ✅ Want job tracking & monitoring
- ✅ Building user-facing application

---

**Both APIs are available** - choose based on your needs!
