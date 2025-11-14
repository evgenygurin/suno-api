# AI SDK Integration - Quick Start Guide

## ⚡️ Get Started in 5 Minutes

This guide will get you up and running with AI-enhanced music generation using Vercel AI SDK + Trigger.dev.

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ Suno API project already set up
- ✅ Trigger.dev account and configuration (see `.env.example`)
- ⚠️ OpenAI API account (new requirement)

## 🚀 Step 1: Install Dependencies

```bash
# Install Vercel AI SDK
npm install ai @ai-sdk/openai zod

# Install Trigger.dev React hooks (if not already installed)
npm install @trigger.dev/react-hooks
```

## 🔑 Step 2: Get OpenAI API Key

1. **Create OpenAI account**: https://platform.openai.com/signup
2. **Generate API key**: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - **Important**: Save it immediately - you won't see it again!

3. **Add to `.env` file**:

```bash
# Add this to your .env file
OPENAI_API_KEY=sk-proj-...your-key-here...
```

## ⚙️ Step 3: Verify Configuration

Check that all required environment variables are set:

```bash
# Required for AI SDK
OPENAI_API_KEY=sk-...          # ✅ Just added

# Required for Trigger.dev (should already be set)
TRIGGER_API_KEY=tr_dev_...     # ✅ Already configured
TRIGGER_PROJECT_REF=proj_...   # ✅ Already configured

# Required for Suno (should already be set)
SUNO_COOKIE=...                # ✅ Already configured
```

## 🧪 Step 4: Test AI Integration

Run the test function to verify AI SDK works:

```typescript
// Add to src/trigger/ai-enhanced-generation.ts (already included)
import { testAIIntegration } from './ai-enhanced-generation';

// Run via Node.js or add to a test file
testAIIntegration().then(result => {
  console.log('AI SDK Test:', result);
});
```

Or test via API endpoint:

```bash
# Start dev server
npm run dev

# Test in another terminal
curl -X POST http://localhost:3000/api/ai-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A happy upbeat electronic song",
    "userId": "test-user"
  }'
```

Expected response:

```json
{
  "success": true,
  "taskId": "run_abc123...",
  "message": "AI-enhanced music generation started",
  "data": {
    "taskId": "run_abc123...",
    "status": "processing",
    "originalPrompt": "A happy upbeat electronic song"
  },
  "timestamp": "2025-01-15T..."
}
```

## 🎨 Step 5: Run the React Component

1. **Create a page to use the component**:

```typescript
// src/app/ai-demo/page.tsx
import AIEnhancedMusicGenerator from '@/app/components/AIEnhancedMusicGenerator';

export default function AIDemoPage() {
  return <AIEnhancedMusicGenerator />;
}
```

2. **Start the dev server**:

```bash
npm run dev
```

3. **Open in browser**:

```text
http://localhost:3000/ai-demo
```

4. **Try it out**:
   - Enter a music prompt like "A dreamy electronic track with synths"
   - Click "Generate Music with AI"
   - Watch real-time progress updates!

## 📊 Step 6: Monitor Tasks in Trigger.dev

1. **Open Trigger.dev dashboard**: https://cloud.trigger.dev
2. **Navigate to your project**: `suno-api`
3. **View runs**: Click "Runs" to see all task executions
4. **Watch live**: Tasks show real-time progress and metadata updates

## 🔍 Troubleshooting

### Issue: "OpenAI API key not found"

**Solution**: Make sure `OPENAI_API_KEY` is set in `.env`:

```bash
# Check if variable is set
echo $OPENAI_API_KEY

# If empty, add to .env
echo 'OPENAI_API_KEY=sk-...' >> .env

# Restart dev server
npm run dev
```

### Issue: "Module 'ai' not found"

**Solution**: Install dependencies:

```bash
npm install ai @ai-sdk/openai zod
```

### Issue: "Task not found: ai-enhanced-music-generation"

**Solution**: Make sure Trigger.dev CLI is running:

```bash
# Development mode
npx trigger.dev@latest dev

# Or in another terminal
npm run dev:trigger
```

### Issue: AI responses are slow

**Solution**: This is normal! AI generation takes time:

- Prompt enhancement: ~2-5 seconds
- Style analysis: ~3-7 seconds
- Music generation: ~10-30 seconds
- **Total**: ~15-45 seconds

### Issue: Rate limit errors from OpenAI

**Solution**: Check your OpenAI API usage:

1. Visit: https://platform.openai.com/usage
2. Check if you've exceeded free tier limits
3. Add payment method if needed
4. Use `gpt-4o-mini` for cheaper requests:

```typescript
// In ai-enhanced-generation.ts, change model
const result = await streamText({
  model: openai('gpt-4o-mini'), // Cheaper model
  // ...
});
```

## 📈 Usage Tips

### Optimize Costs

```typescript
// Use mini model for simple tasks
model: openai('gpt-4o-mini')  // ~60x cheaper than gpt-4o

// Limit token usage
maxTokens: 500  // Cap response length

// Cache system prompts (automatically cached)
system: `You are a music expert...`  // Reused across requests
```

### Improve Prompt Quality

```typescript
// ✅ Good prompts are specific
"A dreamy electronic track with ethereal synths, soft pads, and gentle beats at 90 BPM"

// ❌ Vague prompts get generic results
"make music"

// ✅ Include style references
"Inspired by Tycho and Bonobo, ambient electronic with warm analog synths"
```

### Monitor Token Usage

```typescript
// Add to onFinish callback
onFinish: async ({ usage }) => {
  console.log('Tokens used:', usage.totalTokens);
  console.log('Estimated cost:', usage.totalTokens * 0.000001); // ~$0.001 per 1K tokens
}
```

## 🎯 Next Steps

Now that AI SDK is working:

1. **Customize prompts** - Edit system prompts in `ai-enhanced-generation.ts`
2. **Add more tools** - Create tools for music search, recommendations, etc.
3. **Build chat interface** - Use `useChat` hook for conversational AI
4. **Implement streaming** - Show AI responses word-by-word
5. **Deploy to production** - Set `OPENAI_API_KEY` in production environment

## 📚 Additional Resources

- **Full Integration Guide**: [AI_SDK_INTEGRATION.md](./AI_SDK_INTEGRATION.md)
- **Vercel AI SDK Docs**: https://sdk.vercel.ai/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Trigger.dev Docs**: https://trigger.dev/docs

## ✅ Checklist

- [ ] Installed AI SDK packages
- [ ] Added `OPENAI_API_KEY` to `.env`
- [ ] Tested API endpoint works
- [ ] Viewed component in browser
- [ ] Monitored task in Trigger.dev dashboard
- [ ] Understand token costs and optimization

## 🎉 Success!

You now have AI-enhanced music generation running! The system will:

1. ✨ **Enhance** user prompts with AI
2. 🎼 **Analyze** musical style and metadata
3. 🎵 **Generate** music via Suno API
4. 📊 **Track** progress in real-time
5. ✅ **Return** enhanced results

---

**Questions?** Check [AI_SDK_INTEGRATION.md](./AI_SDK_INTEGRATION.md) for comprehensive documentation.

**Issues?** Open a GitHub issue or ask in #suno-api-dev Slack channel.
