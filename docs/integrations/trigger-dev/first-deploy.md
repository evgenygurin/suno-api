# First Trigger.dev Deployment - Step-by-Step Guide

**Time required:** ~15 minutes
**Prerequisites:** Node.js, npm, Trigger.dev account

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Trigger.dev account created
- [ ] Project created in dashboard
- [ ] Environment variables configured in `.env`
- [ ] Code committed to git (recommended)
- [ ] All dependencies installed (`npm install`)

## 🚀 Step 1: Create Trigger.dev Account

### 1.1 Sign Up

1. Go to [https://trigger.dev](https://trigger.dev)
2. Click "Get Started" or "Sign Up"
3. Choose sign-up method:
   - **GitHub** (recommended - easiest for CI/CD later)
   - **Google**
   - **Email**

### 1.2 Create Organization (if first time)

1. After signup, you'll be prompted to create an organization
2. Enter organization name (e.g., "My Company" or your GitHub username)
3. Click "Create Organization"

### 1.3 Create Project

1. Click "New Project" or "Create Project"
2. **Project Name**: `suno-api` (or your preferred name)
3. **Framework**: Select "Next.js"
4. Click "Create Project"

## 🔑 Step 2: Get API Credentials

### 2.1 Get API Key

1. In your project dashboard, go to **"Settings"** → **"API Keys"**
2. You'll see two keys:
   - **Development API Key** - starts with `tr_dev_`
   - **Production API Key** - starts with `tr_prod_`
3. Click "Copy" next to **Development API Key**
4. Save it temporarily (you'll add it to `.env` next)

### 2.2 Get Project Reference

1. In project dashboard, go to **"Settings"** → **"General"**
2. Find **"Project ID"** or **"Project Reference"**
3. Should start with `proj_`
4. Click copy icon
5. Save it temporarily

### 2.3 Get Webhook Secret (Optional but Recommended)

1. In project dashboard, go to **"Settings"** → **"Webhooks"**
2. Click "Generate Secret" or you can generate your own:

```bash
# Generate a secure webhook secret
openssl rand -hex 32
```

3. Copy the generated secret

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Update `.env` file

Open your `.env` file and add:

```bash
# Trigger.dev Configuration
TRIGGER_API_KEY=tr_dev_YOUR_ACTUAL_KEY_HERE
TRIGGER_PROJECT_REF=proj_YOUR_ACTUAL_REF_HERE
TRIGGER_WEBHOOK_SECRET=your_generated_secret_here
```

**Example:**
```bash
TRIGGER_API_KEY=tr_dev_abc123xyz789...
TRIGGER_PROJECT_REF=proj_suno_api_12345
TRIGGER_WEBHOOK_SECRET=a1b2c3d4e5f6...
```

### 3.2 Verify Configuration

Check that all variables are set:

```bash
# Quick verification
node -e "
require('dotenv').config();
console.log('✅ TRIGGER_API_KEY:', process.env.TRIGGER_API_KEY ? 'SET' : '❌ MISSING');
console.log('✅ TRIGGER_PROJECT_REF:', process.env.TRIGGER_PROJECT_REF ? 'SET' : '❌ MISSING');
console.log('✅ TRIGGER_WEBHOOK_SECRET:', process.env.TRIGGER_WEBHOOK_SECRET ? 'SET' : '❌ MISSING');
"
```

## 📦 Step 4: Install Trigger.dev CLI (First Time Only)

The CLI is already configured in package.json scripts, but you can install globally if needed:

```bash
# Optional: Global installation for easier access
npm install -g trigger-cli

# Or use via npx (no installation needed)
npx trigger-cli@latest --version
```

## 🔐 Step 5: Authenticate CLI

### 5.1 Login to Trigger.dev

```bash
npx trigger-cli@latest login
```

This will:
1. Open browser for authentication
2. Ask you to select organization
3. Save credentials locally in `~/.trigger`

### 5.2 Verify Authentication

```bash
npx trigger-cli@latest whoami
```

Should show your username and organization.

## 🚀 Step 6: First Deployment

### 6.1 Deploy Tasks to Development Environment

```bash
# Using npm script (recommended)
npm run trigger:deploy

# Or directly
npx trigger-cli@latest deploy
```

**What happens:**
1. CLI analyzes your `src/trigger/` directory
2. Finds all tasks (e.g., `generate-music`)
3. Bundles and uploads them to Trigger.dev
4. Registers tasks in your project
5. Shows deployment URL and task IDs

**Expected output:**
```text
✓ Authenticating with Trigger.dev
✓ Building project
✓ Deploying tasks to development environment
✓ Deployment successful!

Tasks deployed:
  → generate-music (task_abc123)

Deployment URL: https://cloud.trigger.dev/projects/proj_xyz/deployments/dep_123
```

### 6.2 Verify Deployment in Dashboard

1. Go to [https://cloud.trigger.dev](https://cloud.trigger.dev)
2. Navigate to your project
3. Click **"Tasks"** in sidebar
4. You should see:
   - ✅ `generate-music` task listed
   - Status: Active
   - Last deployed: Just now

## ✅ Step 7: Test Your First Job

### 7.1 Start Local Development Server

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2 (optional): Start Trigger.dev dev server for better logs
npm run trigger:dev
```

### 7.2 Trigger Test Job via API

```bash
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUNO_API_KEY" \
  -d '{
    "prompt": "test deployment with a short happy song",
    "make_instrumental": false,
    "wait_audio": true
  }'
```

**Expected response:**
```json
{
  "success": true,
  "jobId": "run_abc123xyz",
  "status": "processing",
  "message": "Music generation started. Use /api/v2/jobs/{jobId} to check status.",
  "checkStatusUrl": "/api/v2/jobs/run_abc123xyz"
}
```

### 7.3 Monitor Job in Dashboard

1. Go to Trigger.dev dashboard
2. Click **"Runs"** in sidebar
3. You should see your job:
   - Task: `generate-music`
   - Status: `EXECUTING` or `COMPLETED`
   - Click on it for detailed logs

### 7.4 Check Job Status via API

```bash
# Replace with your actual jobId
curl http://localhost:3000/api/v2/jobs/run_abc123xyz
```

**While processing:**
```json
{
  "jobId": "run_abc123xyz",
  "status": "EXECUTING",
  "createdAt": "2025-01-14T12:00:00Z",
  "message": "Job is still processing. Check back later."
}
```

**When completed:**
```json
{
  "jobId": "run_abc123xyz",
  "status": "COMPLETED",
  "success": true,
  "data": [
    {
      "id": "song_123",
      "title": "Happy Song",
      "audio_url": "https://cdn.suno.ai/abc123.mp3",
      "duration": 120
    }
  ]
}
```

## 🎯 Step 8: Test Retry Mechanism

### 8.1 Trigger Job with Invalid Cookie (to test retry)

Temporarily remove or corrupt your `SUNO_COOKIE`:

```bash
# Backup current cookie
cp .env .env.backup

# Temporarily set invalid cookie
echo "SUNO_COOKIE=invalid_cookie_test" >> .env

# Trigger job
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test retry", "make_instrumental": false, "wait_audio": true}'
```

### 8.2 Watch Retries in Dashboard

1. Go to Trigger.dev dashboard → Runs
2. Find the failing job
3. You should see:
   - **Attempt 1**: Failed (invalid cookie)
   - **Attempt 2**: Retrying after ~2-4 seconds
   - **Attempt 3**: Retrying after ~4-8 seconds
   - **Final Status**: Failed after 3 attempts

### 8.3 Restore Valid Cookie

```bash
# Restore backup
mv .env.backup .env
```

## 📊 Step 9: Explore Dashboard Features

### 9.1 Runs Page

- **Filter by status**: COMPLETED, FAILED, EXECUTING
- **Search by ID**: Find specific jobs
- **View logs**: Click any run for detailed logs
- **Replay failed runs**: Click "Replay" button

### 9.2 Tasks Page

- **View all tasks**: See deployed tasks
- **Task versions**: Track deployments over time
- **Trigger manually**: Test tasks from dashboard

### 9.3 Schedules (Future Feature)

For scheduled jobs (not implemented yet in this project):
- Create cron schedules
- Manage timezone settings
- Activate/deactivate schedules

## 🔧 Troubleshooting First Deployment

### Issue: "Authentication failed"

**Solution:**
```bash
# Re-login
npx trigger-cli@latest login

# Verify credentials
npx trigger-cli@latest whoami
```

### Issue: "No tasks found"

**Check:**
1. Tasks exist in `src/trigger/tasks/` directory
2. Tasks export properly in `src/trigger/index.ts`
3. `trigger.config.ts` has correct `dirs: ["./src/trigger"]`

**Fix:**
```bash
# Re-deploy
npm run trigger:deploy -- --verbose
```

### Issue: "Environment variables not found"

**Check `.env` file:**
```bash
cat .env | grep TRIGGER
```

Should show:
```text
TRIGGER_API_KEY=tr_dev_...
TRIGGER_PROJECT_REF=proj_...
```

**Restart server after updating .env:**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Issue: "Jobs not appearing in dashboard"

**Check:**
1. Using correct Trigger.dev account
2. Viewing correct project
3. Development vs Production environment
4. API key matches deployed environment

### Issue: "Jobs failing immediately"

**Common causes:**
- Invalid `SUNO_API_KEY` or `SUNO_COOKIE`
- Missing environment variables in Trigger.dev
- Network/firewall blocking Suno.ai

**Check logs in dashboard:**
1. Go to failed run
2. Expand "Logs" section
3. Look for error messages

## 🎉 Success Checklist

After successful first deployment, you should have:

- [x] Trigger.dev account created
- [x] Project set up with API keys
- [x] Tasks deployed successfully
- [x] Test job executed and completed
- [x] Jobs visible in dashboard
- [x] Retry mechanism tested
- [x] Environment variables configured
- [x] Local development working

## 📈 Next Steps

Now that deployment works, you can:

1. **Set up webhooks** → [See webhook configuration guide](#)
2. **Deploy to production** → Use production API key
3. **Configure CI/CD** → Automate deployments
4. **Set up monitoring** → Error tracking, alerts
5. **Optimize settings** → Adjust concurrency, timeouts

## 🔗 Useful Commands Reference

```bash
# Deployment
npm run trigger:deploy              # Deploy to development
npm run trigger:deploy -- --prod    # Deploy to production
npm run trigger:deploy -- --verbose # Verbose output

# Development
npm run trigger:dev                 # Local dev server with hot reload
npm run dev                         # Next.js dev server

# CLI
npx trigger-cli@latest login        # Authenticate
npx trigger-cli@latest whoami       # Check auth status
npx trigger-cli@latest list-tasks   # List deployed tasks
npx trigger-cli@latest list-runs    # List recent runs
npx trigger-cli@latest replay <runId> # Replay a failed run

# Testing
curl -X POST http://localhost:3000/api/v2/generate -H "Content-Type: application/json" -d '{"prompt": "test", "make_instrumental": false, "wait_audio": true}'
curl http://localhost:3000/api/v2/jobs/<runId>
```

## 🆘 Getting Help

If you're stuck:

1. **Check documentation**: `docs/TRIGGER_DEV_SETUP.md`
2. **Trigger.dev docs**: [https://trigger.dev/docs](https://trigger.dev/docs)
3. **Discord community**: [https://trigger.dev/discord](https://trigger.dev/discord)
4. **GitHub issues**: Check project issues
5. **Dashboard logs**: Most errors show detailed stack traces

---

**Congratulations! You've successfully deployed your first Trigger.dev background job! 🎉**

Next: [Set up webhooks for real-time notifications →](./TRIGGER_WEBHOOKS_SETUP.md)
