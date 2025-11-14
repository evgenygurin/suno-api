# Claude-Specific Instructions for Suno API

This file contains specific instructions and context for Claude AI assistant when working with the Suno API project.

## 🎯 Quick Start for Claude

**This project has full MCP (Model Context Protocol) integration!**

You have access to these powerful tools:
- 📚 **Context7**: `use context7 to find [library] documentation`
- 🐙 **GitHub MCP**: Manage repos, PRs, issues, CI/CD workflows
- 🤖 **Codegen.com**: AI-powered code generation and review
- 🧠 **R2R Agent**: 16 specialized tools for codebase intelligence (see below)
- 🔍 **Tavily**: Web search and content extraction

**📖 MCP Guides:**
- **Quick Start (5 min)**: [MCP-QUICKSTART.md](./MCP-QUICKSTART.md)
- **Complete Guide**: [MCP-SETUP.md](./MCP-SETUP.md)
- **R2R Agent Tools**: [r2r-mcp-server/README.md](./r2r-mcp-server/README.md)

---

## Project Context for Claude

You are working on **Suno API**, an unofficial TypeScript/Next.js wrapper for Suno.ai's music generation service. This project uses browser automation (Playwright) to interact with Suno.ai and automatically solves CAPTCHAs using 2Captcha service.

### Key Technologies You Should Know
- **Next.js 14** with App Router (NOT Pages Router)
- **TypeScript** with strict mode
- **Playwright** with rebrowser-patches for anti-detection
- **React 18** with functional components and hooks
- **Pino** for structured logging
- **2Captcha** for CAPTCHA solving
- **MCP Integrations**: Context7, GitHub MCP, Codegen.com, R2R Agent, Tavily

## Your Role as Claude

### When Helping with Code
1. **Always consider browser automation context**: Remember that Playwright is dealing with a real browser and CAPTCHAs
2. **Respect async operations**: Browser automation is heavily async - use proper await/Promise handling
3. **Think about timing**: Browser actions need proper waits and timeouts
4. **Consider anti-detection**: Use rebrowser-patches features to avoid detection
5. **Handle errors gracefully**: Network issues, CAPTCHAs, and rate limits are common

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

#### Playwright Automation
```typescript
// ✅ GOOD: Proper browser automation with error handling
async function solveCaptcha(page: Page) {
  try {
    // Wait for captcha iframe
    await page.waitForSelector('iframe[src*="hcaptcha"]', { 
      timeout: 10000 
    });
    
    // Solve using 2Captcha
    const solution = await solve2Captcha(page);
    
    // Apply solution with retry
    await applyCaptchaSolution(page, solution);
    
    return { success: true };
  } catch (error) {
    logger.error({ error }, 'CAPTCHA solving failed');
    throw new CaptchaError('Failed to solve CAPTCHA', { cause: error });
  }
}

// ❌ BAD: No error handling or timeouts
async function solveCaptcha(page) {
  await page.click('.captcha');
  // Missing error handling!
}
```

### When Reviewing Code

Check for these common issues:
- [ ] Proper TypeScript types (no `any`)
- [ ] Error handling with try-catch
- [ ] Logging with Pino logger
- [ ] Async/await used correctly
- [ ] Environment variables accessed properly
- [ ] Secrets not hardcoded
- [ ] CAPTCHA solving integrated correctly
- [ ] API responses follow consistent format
- [ ] HTTP status codes are appropriate

### When Debugging

#### Common Issues to Check

**1. CAPTCHA Problems**
- Is 2Captcha API key valid and has balance?
- Is the browser locale set correctly?
- Are we using the right browser (Chromium/Firefox)?
- Are rebrowser-patches working?

**2. Cookie Issues**
- Is SUNO_COOKIE environment variable set?
- Has the cookie expired?
- Is cookie format correct?
- Are we passing cookie correctly in headers?

**3. API Errors**
- Check logs with Pino
- Verify API endpoint exists
- Check request body format
- Verify response handling
- Look for rate limiting

**4. Browser Automation**
- Check if page is loaded completely
- Verify selectors are correct
- Ensure proper waits/timeouts
- Check for detection issues

### When Adding New Features

Follow this checklist:
1. **Understand the Suno.ai flow**: What browser actions are needed?
2. **Design API endpoint**: What parameters? What response?
3. **Implement with TypeScript**: Proper types and interfaces
4. **Add error handling**: Handle all failure cases
5. **Implement logging**: Log important events and errors
6. **Test manually**: Use curl or Postman
7. **Update Swagger docs**: Document new endpoint
8. **Update README**: Add examples and documentation

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
const sunoCookie = process.env.SUNO_COOKIE;
if (!sunoCookie) {
  throw new Error('SUNO_COOKIE environment variable is required');
}

// ✅ GOOD: With type safety
const browserHeadless = process.env.BROWSER_HEADLESS === 'true';

// ❌ BAD: No validation
const cookie = process.env.SUNO_COOKIE; // What if undefined?
```

## Important Context About This Project

### Business Logic
- Suno.ai doesn't have an official API yet
- We reverse-engineer their web interface
- Cookie authentication is required
- hCaptcha challenges appear frequently
- 2Captcha service costs money per solve
- Rate limits exist (daily/monthly)

### Technical Constraints
- Browser automation is slow (seconds, not milliseconds)
- CAPTCHAs are unpredictable (can't avoid them)
- Cookies expire and need refresh
- Suno.ai can change their UI anytime (breaking changes)
- GPU acceleration doesn't work in Docker
- macOS gets fewer CAPTCHAs than Linux/Windows

### User Expectations
- Fast API responses (minimize CAPTCHA triggers)
- Reliable music generation
- Multiple account support (via cookie override)
- OpenAI-compatible API format option
- Good error messages when things fail

## Common Questions You Might Encounter

**Q: Why is the API so slow?**
A: Browser automation + CAPTCHA solving takes time (5-30 seconds typically)

**Q: Can we avoid CAPTCHAs?**
A: Not entirely. Using macOS and rebrowser-patches helps minimize them.

**Q: Why use Playwright instead of direct API calls?**
A: Suno.ai doesn't have a public API. We must use their web interface.

**Q: Can we use this in production?**
A: Yes, but be aware of limitations: rate limits, CAPTCHA costs, potential breaking changes.

**Q: How to handle multiple concurrent requests?**
A: Each request needs its own browser context. Implement proper queueing and concurrency limits.

## Security Reminders

When working on this project:
- ⚠️ NEVER log cookies or API keys
- ⚠️ NEVER commit `.env` file
- ⚠️ Sanitize all user inputs
- ⚠️ Validate environment variables on startup
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting
- ⚠️ Monitor for abuse

## Testing Guidance

### How to Test Changes

**1. Quick Test**
```bash
# Start dev server
npm run dev

# Test endpoint
curl http://localhost:3000/api/get_limit
```

**2. Full Flow Test**
```bash
# Generate music
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "happy song", "make_instrumental": false, "wait_audio": false}'

# Check result (use IDs from previous response)
curl http://localhost:3000/api/get?ids=SONG_ID_1,SONG_ID_2
```

**3. CAPTCHA Test**
- Trigger action that requires new browser session
- Check logs for CAPTCHA solving attempts
- Verify 2Captcha balance decreases
- Confirm operation completes successfully

### What to Test After Changes

After modifying:
- **API routes**: Test all affected endpoints
- **Browser automation**: Test CAPTCHA solving
- **Types**: Run `npm run build` to check TypeScript
- **Environment**: Test with different env var combinations

## Code Style Preferences

### Imports Organization
```typescript
// 1. External libraries
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'rebrowser-playwright-core';

// 2. Internal utilities
import logger from '@/lib/logger';
import { solveCaptcha } from '@/lib/captcha';

// 3. Types
import type { MusicRequest } from '@/types';
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
class CaptchaError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'CaptchaError';
  }
}

// ✅ Use specific error handling
try {
  await solveCaptcha(page);
} catch (error) {
  if (error instanceof CaptchaError) {
    // Handle CAPTCHA-specific error
  } else if (error instanceof Error) {
    // Handle generic error
  } else {
    // Handle unknown error
  }
}
```

## Performance Considerations

### Do's
- ✅ Reuse browser contexts when possible
- ✅ Implement connection pooling
- ✅ Cache successful CAPTCHA sessions
- ✅ Use streaming for large responses
- ✅ Implement request queueing
- ✅ Set appropriate timeouts

### Don'ts
- ❌ Create new browser for every request
- ❌ Wait unnecessarily long
- ❌ Block the event loop
- ❌ Make synchronous file I/O
- ❌ Leave browser contexts open

## R2R Agent Integration

This project now includes an **intelligent R2R RAG Agent** with MCP integration for enhanced development assistance.

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
- ✅ Knows about Playwright browser automation
- ✅ Understands CAPTCHA solving with 2Captcha
- ✅ Aware of Next.js App Router patterns
- ✅ Respects TypeScript strict mode requirements
- ✅ Uses Pino logging patterns

**The agent enhances your capabilities but doesn't replace judgment:**
- Always validate agent suggestions
- Review code patterns from searches
- Understand architectural decisions
- Test implementations thoroughly

## Final Notes for Claude

- **Be thorough**: Browser automation is finicky, double-check timing and error handling
- **Be security-conscious**: This handles cookies and API keys
- **Be pragmatic**: Perfect detection avoidance isn't possible, focus on reliability
- **Be documentation-friendly**: Explain complex automation logic with comments
- **Be TypeScript-strict**: Use proper types, avoid `any`
- **Use the R2R Agent**: Leverage the agent's tools for faster, context-aware development

When in doubt, ask for clarification rather than making assumptions about browser behavior or Suno.ai's interface!

**Pro tip**: Start complex tasks by asking the agent: `ask_documentation("How should I approach [task]?")` to get project-specific guidance.
