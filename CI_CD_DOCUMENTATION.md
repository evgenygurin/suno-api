# CI/CD Infrastructure Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [CircleCI Configuration](#circleci-configuration)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Integration Setup](#integration-setup)
- [Security & Best Practices](#security--best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses a comprehensive CI/CD infrastructure combining **CircleCI** for primary build/test/deploy pipelines and **GitHub Actions** for PR reviews, security scanning, and dependency management.

### Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Pull Request│  │ Push to main │  │ Scheduled Jobs   │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
    ┌─────▼─────┐     ┌────▼────┐        ┌─────▼──────┐
    │  GitHub   │     │CircleCI │        │  GitHub    │
    │  Actions  │     │Pipeline │        │  Actions   │
    │           │     │         │        │(Scheduled) │
    │ • Code    │     │• Build  │        │            │
    │   Review  │     │• Test   │        │• Security  │
    │ • Codegen │     │• Deploy │        │• Deps      │
    └───────────┘     │• Sentry │        │  Updates   │
                      └────┬────┘        └────────────┘
                           │
                    ┌──────▼──────┐
                    │Integrations │
                    │             │
                    │• Sentry     │
                    │• Slack      │
                    │• Linear     │
                    └─────────────┘
```

---

## CircleCI Configuration

### Location
`.circleci/config.yml`

### Features

#### 1. Executors
- **node-executor**: Standard Node.js 20.11.1 environment (Medium resource class)
- **node-browsers-executor**: Browser-enabled environment for Playwright tests (Large resource class)

#### 2. Orbs
- `circleci/node@6.1.0` - Node.js tools and caching
- `circleci/slack@4.13.3` - Slack notifications
- `circleci/browser-tools@1.4.8` - Browser testing support

#### 3. Pipeline Parameters
```yaml
parameters:
  run-integration-tests:
    type: boolean
    default: false
  deploy-environment:
    type: string
    default: "staging"
```

#### 4. Jobs

| Job | Description | Executor | Dependencies |
|-----|-------------|----------|--------------|
| `install-and-cache` | Install npm packages with caching | node-executor | None |
| `type-check` | TypeScript type checking | node-executor | install-and-cache |
| `lint` | ESLint code quality checks | node-executor | install-and-cache |
| `security-audit` | npm security vulnerabilities | node-executor | install-and-cache |
| `build` | Build Next.js application | node-executor | type-check, lint, security-audit |
| `integration-tests` | Playwright browser tests (conditional) | node-browsers-executor | build |
| `performance-audit` | Bundle size analysis | node-executor | build |
| `sentry-release` | Create Sentry release + source maps | node-executor | build |
| `codegen-review` | AI code review (optional) | node-executor | build |

#### 5. Workflows

**build-test-deploy** (Main Workflow)
- Triggers on: `main`, `develop`, `feature/*` branches
- Runs parallel quality checks (type-check, lint, security-audit)
- Builds after all checks pass
- Conditionally runs performance audit, integration tests, and codegen review
- Creates Sentry release only on `main` branch

**nightly** (Scheduled Workflow)
- Triggers: Daily at 2 AM UTC (only on `main`)
- Runs comprehensive testing including integration tests
- Purpose: Catch issues that might not appear in PR workflows

### Setup Instructions

#### Required CircleCI Contexts

1. **sentry** context:
   ```bash
   SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
   SENTRY_ORG=<your-sentry-org-slug>
   SENTRY_PROJECT=suno-api
   ```

2. **codegen** context (optional):
   ```bash
   CODEGEN_ORG_ID=<your-codegen-org-id>
   CODEGEN_API_TOKEN=<your-codegen-api-token>
   ```

3. **slack** context (optional):
   ```bash
   SLACK_ACCESS_TOKEN=<your-slack-bot-token>
   SLACK_DEFAULT_CHANNEL=<your-channel-id>
   ```

#### Enabling CircleCI

1. Go to [CircleCI](https://app.circleci.com/)
2. Connect your GitHub repository
3. Set up project
4. Configure contexts (Settings → Organization Settings → Contexts)
5. Add environment variables to respective contexts

---

## GitHub Actions Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

**Jobs:**

#### test
- Checkout code with full history
- Install dependencies
- Run linter
- Type check with TypeScript
- Security audit
- Build application
- Upload build artifacts (retained for 7 days)

#### codegen-review
- **Conditional**: Only runs on PRs, skipped for dependabot and when `skip-review` label is present
- AI-powered code review using Codegen.com
- Reviews focus on:
  - TypeScript/Next.js best practices
  - Browser automation security
  - CAPTCHA integration
  - Performance & security
  - Documentation

**Setup:**
1. Add GitHub secrets:
   ```text
   CODEGEN_ORG_ID=<your-org-id>
   CODEGEN_API_TOKEN=<your-api-token>
   ```

2. Codegen will automatically review PRs
3. To skip review, add `skip-review` label to PR

### 2. Security Scanning (`.github/workflows/security.yml`)

**Triggers:**
- Pushes to `main` or `develop`
- Pull requests
- Weekly schedule (Mondays at 9 AM UTC)
- Manual dispatch

**Jobs:**

#### dependency-review
- Reviews dependency changes in PRs
- Blocks PRs with risky dependencies
- Checks for forbidden licenses (GPL-2.0, AGPL-3.0)

#### npm-audit
- Runs `npm audit` with security focus
- Generates detailed vulnerability report
- Fails on critical/high severity issues
- Creates summary in GitHub Actions

#### codeql-analysis
- Static code analysis by GitHub
- Scans for security vulnerabilities
- Checks JavaScript/TypeScript code quality

#### secret-scanning
- Scans for leaked secrets in commits
- Uses TruffleHog for detection
- Only reports verified secrets

**Setup:**
```bash
# No additional setup required
# GitHub Advanced Security features are enabled automatically for public repos
# For private repos, enable GitHub Advanced Security in repository settings
```

### 3. Dependency Updates (`.github/workflows/dependency-updates.yml`)

**Triggers:**
- Weekly schedule (Mondays at 10 AM UTC)
- Manual dispatch

**Jobs:**

#### update-dependencies
- Checks for outdated npm packages
- Creates comprehensive dependency report
- Opens GitHub issue with update recommendations
- Updates existing issue if one already exists

#### dependabot-auto-merge
- Automatically merges Dependabot PRs
- Only for patch and minor version updates
- Requires passing CI checks

**Setup:**

1. Enable Dependabot in `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

2. Configure auto-merge permissions (Settings → Actions → General)

---

## Integration Setup

### Sentry

**Purpose:** Error tracking and monitoring

**Files:**
- `.sentryrc` - Sentry CLI configuration

**Setup:**

1. Create Sentry project at [sentry.io](https://sentry.io)

2. Get your Sentry DSN and add to `.env`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=suno-api
   ```

3. Configure `.sentryrc`:
   ```ini
   [auth]
   token=YOUR_AUTH_TOKEN

   [defaults]
   org=YOUR_ORG_SLUG
   project=suno-api
   ```

4. Add to CircleCI context `sentry`:
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`

**Features:**
- Automatic release creation on deploys
- Source map upload for better stack traces
- Deployment markers
- Error tracking with context

### Codegen.com

**Purpose:** AI-powered code reviews

**Setup:**

1. Sign up at [codegen.com](https://codegen.com)

2. Get API credentials from Codegen dashboard

3. Add to GitHub secrets:
   ```text
   CODEGEN_ORG_ID=your-org-id
   CODEGEN_API_TOKEN=your-api-token
   ```

4. (Optional) Add to CircleCI context `codegen`

**Usage:**
- Automatically reviews all PRs
- Provides detailed code quality feedback
- Suggests improvements with examples
- Can be skipped with `skip-review` label

**Review Focus:**
- TypeScript best practices
- Next.js App Router patterns
- Browser automation security
- CAPTCHA integration
- Performance issues
- Security vulnerabilities

### Slack

**Purpose:** Build notifications

**Setup:**

1. Create Slack app and get bot token

2. Add to CircleCI context `slack`:
   ```text
   SLACK_ACCESS_TOKEN=xoxb-...
   SLACK_DEFAULT_CHANNEL=C01234567
   ```

3. Notifications sent on:
   - Build failures
   - Successful production deployments

### Linear

**Purpose:** Task management integration

**Setup:**

1. Install Codegen Linear integration

2. Reference Linear issues in commits:
   ```text
   git commit -m "fix: resolve CAPTCHA timeout [LIN-123]"
   ```

3. Codegen will automatically link PRs to Linear issues

---

## Security & Best Practices

### Secrets Management

**Never commit:**
- API keys
- Auth tokens
- Environment variables with sensitive data
- `.env` files

**Use:**
- GitHub Secrets for GitHub Actions
- CircleCI Contexts for CircleCI
- Environment variables for local development

### Branch Protection Rules

Recommended settings for `main` branch:

```text
✅ Require pull request before merging
  ✅ Require approvals (1+)
  ✅ Dismiss stale reviews
  ✅ Require review from code owners

✅ Require status checks to pass
  ✅ test (GitHub Actions)
  ✅ build (CircleCI)
  ✅ type-check (CircleCI)
  ✅ lint (CircleCI)

✅ Require conversation resolution

✅ Require signed commits

✅ Include administrators

✅ Restrict pushes (optional)
```

### Dependency Security

1. **Dependabot**:
   - Automatically opens PRs for security updates
   - Auto-merges patch/minor updates after CI passes

2. **npm audit**:
   - Runs on every PR and push
   - Fails builds on critical/high vulnerabilities

3. **Dependency Review**:
   - Reviews PRs for risky dependency changes
   - Blocks dangerous licenses

### Code Quality Gates

All PRs must pass:
- ✅ TypeScript type checking
- ✅ ESLint code quality
- ✅ Security audit (no critical/high issues)
- ✅ Successful build
- ✅ CodeQL security analysis (async)

---

## Troubleshooting

### CircleCI

**Problem:** Build fails with "context not found"

**Solution:**
1. Go to Organization Settings → Contexts
2. Create required context (`sentry`, `codegen`, `slack`)
3. Add environment variables to context
4. Add context to workflow job

---

**Problem:** Sentry release creation fails

**Solution:**
1. Verify `SENTRY_AUTH_TOKEN` is valid
2. Check `.sentryrc` configuration
3. Ensure Sentry project exists
4. Verify source maps are being generated (`.next/static`)

---

**Problem:** Integration tests timeout

**Solution:**
1. Check `npx playwright install chromium` runs successfully
2. Increase `no_output_timeout` in job config
3. Verify `SUNO_COOKIE` and `CAPTCHA_API_KEY` are set for tests

---

### GitHub Actions

**Problem:** Codegen review doesn't run

**Solution:**
1. Check if PR has `skip-review` label
2. Verify `CODEGEN_ORG_ID` and `CODEGEN_API_TOKEN` secrets exist
3. Check if PR is from dependabot (automatically skipped)
4. Review workflow logs for errors

---

**Problem:** Security scanning fails

**Solution:**
1. For npm audit failures:
   - Run `npm audit` locally
   - Fix vulnerabilities with `npm audit fix`
   - Or update specific packages manually

2. For CodeQL analysis failures:
   - Review CodeQL logs in Security tab
   - Fix flagged code issues
   - Re-run analysis

---

**Problem:** Dependency update workflow not creating issues

**Solution:**
1. Verify workflow has `issues: write` permission
2. Check if dependencies are actually outdated
3. Review workflow run logs
4. Ensure GitHub token has correct scopes

---

### General

**Problem:** Builds are slow

**Solutions:**
1. CircleCI:
   - Increase resource class (medium → large)
   - Optimize caching strategy
   - Reduce workspace persistence size

2. GitHub Actions:
   - Use `cache: 'npm'` in setup-node
   - Minimize artifact uploads
   - Run jobs in parallel where possible

---

**Problem:** Too many concurrent builds

**Solution:**
1. Configure branch filters more strictly
2. Use conditional job execution
3. Limit Dependabot PR frequency
4. Use `workflow_dispatch` for manual triggers only

---

## Performance Tips

### Optimize Build Times

1. **Caching:**
   - npm dependencies cached automatically
   - Playwright browsers cached in integration tests
   - Next.js build cache preserved between runs

2. **Parallelization:**
   - Type checking, linting, and security audit run in parallel
   - Multiple GitHub Actions jobs run concurrently

3. **Conditional Execution:**
   - Integration tests only on main/develop
   - Performance audit only on main/develop
   - Codegen review only on PRs

### Cost Optimization

1. **CircleCI:**
   - Use smaller resource classes where possible
   - Skip unnecessary jobs on feature branches
   - Use scheduled workflows sparingly

2. **GitHub Actions:**
   - Limit retention days for artifacts (currently 7 days)
   - Use `continue-on-error` for non-critical jobs
   - Skip Codegen on dependabot PRs

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Build Success Rate:**
   - Target: >95%
   - Monitor in CircleCI/GitHub Actions dashboards

2. **Build Duration:**
   - Target: <5 minutes for typical PRs
   - Target: <10 minutes for main branch builds

3. **Security Vulnerabilities:**
   - Target: 0 critical/high severity issues
   - Review weekly dependency reports

4. **Code Review Quality:**
   - Monitor Codegen review feedback
   - Track issue resolution time

### Dashboards

- **CircleCI**: https://app.circleci.com/pipelines/github/YOUR_ORG/suno-api
- **GitHub Actions**: Repository → Actions tab
- **Sentry**: https://sentry.io/organizations/YOUR_ORG/projects/suno-api
- **Security**: Repository → Security tab

---

## Maintenance

### Weekly Tasks

- [ ] Review dependency update reports
- [ ] Check security scanning results
- [ ] Monitor Sentry error rates
- [ ] Review Codegen feedback patterns

### Monthly Tasks

- [ ] Update orb versions in CircleCI
- [ ] Update GitHub Actions versions
- [ ] Review and optimize resource usage
- [ ] Audit and rotate secrets/tokens

### Quarterly Tasks

- [ ] Review and update branch protection rules
- [ ] Audit CI/CD costs and optimization opportunities
- [ ] Update documentation
- [ ] Review integration configurations

---

## Support & Resources

### Documentation
- [CircleCI Documentation](https://circleci.com/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codegen Documentation](https://codegen.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)

### Project-Specific
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
- [MCP-SETUP.md](./MCP-SETUP.md) - MCP integration guide
- [README.md](./README.md) - Project overview

### Getting Help

1. Check this documentation first
2. Review CircleCI/GitHub Actions logs
3. Check integration status pages
4. Open GitHub issue with `ci/cd` label
5. Contact team lead for context access issues

---

**Last Updated:** 2025-01-14
**Maintainer:** DevOps Team
**Status:** ✅ Production Ready
