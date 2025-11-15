# Claude-Specific Instructions for Suno API

This file contains specific instructions and context for Claude AI assistant when working with the Suno API project.

## 🎯 Quick Start for Claude

**This project has full MCP (Model Context Protocol) integration AND production-ready CI/CD!**

### Available Tools & Integrations

You have access to these powerful tools:
- 📚 **Context7**: `use context7 to find [library] documentation`
- 🐙 **GitHub MCP**: Manage repos, PRs, issues, CI/CD workflows
- 🤖 **Codegen.com**: AI-powered code generation and review ✨ **FULLY CONFIGURED**
- 🧠 **R2R Agent**: 16 specialized tools for codebase intelligence
- 🔍 **Tavily**: Web search and content extraction
- 🐛 **Sentry**: Error tracking and performance monitoring ✨ **FULLY CONFIGURED**
- 🔄 **CircleCI**: Advanced CI/CD workflows ✨ **FULLY CONFIGURED**
- 📋 **Linear**: Issue tracking (optional)
- 💡 **Cursor AI**: Enhanced editor with MCP ✨ **FULLY CONFIGURED**
- 🎵 **Suno Music**: FastMCP server for Suno AI music generation ✨ **PATCHED & WORKING**

> **Note**: The Suno Music MCP server includes a critical patch for FastMCP compatibility with Claude. See `suno-fastmcp-server/FASTMCP-PATCH.md` for details.

### 📖 Documentation Quick Links

**MCP & Agent Tools:**
- [MCP Quick Start (5 min)](./MCP-QUICKSTART.md)
- [Complete MCP Setup Guide](./MCP-SETUP.md)
- [R2R Agent Tools](./r2r-mcp-server/README.md)

**Integrations:**
- **[INTEGRATIONS.md](./INTEGRATIONS.md)** - Complete integration guide ⭐
- [Setup Script](./scripts/setup-integrations.sh) - Automated setup
- [Environment Variables](./.env.example) - All required keys

---

## Project Context for Claude

You are working on **Suno API v2.0**, a TypeScript/Next.js client library that wraps the official Suno API from [sunoapi.org](https://sunoapi.org). This project provides a clean, type-safe interface for AI music generation with full Next.js App Router integration.

### 🎉 Architecture v2.0 (Current)

**Migration from v1.x**: This project has been completely rewritten to use the official Suno API instead of browser automation.

**Previous (v1.x)**: Browser (Playwright) → Suno.ai web UI → CAPTCHA solving (2Captcha) ❌ Deprecated
**Current (v2.0)**: Your API → [SunoAPI.org](https://sunoapi.org) → Suno.ai → AI Music ✅ **Active**

### Key Technologies You Should Know
- **Next.js 14** with App Router (NOT Pages Router)
- **TypeScript** with strict mode
- **Axios** for HTTP client with proper typing
- **React 18** with functional components and hooks (for frontend)
- **Pino** for structured logging
- **SunoAPI.org** - Official API wrapper (API key authentication)
- **MCP Integrations**: Context7, GitHub MCP, Codegen.com, R2R Agent, Tavily

## Your Role as Claude

### When Helping with Code
1. **Always consider API-based architecture**: This is a REST API client, not browser automation
2. **Respect async operations**: API calls are async - use proper await/Promise handling
3. **Think about HTTP semantics**: Proper status codes, headers, and error responses
4. **Handle API errors gracefully**: Network issues, rate limits, and API errors are common
5. **Use typed interfaces**: Leverage TypeScript interfaces for API requests/responses

### Code Generation Guidelines

#### TypeScript Best Practices
```typescript
// ✅ GOOD: Proper typing
interface MusicGenerationRequest {
  prompt: string;
  make_instrumental: boolean;
  wait_audio: boolean;
}

// ❌ BAD: Using any
function generateMusic(data: any) { ... }

// ✅ GOOD: Type-safe error handling
try {
  const result = await generateMusic(payload);
} catch (error) {
  if (error instanceof Error) {
    logger.error({ error: error.message }, 'Music generation failed');
  }
}
```

#### Next.js App Router Patterns
```typescript
// ✅ GOOD: App Router API route
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// ❌ BAD: Pages Router pattern (don't use this)
export default function handler(req, res) { ... }
```

#### SunoApi Client Usage
```typescript
// ✅ GOOD: Proper API client usage with error handling
import { sunoApi } from '@/lib/SunoApi';

async function generateMusic(prompt: string) {
  try {
    const api = await sunoApi(); // Uses SUNO_API_KEY from env

    // Generate music with proper typing
    const results = await api.generate(
      prompt,
      false, // make_instrumental
      'V3_5', // model
      true // wait_audio
    );

    return { success: true, data: results };
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Music generation failed');
    }
    throw error;
  }
}

// ❌ BAD: No error handling or typing
async function generateMusic(prompt) {
  const api = await sunoApi();
  return api.generate(prompt); // Missing parameters and error handling!
}
```

### When Reviewing Code

Check for these common issues:
- [ ] Proper TypeScript types (no `any`)
- [ ] Error handling with try-catch
- [ ] Logging with Pino logger
- [ ] Async/await used correctly
- [ ] Environment variables accessed properly (especially `SUNO_API_KEY`)
- [ ] Secrets not hardcoded
- [ ] SunoApi client initialized correctly
- [ ] API responses follow consistent format
- [ ] HTTP status codes are appropriate
- [ ] Rate limiting and credit management considered

### When Debugging

#### Common Issues to Check

**1. API Authentication**
- Is `SUNO_API_KEY` environment variable set?
- Is the API key valid and active?
- Check API key format (should start with prefix from provider)
- Verify API key has not expired

**2. Credits & Rate Limits**
- Does the account have sufficient credits?
- Check credit balance with `api.get_credits()`
- Are you hitting rate limits? (check response headers)
- Monitor daily/monthly usage limits

**3. API Errors**
- Check logs with Pino for detailed error info
- Verify request payload matches API schema
- Check HTTP status codes (401=auth, 429=rate limit, 500=server error)
- Look for specific error messages in response
- Verify model names are correct (V3_5, V4, V4_5, V4_5PLUS, V5)

**4. Network & Timeout Issues**
- Check network connectivity to sunoapi.org
- Verify firewall/proxy settings
- Adjust timeout values if needed (default: 30s)
- Handle intermittent API availability

### When Adding New Features

Follow this checklist:
1. **Understand the SunoAPI.org endpoint**: Check [API documentation](https://docs.sunoapi.org)
2. **Design API endpoint**: What parameters? What response format?
3. **Implement with TypeScript**: Proper types and interfaces
4. **Add to SunoApi class**: Add method with proper typing
5. **Add error handling**: Handle all API failure cases
6. **Implement logging**: Log important events and errors
7. **Test manually**: Use curl or Postman
8. **Update API routes**: Create/update Next.js API routes
9. **Update README**: Add examples and documentation

### Specific Patterns to Use

#### API Response Format
```typescript
// ✅ Always use this format for success
return NextResponse.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString()
});

// ✅ Always use this format for errors
return NextResponse.json(
  {
    error: 'ErrorType',
    message: 'Human-readable error message',
    details: optionalDetails
  },
  { status: 400 } // Appropriate HTTP status
);
```

#### Logging Pattern
```typescript
import logger from '@/lib/logger';

// ✅ Structured logging
logger.info({ 
  endpoint: '/api/generate',
  userId: 'user123',
  duration: 1234
}, 'Music generation completed');

logger.error({
  error: error.message,
  stack: error.stack,
  context: { endpoint, userId }
}, 'Music generation failed');

// ❌ Don't use console.log
console.log('something happened'); // NEVER DO THIS
```

#### Environment Variables
```typescript
// ✅ GOOD: With validation
const sunoApiKey = process.env.SUNO_API_KEY;
if (!sunoApiKey) {
  throw new Error('SUNO_API_KEY environment variable is required');
}

// ✅ GOOD: With type safety and default value
const apiTimeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

// ❌ BAD: No validation
const apiKey = process.env.SUNO_API_KEY; // What if undefined?
```

## Important Context About This Project

### Business Logic (v2.0)
- Uses official Suno API from [sunoapi.org](https://sunoapi.org)
- API key authentication (no cookies!)
- Credits-based billing system
- Rate limits exist (daily/monthly based on plan)
- Multiple model versions available (V3_5, V4, V4_5, V4_5PLUS, V5)

### Technical Constraints
- API calls are fast (seconds for generation, not including music creation)
- Credits cost money (check balance with `get_credits()`)
- API availability depends on sunoapi.org uptime
- Model selection affects generation time and quality
- Some features require specific API endpoints (e.g., vocal separation)

### User Expectations
- Fast API responses (HTTP layer is quick)
- Reliable music generation (depends on Suno.ai backend)
- Clear error messages when API fails
- Type-safe TypeScript interfaces
- Good documentation with examples
- Credit usage transparency

## Common Questions You Might Encounter

**Q: How fast is music generation?**
A: HTTP API calls are fast (< 1s), but music creation takes 60-180 seconds depending on model and complexity.

**Q: Do I need a Suno.ai account?**
A: No, you only need a sunoapi.org API key. They handle the Suno.ai integration.

**Q: What's the difference between models (V3_5, V4, V5)?**
A: Newer models (V4, V5) offer better quality and longer tracks (up to 8 min), but may cost more credits. V3_5 is fastest.

**Q: Can we use this in production?**
A: Yes! This is a production-ready API client. Be aware of: API rate limits, credit costs, and API availability.

**Q: How to handle multiple concurrent requests?**
A: The Axios client supports concurrency naturally. Implement rate limiting on your end to avoid hitting API quotas.

**Q: What if I run out of credits?**
A: API calls will fail with appropriate error. Monitor credits with `api.get_credits()` and handle errors gracefully.

## Security Reminders

When working on this project:
- ⚠️ NEVER log API keys or sensitive credentials
- ⚠️ NEVER commit `.env` file to git
- ⚠️ Sanitize all user inputs (prompts, tags, etc.)
- ⚠️ Validate environment variables on startup
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting to prevent abuse
- ⚠️ Monitor API usage and costs
- ⚠️ Rotate API keys periodically

## Testing Guidance

### How to Test Changes

**1. Quick Test**
```bash
# Start dev server
npm run dev

# Test credit check endpoint
curl http://localhost:3000/api/get_credits \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**2. Full Flow Test**
```bash
# Generate music (without waiting)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"prompt": "happy upbeat song", "make_instrumental": false, "wait_audio": false}'

# Check result (use task_id from previous response)
curl http://localhost:3000/api/get?ids=TASK_ID_1,TASK_ID_2 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**3. Credit Monitoring Test**
```bash
# Check credits before
curl http://localhost:3000/api/get_credits

# Generate music
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test song", "wait_audio": true}'

# Check credits after (should be decreased)
curl http://localhost:3000/api/get_credits
```

### What to Test After Changes

After modifying:
- **API routes**: Test all affected endpoints
- **SunoApi class**: Test with different parameters and models
- **Types**: Run `npm run build` to check TypeScript
- **Error handling**: Test with invalid API keys, insufficient credits
- **Environment**: Test with different env var combinations

## Code Style Preferences

### Imports Organization
```typescript
// 1. External libraries
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 2. Internal utilities
import logger from '@/lib/logger';
import { sunoApi } from '@/lib/SunoApi';

// 3. Types
import type { AudioInfo, MusicRequest } from '@/types';
```

### Function Style
```typescript
// ✅ Prefer: Named async functions with proper typing
async function generateMusic(
  request: MusicRequest
): Promise<MusicResponse> {
  // Implementation
}

// ✅ Also good: Arrow functions for simple utilities
const validateRequest = (req: unknown): req is MusicRequest => {
  // Validation logic
};

// ❌ Avoid: Untyped functions
function doSomething(data) { ... }
```

### Error Handling Style
```typescript
// ✅ Create custom error classes
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ✅ Use specific error handling
try {
  const api = await sunoApi();
  const result = await api.generate(prompt);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API-specific error (401, 429, 500, etc.)
    logger.error({ statusCode: error.statusCode }, error.message);
  } else if (error instanceof Error) {
    // Handle generic error
    logger.error({ error: error.message }, 'Unexpected error');
  } else {
    // Handle unknown error
    logger.error({ error }, 'Unknown error occurred');
  }
}
```

## Performance Considerations

### Do's
- ✅ Reuse Axios client instances (single instance per app)
- ✅ Implement request caching for frequently accessed data
- ✅ Use `wait_audio: false` for async music generation
- ✅ Poll task status with reasonable intervals (5-10s)
- ✅ Implement request queueing to avoid rate limits
- ✅ Set appropriate HTTP timeouts (default: 30s)
- ✅ Monitor credit usage to avoid unexpected failures

### Don'ts
- ❌ Create new SunoApi instance for every request
- ❌ Poll task status too frequently (< 3s intervals)
- ❌ Block the event loop with synchronous operations
- ❌ Make concurrent requests beyond your rate limit
- ❌ Store large audio files in memory

## 🔧 CI/CD & Integrations

### Overview

This project is fully integrated with modern development tools:

**✅ Codegen.com**
- AI-powered code reviews on PRs (GitHub Actions + CircleCI)
- Interactive agent via CLI: `codegen claude "your prompt"`
- Python SDK for automation
- See: `.github/workflows/ci.yml`, `.circleci/config.yml`

**✅ Sentry Error Tracking**
- Real-time error monitoring (client + server + edge)
- Performance monitoring and profiling
- Release tracking with source maps
- Configuration: `sentry.*.config.ts`, `instrumentation.ts`

**✅ GitHub Actions**
- Automated linting, type checking, builds
- Security scanning (CodeQL, npm audit, secrets)
- Codegen AI review on PRs
- See: `.github/workflows/`

**✅ CircleCI**
- Parallel job execution with caching
- Sentry release automation
- Quality checks and security scans
- Configuration: `.circleci/config.yml`

**✅ Cursor AI**
- MCP servers for Codegen, GitHub, Tavily
- Context-aware AI assistance
- Configuration: `.cursor/config.json`

**📋 Optional: Linear**
- Issue tracking integration
- Requires `LINEAR_API_KEY` in `.env`

### Quick Setup

```bash
# Run automated setup
./scripts/setup-integrations.sh

# Or manual setup
cp .env.example .env
# Edit .env with your API keys
codegen login
npm install
```

### Environment Variables

See `.env.example` for all required and optional variables:
- `CODEGEN_API_KEY`, `CODEGEN_ORG_ID` - Required for AI features
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` - Required for error tracking
- `CIRCLECI_API_TOKEN` - Optional for CircleCI
- `LINEAR_API_KEY` - Optional for Linear integration

**Full documentation**: [INTEGRATIONS.md](./INTEGRATIONS.md)

---

## R2R Agent Integration

This project includes an **intelligent R2R RAG Agent** with MCP integration for enhanced development assistance.

### What is the R2R Agent?

The R2R Agent is an AI-powered assistant that:
- 🔍 **Knows the entire codebase** through RAG (Retrieval-Augmented Generation)
- 🕸️ **Understands code structure** through GraphRAG knowledge graph
- 🧠 **Accumulates experience** through a memory system
- 🤖 **Integrates directly with Claude** via MCP (Model Context Protocol)

### Available Tools (16 MCP Instruments)

When working on this project, you have access to these specialized tools:

#### Search & Documentation (7 tools)
- `search_documentation` - Semantic search across docs and code
- `search_code_examples` - Find code examples and patterns
- `find_test_examples` - Locate relevant tests
- `ask_documentation` - Ask questions with AI-generated answers
- `get_implementation_help` - Get help implementing features
- `debug_with_rag` - Debug assistance with context
- `explain_architecture` - Explain architectural aspects

#### Experience Memory (4 tools)
- `store_experience` - Save successful solutions and patterns
- `retrieve_similar_experiences` - Find similar past situations
- `reflect_on_patterns` - Analyze accumulated patterns
- `get_memory_stats` - View memory statistics

#### Knowledge Graph (5 tools)
- `query_code_relationships` - Explore code connections
- `find_dependencies` - Find module dependencies
- `find_usages` - Find where code is used
- `find_test_coverage` - Check test coverage
- `explore_architecture_graph` - Explore overall architecture

### When to Use the R2R Agent

**Use these tools when:**
- 🔍 **Searching for examples** → `search_code_examples("error handling pattern")`
- 💡 **Understanding features** → `ask_documentation("How does CAPTCHA solving work?")`
- 🐛 **Debugging issues** → `debug_with_rag("TimeoutError in browser.ts")`
- 🏗️ **Planning refactoring** → `explore_architecture_graph("src/")`
- 📚 **Learning from past** → `retrieve_similar_experiences("rate limit error")`
- ✅ **Saving solutions** → `store_experience({ task: "Fixed timeout", outcome: "success" })`

### R2R Agent Guidelines

**When using the agent:**
1. **Search first** - Use `search_documentation` before asking broad questions
2. **Store successes** - Save successful solutions with `store_experience`
3. **Check graph** - Use graph tools for refactoring and dependency analysis
4. **Retrieve context** - Get similar experiences before solving new problems
5. **Follow patterns** - Use `reflect_on_patterns` to identify best practices

**Example workflow:**
```typescript
// 1. Search for examples
search_code_examples("API endpoint with rate limiting")

// 2. Get implementation help
get_implementation_help({
  feature_description: "Add rate limiting to /api/generate",
  context: { file_path: "src/app/api/generate/route.ts" }
})

// 3. Check dependencies
find_dependencies("src/app/api/generate/route.ts")

// 4. Implement the feature
// ... write code ...

// 5. Store the experience
store_experience({
  context: { task: "Added rate limiting to API" },
  action_taken: "Used upstash/ratelimit with Redis",
  outcome: "success",
  learned_pattern: "Rate limiting prevents abuse and improves stability",
  tags: ["rate-limit", "api", "security"]
})
```

### Agent Setup

The R2R Agent is located in `r2r-mcp-server/`. To use it:

```bash
# Quick setup
cd r2r-mcp-server
./setup.sh

# Index the documentation
npm run ingest

# Test the agent
npm run cli search "CAPTCHA solving"
npm run cli ask "How to add API endpoint?"
```

For full documentation, see:
- `r2r-mcp-server/README.md` - Complete documentation
- `r2r-mcp-server/QUICKSTART.md` - 5-minute quick start
- `R2R-AGENT-SUMMARY.md` - Overview and capabilities

### Agent-Aware Development

The agent is **context-aware** of this project's specifics:
- ✅ Follows all CLAUDE.md guidelines automatically
- ✅ Knows about v2.0 API-based architecture
- ✅ Understands SunoAPI.org integration
- ✅ Aware of Next.js App Router patterns
- ✅ Respects TypeScript strict mode requirements
- ✅ Uses Pino logging patterns
- ✅ Knows about credit-based billing and rate limits

**The agent enhances your capabilities but doesn't replace judgment:**
- Always validate agent suggestions
- Review code patterns from searches
- Understand architectural decisions
- Test implementations thoroughly
- Monitor API usage and costs

## Final Notes for Claude

- **Be thorough**: API integration requires proper error handling for all failure scenarios
- **Be security-conscious**: Protect API keys and monitor credit usage
- **Be pragmatic**: Focus on reliability and user experience
- **Be documentation-friendly**: Explain API integration patterns with clear comments
- **Be TypeScript-strict**: Use proper types, avoid `any`, leverage interfaces
- **Be cost-aware**: Always consider credit consumption and implement monitoring
- **Use the R2R Agent**: Leverage the agent's tools for faster, context-aware development

When in doubt, check the [official API documentation](https://docs.sunoapi.org) or ask for clarification!

**Pro tip**: Start complex tasks by asking the agent: `ask_documentation("How should I approach [task]?")` to get project-specific guidance.

## 🎉 Migration from v1.x to v2.0

If you encounter code or documentation referencing v1.x features:

**Deprecated (v1.x)**:
- ❌ Playwright browser automation
- ❌ CAPTCHA solving with 2Captcha
- ❌ Cookie-based authentication (`SUNO_COOKIE`)
- ❌ `rebrowser-patches` anti-detection

**Current (v2.0)**:
- ✅ Clean HTTP API client
- ✅ No browser automation needed
- ✅ API key authentication (`SUNO_API_KEY`)
- ✅ Official SunoAPI.org integration

**See README.md** for full v2.0 migration guide and new features.
