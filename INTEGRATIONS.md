# Integration Guide - Suno API

This document provides a comprehensive guide for all integrations configured in the Suno API project.

## 📑 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Integrations](#integrations)
  - [Codegen.com](#codegencom)
  - [GitHub Actions](#github-actions)
  - [CircleCI](#circleci)
  - [GitGuardian](#gitguardian)
  - [Sentry](#sentry)
  - [Linear](#linear)
  - [Cursor AI](#cursor-ai)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project is integrated with multiple services to provide:
- ✅ **AI-powered code reviews** (Codegen.com)
- ✅ **Automated CI/CD** (GitHub Actions, CircleCI)
- ✅ **Secret scanning** (GitGuardian)
- ✅ **Error tracking & monitoring** (Sentry)
- ✅ **Project management** (Linear)
- ✅ **Enhanced development** (Cursor AI with MCP)

---

## Quick Start

### Automated Setup

Run the setup script to configure all integrations:

```bash
./scripts/setup-integrations.sh
```

### Manual Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API keys

3. Install dependencies:
```bash
npm install
```

4. Authenticate with Codegen:
```bash
codegen login
```

---

## Integrations

### Codegen.com

**AI-powered code agent for automated development tasks.**

#### Features
- 🤖 Automated code reviews on pull requests
- 📝 Code generation and refactoring
- 🔍 Codebase analysis and documentation
- 🛠️ Integration with GitHub Actions and CircleCI

#### Setup

**1. Install CLI**
```bash
uv tool install codegen
# or
pip install codegen
```

**2. Authenticate**
```bash
codegen login
```

**3. Get API Credentials**
- Visit: https://codegen.com/settings/api-keys
- Create new API key
- Note your Organization ID

**4. Configure Environment**
```bash
CODEGEN_API_KEY=your_api_key_here
CODEGEN_ORG_ID=your_org_id
CODEGEN_REPO_ID=your_repo_id  # Optional
```

**5. GitHub Secrets** (for CI/CD)
Add these secrets to your repository:
- `CODEGEN_ORG_ID`
- `CODEGEN_API_TOKEN`

#### Usage

**Via CLI:**
```bash
# Run agent with prompt
codegen claude "Review this PR for security issues"

# Use MCP server in Cursor/Claude Code
codegen mcp
```

**Via Python SDK:**
```python
from codegen import Agent

agent = Agent(org_id="123", token="your_token")
task = agent.run(prompt="Add error handling to API routes")

# Wait for completion
task.refresh()
print(task.result)
```

**Via GitHub Actions:**
- Automatically runs on pull requests
- Provides AI-powered code review
- Comments on PRs with suggestions
- See: `.github/workflows/ci.yml`

#### Documentation
- Official docs: https://docs.codegen.com
- SDK Reference: https://docs.codegen.com/api-reference
- MCP Integration: https://docs.codegen.com/integrations/mcp

---

### GitHub Actions

**Automated CI/CD workflows on GitHub.**

#### Workflows

**1. CI/CD Pipeline** (`.github/workflows/ci.yml`)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Security audit (npm audit)
- ✅ Build (Next.js)
- ✅ Codegen AI review (on PRs)

**2. Security Scanning** (`.github/workflows/security.yml`)
- 🔒 Dependency review
- 🔒 NPM security audit
- 🔒 CodeQL analysis
- 🔒 Secret scanning (TruffleHog)

#### Setup

**1. Required Secrets**
Add in GitHub: `Settings → Secrets and variables → Actions`

```text
CODEGEN_ORG_ID         # From codegen.com
CODEGEN_API_TOKEN      # From codegen.com
SENTRY_AUTH_TOKEN      # From sentry.io (optional)
```

**2. Enable Workflows**
- Workflows are enabled by default
- Trigger manually: `Actions → Select workflow → Run workflow`

#### Customization

Edit workflow files in `.github/workflows/`:
- Adjust trigger conditions
- Add/remove jobs
- Modify build steps
- Configure matrix builds

---

### CircleCI

**Alternative CI/CD platform with advanced features.**

#### Features
- 🔄 Parallel job execution
- 📦 Dependency caching
- 🚀 Faster builds than GitHub Actions
- 🔧 Advanced workflows with orbs

#### Setup

**1. Connect Repository**
- Go to: https://app.circleci.com
- Click "Set Up Project"
- Select your repository

**2. Environment Variables**
Add in CircleCI: `Project Settings → Environment Variables`

```text
CODEGEN_ORG_ID
CODEGEN_API_TOKEN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

**3. Or Use CircleCI Contexts**
Better for shared secrets across projects:
- Go to: `Organization Settings → Contexts`
- Create contexts: `codegen`, `sentry`
- Add environment variables
- Reference in workflows: `context: codegen`

#### Configuration

Configuration file: `.circleci/config.yml`

**Jobs:**
- `quality-checks` - Linting and type checking
- `security-scan` - Vulnerability scanning
- `build` - Next.js build
- `sentry-release` - Create Sentry release
- `codegen-review` - AI code review (PRs only)

**Workflows:**
- `build-and-test` - Runs on all branches
- `weekly-security-scan` - Scheduled security checks

#### Usage

**Trigger build:**
- Automatic on push/PR
- Manual via CircleCI dashboard
- Via API:
```bash
curl -X POST \
  https://circleci.com/api/v2/project/github/YOUR_ORG/suno-api/pipeline \
  -H "Circle-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GitGuardian

**Automated secret scanning to prevent credential leaks.**

#### Features
- 🔐 Scans commits for secrets and API keys
- 🚨 Prevents credential exposure in git history
- 🔍 Detects 350+ types of secrets
- 🛡️ Protects against security breaches
- 🔄 Integrates with CircleCI pipelines

#### Setup

**1. Create GitGuardian Account**
- Visit: https://dashboard.gitguardian.com
- Sign up (free for public repos)
- Navigate to API section

**2. Generate API Key**
```bash
# Go to: https://dashboard.gitguardian.com/api/personal-access-tokens
# Create new Personal Access Token
# Copy the token (starts with "gg_")
```

**3. Configure CircleCI**
```bash
# Add to CircleCI project environment variables:
# Project Settings → Environment Variables
GITGUARDIAN_API_KEY=gg_your_api_key_here
```

**4. Verify Configuration**
```yaml
# Already configured in .circleci/config.yml:
orbs:
  ggshield: gitguardian/ggshield@1.1.4

workflows:
  build-and-test:
    jobs:
      - ggshield/scan:
          name: ggshield-scan
          base_revision: << pipeline.git.base_revision >>
          revision: << pipeline.git.revision >>
```

#### Usage

**Automatic scanning:**
- ✅ Every push triggers secret scan
- ✅ Pull requests are automatically checked
- ✅ Build fails if secrets detected

**Manual local scanning:**
```bash
# Install ggshield CLI
pip install ggshield

# Scan current directory
ggshield secret scan path .

# Scan specific commit
ggshield secret scan commit-range HEAD~1..HEAD

# Scan before committing
ggshield secret scan pre-commit
```

#### Common Detections

GitGuardian detects these secret types:
- 🔑 **API Keys**: AWS, GCP, Azure, etc.
- 🔐 **Credentials**: Passwords, tokens, certificates
- 💳 **Payment**: Stripe, PayPal keys
- 🗄️ **Databases**: Connection strings, passwords
- 🐙 **Git**: GitHub tokens, SSH keys

#### Troubleshooting

**False Positives:**
```bash
# Add to .gitguardian.yaml to ignore:
exclude:
  - "**/*.test.ts"
  - "**/mocks/**"

matches-ignore:
  - name: "Test API Key"
    match: "sk_test_"
```

**Incident Response:**
If a secret is detected:
1. **Rotate the compromised secret immediately**
2. Review commit history for exposure duration
3. Check logs for unauthorized access
4. Update secret in all environments
5. Consider git history rewrite if needed

#### Documentation
- Official Docs: https://docs.gitguardian.com/
- CircleCI Orb: https://circleci.com/developer/orbs/orb/gitguardian/ggshield
- CLI Reference: https://docs.gitguardian.com/ggshield-docs/reference/ggshield

---

### Sentry

**Real-time error tracking and performance monitoring.**

#### Features
- 🐛 Error tracking (client & server)
- 📊 Performance monitoring
- 🔍 Session replay (optional)
- 📈 Release tracking
- 🚨 Alert notifications

#### Setup

**1. Create Sentry Project**
- Sign up: https://sentry.io
- Create new project or use existing
- Select platform: **Next.js**

**2. Get Credentials**

**DSN (Data Source Name):**
- Go to: `Project Settings → Client Keys (DSN)`
- Copy your DSN

**Auth Token:**
- Go to: https://sentry.io/settings/account/api/auth-tokens/
- Create token with scopes: `project:releases`, `project:write`, `org:read`

**3. Configure Environment**

```bash
# Required
SENTRY_DSN=https://public_key@o123456.ingest.us.sentry.io/123456789
NEXT_PUBLIC_SENTRY_DSN=https://public_key@o123456.ingest.us.sentry.io/123456789

# For CI/CD (required for source maps)
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=suno-api
SENTRY_AUTH_TOKEN=sntryu_your_token_here

# Optional
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**4. Configuration Files**
- ✅ `sentry.client.config.ts` - Browser-side
- ✅ `sentry.server.config.ts` - Server-side
- ✅ `sentry.edge.config.ts` - Edge runtime
- ✅ `instrumentation.ts` - Next.js hook
- ✅ `next.config.mjs` - Webpack plugin
- ✅ `.sentryrc` - CLI config (add to `.gitignore`!)

#### Usage

**Automatic error tracking:**
```typescript
// Errors are automatically captured
throw new Error('Something went wrong');
```

**Manual capture:**
```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Capture message
Sentry.captureMessage('User clicked button', 'info');

// Set user context
Sentry.setUser({ id: '123', email: 'user@example.com' });

// Add breadcrumb
Sentry.addBreadcrumb({
  message: 'CAPTCHA solve attempted',
  level: 'info',
  data: { captchaType: 'hcaptcha' }
});
```

**Performance monitoring:**
```typescript
import * as Sentry from '@sentry/nextjs';

// Start transaction
const transaction = Sentry.startTransaction({
  name: 'Music Generation',
  op: 'task'
});

// Add spans
const span = transaction.startChild({
  op: 'browser.automation',
  description: 'Solve CAPTCHA'
});

// ... do work ...

span.finish();
transaction.finish();
```

#### CI/CD Integration

**GitHub Actions:**
- Source maps uploaded automatically during build
- Releases created with git SHA

**CircleCI:**
- `sentry-release` job creates releases
- Associates commits with deployments

#### Troubleshooting

**Issue: Source maps not uploading**
```bash
# Check auth token
sentry-cli --version

# Test manually
sentry-cli releases new suno-api@test
sentry-cli releases files suno-api@test upload-sourcemaps .next
```

**Issue: Events not appearing**
- Check DSN is correct
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set
- Check browser console for Sentry errors
- Ensure not in development mode (unless `SENTRY_SEND_IN_DEV=true`)

---

### Linear

**Modern issue tracking and project management.**

#### Features
- 📋 Issue tracking
- 🎯 Sprint planning
- 🤝 GitHub integration
- 🤖 API for automation

#### Setup

**1. Get API Key**
- Go to: https://linear.app/settings/api
- Create new API key
- Copy key

**2. Configure Environment**
```bash
LINEAR_API_KEY=lin_api_your_key_here
```

**3. Usage Examples**

**Via API:**
```bash
# Create issue
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: Bearer $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { issueCreate(input: { title: \"Bug fix\", teamId: \"TEAM_ID\" }) { success issue { id } } }"
  }'
```

**Via Codegen integration:**
Linear can be integrated with Codegen for automatic issue creation from code reviews.

#### GitHub Integration
- Connect at: https://linear.app/settings/integrations/github
- Enables automatic PR/issue linking
- Shows PR status in Linear

---

### Cursor AI

**AI-powered code editor with MCP support.**

#### Features
- 🤖 Claude AI integration
- 🔌 MCP (Model Context Protocol) servers
- 💡 Context-aware code suggestions
- 🔍 Intelligent code search

#### Setup

**1. Install Cursor**
- Download: https://cursor.com
- Install and open

**2. Configure MCP Servers**
Configuration file: `.cursor/config.json`

```json
{
  "mcpServers": {
    "codegen": {
      "command": "codegen",
      "args": ["mcp"],
      "cwd": "/path/to/suno-api"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_MCP_PAT}"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-tavily"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

**3. Environment Variables**
Cursor will load variables from `.env`:
```bash
GITHUB_MCP_PAT=ghp_your_github_token
TAVILY_API_KEY=tvly-your_key_here
```

**4. Restart Cursor**
- Close and reopen Cursor
- MCP servers will connect automatically

#### Usage

**In Cursor chat:**
```bash
# Ask Codegen to review code
@codegen Review this function for security issues

# Search GitHub
@github Find similar error handling patterns

# Web search
@tavily Latest Next.js 14 best practices
```

#### Troubleshooting

**MCP servers not connecting:**
1. Check `.cursor/config.json` syntax
2. Verify `codegen` CLI is installed: `which codegen`
3. Check environment variables are set
4. View logs: `Cursor → Settings → MCP → View Logs`

---

## Environment Variables

### Complete Reference

```bash
# ============================================================================
# Core API
# ============================================================================
SUNO_API_KEY=your_suno_api_key

# ============================================================================
# Codegen.com
# ============================================================================
CODEGEN_API_KEY=your_api_key
CODEGEN_ORG_ID=123
CODEGEN_REPO_ID=456  # Optional

# ============================================================================
# GitHub MCP
# ============================================================================
GITHUB_MCP_PAT=ghp_your_token
# Required scopes: repo, workflow, read:org, read:user

# ============================================================================
# Sentry Error Tracking
# ============================================================================
SENTRY_DSN=https://key@o123.ingest.us.sentry.io/456
NEXT_PUBLIC_SENTRY_DSN=https://key@o123.ingest.us.sentry.io/456
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=suno-api
SENTRY_AUTH_TOKEN=sntryu_token
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# ============================================================================
# CI/CD
# ============================================================================
CIRCLECI_API_TOKEN=your_circleci_token
LINEAR_API_KEY=lin_api_your_key

# ============================================================================
# Optional MCP Servers
# ============================================================================
CONTEXT7_API_KEY=your_context7_key  # Optional
TAVILY_API_KEY=tvly_your_key
GEMINI_API_KEY=your_gemini_key  # For R2R agent
R2R_API_URL=http://localhost:7272
R2R_API_KEY=your_r2r_key
```

---

## Troubleshooting

### Common Issues

**1. Codegen authentication fails**
```bash
# Re-authenticate
codegen login

# Verify
codegen whoami
```

**2. GitHub Actions failing**
- Check secrets are set correctly
- Verify workflow syntax: `yamllint .github/workflows/*.yml`
- Check logs in Actions tab

**3. Sentry not capturing errors**
- Verify DSN is correct
- Check `NEXT_PUBLIC_SENTRY_DSN` for client-side
- Ensure not in dev mode without `SENTRY_SEND_IN_DEV=true`

**4. CircleCI not triggering**
- Verify repository is connected
- Check `.circleci/config.yml` syntax
- Ensure environment variables are set

**5. Cursor MCP not working**
- Restart Cursor
- Check `.cursor/config.json` path is correct
- Verify CLI tools are in PATH: `which codegen`
- Check environment variables

### Getting Help

- **Codegen**: https://docs.codegen.com
- **Sentry**: https://docs.sentry.io
- **CircleCI**: https://circleci.com/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Linear**: https://linear.app/docs
- **Cursor**: https://docs.cursor.com

---

## Contributing

When adding new integrations:

1. Update this document
2. Add environment variables to `.env.example`
3. Update setup script: `scripts/setup-integrations.sh`
4. Test the integration end-to-end
5. Document any gotchas or troubleshooting tips

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
**Maintained By**: Suno API Team
