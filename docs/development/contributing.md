# Contributing to Suno API

Thank you for your interest in contributing to Suno API! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows the standard open-source code of conduct:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 20.11.1 or later
- npm or pnpm
- Git
- Basic understanding of:
  - TypeScript
  - Next.js 14 (App Router)
  - Playwright browser automation
  - React 18

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/suno-api.git
   cd suno-api
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/evgenygurin/suno-api.git
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**Required variables:**
- `SUNO_COOKIE` - Your Suno.ai authentication cookie
- `CAPTCHA_API_KEY` - 2Captcha API key for solving CAPTCHAs

See `.env.example` for all available configuration options.

### 3. Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### 4. Verify Setup

```bash
# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Run tests (if available)
npm test

# Build the project
npm run build
```

## Pull Request Process

### Before Creating a PR

**1. Run Quality Checks** (2-3 minutes):
```bash
npx tsc --noEmit    # TypeScript compilation
npm run lint        # Linting
npm run build       # Build project
npm test            # Run tests
npm audit           # Security check
```

**2. Update Documentation** (2-5 minutes):
- Add entry to `CHANGELOG.md` under `[Unreleased]` section
- Update `README.md` if functionality changed
- Update API documentation if endpoints changed
- Update `.env.example` if new environment variables added

**3. Self-Review Your Changes** (3-5 minutes):
```bash
git diff main...HEAD    # Review all your changes
```

### Creating the PR

**We use PR templates to ensure quality and consistency.**

#### Standard Pull Requests

For most changes (features, bug fixes, refactoring):

```bash
# GitHub CLI (automatically uses default template)
gh pr create

# Or via GitHub UI - template loads automatically
```

The **default template** includes:
- Description (user perspective)
- Changelog entry
- Type of change
- Testing details
- Documentation updates
- Pre-submission checklist

**Time to complete:** 10-15 minutes

For detailed guidance, see [.github/PR_CHECKLIST.md](.github/PR_CHECKLIST.md)

#### Hotfix Pull Requests

For critical production issues requiring immediate deployment:

```bash
# GitHub CLI
gh pr create --template hotfix.md --base main

# Or via GitHub UI
# Add ?template=hotfix.md to the URL
```

The **hotfix template** additionally requires:
- Severity assessment
- Root cause analysis
- Tested rollback plan
- Risk assessment
- Monitoring plan
- Communication plan

**Time to complete:** 20-30 minutes (don't rush!)

For hotfix process details, see [.github/PULL_REQUEST_TEMPLATE/README.md](.github/PULL_REQUEST_TEMPLATE/README.md)

### PR Template Guidelines

**All PRs must:**
- ✅ Fill out all template sections (or mark N/A with reason)
- ✅ Include user-focused changelog entry
- ✅ Document testing performed
- ✅ Update relevant documentation
- ✅ Pass all CI checks
- ✅ Have no secrets committed

**Quick Reference:**
- [PR Quick Checklist](.github/PR_CHECKLIST.md) - 2-minute validation
- [Template Selection Guide](.github/PULL_REQUEST_TEMPLATE/README.md) - Which template to use
- [Detailed PR Guidelines](.github/PR_GUIDELINES.md) - Comprehensive guide (if it exists)

### Review Process

1. **Automated Checks** - CI runs automatically:
   - TypeScript compilation
   - Linting (ESLint)
   - Build verification
   - Security audit
   - Tests (if available)
   - Codegen AI review (on PRs)

2. **Code Review** - Maintainer reviews:
   - Code quality and style
   - Logic correctness
   - Test coverage
   - Documentation completeness
   - Security considerations

3. **Revisions** - If changes requested:
   - Address all feedback
   - Push updates to same branch
   - Re-request review when ready

4. **Merge** - After approval:
   - Maintainer merges PR
   - Auto-deploy to development environment
   - GitHub Actions creates changelog

## Coding Standards

### TypeScript

**Always use TypeScript with strict mode:**

```typescript
// ✅ Good: Proper typing
interface MusicRequest {
  prompt: string;
  make_instrumental: boolean;
  wait_audio: boolean;
}

async function generateMusic(request: MusicRequest): Promise<MusicResponse> {
  // Implementation
}

// ❌ Bad: Using any
function generateMusic(data: any) {
  // Implementation
}
```

**No `any` types** - Use proper interfaces or `unknown` with type guards.

### Next.js 14 App Router

**Use App Router patterns (NOT Pages Router):**

```typescript
// ✅ Good: App Router API route
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle request
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// ❌ Bad: Pages Router pattern
export default function handler(req, res) {
  // Don't use this pattern
}
```

### Logging

**Use Pino logger, NEVER console.log:**

```typescript
import logger from '@/lib/logger';

// ✅ Good: Structured logging
logger.info({ endpoint: '/api/generate', userId: 'user123' }, 'Request started');
logger.error({ error: error.message, stack: error.stack }, 'Request failed');

// ❌ Bad: Console logging
console.log('something happened');
console.error(error);
```

### Error Handling

**Always use try-catch with proper error types:**

```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof CustomError) {
    logger.error({ error: error.message }, 'Custom error occurred');
    throw error;
  } else if (error instanceof Error) {
    logger.error({ error: error.message, stack: error.stack }, 'Unknown error');
    throw new Error('Operation failed', { cause: error });
  } else {
    logger.error({ error }, 'Non-error thrown');
    throw new Error('Unknown error occurred');
  }
}

// ❌ Bad: No error handling
const result = await riskyOperation();
```

### Playwright/Browser Automation

**Follow browser automation best practices:**

```typescript
// ✅ Good: Proper timeouts and error handling
async function solveCaptcha(page: Page) {
  try {
    await page.waitForSelector('iframe[src*="hcaptcha"]', {
      timeout: 10000
    });

    const solution = await solve2Captcha(page);
    await applyCaptchaSolution(page, solution);

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'CAPTCHA solving failed');
    throw new CaptchaError('Failed to solve CAPTCHA', { cause: error });
  }
}

// ❌ Bad: No timeouts or error handling
async function solveCaptcha(page) {
  await page.click('.captcha');
  // What if it times out? What if it fails?
}
```

### Security

**Critical security rules:**

- ⚠️ **NEVER** log cookies or API keys
- ⚠️ **NEVER** commit `.env` file
- ✅ **ALWAYS** use environment variables for secrets
- ✅ **ALWAYS** validate user inputs
- ✅ **ALWAYS** sanitize outputs

```typescript
// ✅ Good: Environment variables with validation
const apiKey = process.env.CAPTCHA_API_KEY;
if (!apiKey) {
  throw new Error('CAPTCHA_API_KEY is required');
}

// ❌ Bad: Hardcoded secrets
const apiKey = "sk-1234567890";  // NEVER DO THIS!
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

**Test structure:**

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should handle error case', async () => {
    const invalidInput = { /* invalid data */ };

    await expect(
      functionUnderTest(invalidInput)
    ).rejects.toThrow('Expected error message');
  });
});
```

**Test coverage requirements:**
- New code should have 80%+ test coverage
- All bug fixes should include regression tests
- Edge cases should be tested
- Error paths should be tested

## Documentation

### Code Comments

**Use JSDoc for complex functions:**

```typescript
/**
 * Generates music using Suno API with automatic CAPTCHA solving
 *
 * @param request - Music generation parameters
 * @returns Generated music tracks with metadata
 * @throws {CaptchaError} If CAPTCHA solving fails after 3 attempts
 * @throws {SunoApiError} If Suno API returns error
 *
 * @example
 * ```typescript
 * const result = await generateMusic({
 *   prompt: "upbeat jazz",
 *   make_instrumental: false,
 *   wait_audio: true
 * });
 * ```
 */
async function generateMusic(request: MusicRequest): Promise<MusicResponse> {
  // Implementation
}
```

### CHANGELOG.md

**Follow Keep a Changelog format:**

```markdown
## [Unreleased]

### Added
- Batch music generation supporting up to 5 tracks per request

### Changed
- CAPTCHA timeout increased from 30s to 60s for better reliability

### Fixed
- Browser crash on macOS when using Firefox browser

### Security
- Updated Playwright to patch detection vulnerability
```

**Write from user perspective:**
- ✅ "API now supports batch music generation"
- ❌ "Implemented BatchMusicGenerator class"

### README.md

Update README.md if:
- New features affect user-facing functionality
- API endpoints change
- Configuration options change
- Installation process changes

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Description** - What happened vs. what you expected
2. **Steps to Reproduce**:
   ```text
   1. Call endpoint...
   2. With parameters...
   3. Observe error...
   ```

3. **Environment**:
   - OS: (e.g., macOS 14.2, Ubuntu 22.04)
   - Node.js version: (e.g., 20.11.1)
   - Browser: (e.g., Chromium 120)
4. **Logs** - Relevant error messages (sanitize secrets!)
5. **Screenshots** - If UI-related

### Feature Requests

When requesting features:

1. **Use Case** - What problem does this solve?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - What alternatives did you consider?
4. **Additional Context** - Any other relevant info

## Project-Specific Guidance

### Browser Automation

This project uses Playwright for browser automation. Key considerations:

- Use `rebrowser-patches` for anti-detection
- Always configure timeouts explicitly
- Clean up browser contexts after use
- Test on multiple browsers (Chromium preferred)
- macOS gets fewer CAPTCHAs than Linux/Windows

### CAPTCHA Solving

Using 2Captcha service:

- Cost: ~$2.99 per 1000 solves
- Average solve time: 10-30 seconds
- Handle failures gracefully (retry up to 3 times)
- Monitor balance to avoid service interruptions

### Rate Limiting

Be aware of Suno.ai rate limits:

- Respect rate limits in your changes
- Add delays between operations if needed
- Consider queueing for concurrent requests
- Document any rate limiting changes

## Getting Help

**Questions?**
- Check existing issues
- Read [CLAUDE.md](./CLAUDE.md) for development patterns
- Check [MCP-QUICKSTART.md](./MCP-QUICKSTART.md) for MCP integration
- Open GitHub Discussion
- Ask in pull request

**Found a bug?**
- Search existing issues first
- Create new issue with bug report template
- Include reproduction steps

**Want to contribute?**
- Check issues labeled `good-first-issue`
- Comment on issue before starting work
- Follow PR process above
- Ask questions early

## Additional Resources

- **Development Guide:** [CLAUDE.md](./CLAUDE.md)
- **CI/CD Documentation:** [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
- **MCP Setup:** [MCP-SETUP.md](./MCP-SETUP.md)
- **PR Templates:** [.github/PULL_REQUEST_TEMPLATE/](. /github/PULL_REQUEST_TEMPLATE/)
- **Quick Checklist:** [.github/PR_CHECKLIST.md](.github/PR_CHECKLIST.md)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Suno API!** 🎵

Your contributions help make this project better for everyone.
