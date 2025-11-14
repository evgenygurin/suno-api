# Integrations Overview

This document provides a high-level overview of all third-party integrations in the suno-api project and how they work together.

## 🎯 Integration Ecosystem

```text
┌─────────────────────────────────────────────────────────────────┐
│                          Development Workflow                    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                  ┌─────▼──────┐      ┌──────▼──────┐
                  │   GitHub   │      │   Linear    │
                  │            │      │             │
                  │ • Code     │◄────►│ • Issues    │
                  │ • PRs      │      │ • Cycles    │
                  │ • Reviews  │      │ • Roadmap   │
                  └─────┬──────┘      └──────┬──────┘
                        │                    │
          ┌─────────────┼────────────────────┼─────────────┐
          │             │                    │             │
    ┌─────▼──────┐ ┌────▼────┐        ┌────▼─────┐ ┌────▼────┐
    │ CircleCI   │ │Codegen  │        │ Claude   │ │  Slack  │
    │            │ │         │        │   Code   │ │         │
    │ • Build    │ │• AI     │        │          │ │• Notify │
    │ • Test     │ │  Review │        │• IDE     │ │• Collab │
    │ • Deploy   │ │• Issues │        │  Agent   │ │• Updates│
    └─────┬──────┘ └─────────┘        └──────────┘ └────┬────┘
          │                                               │
          └───────────────┬──────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
          ┌─────▼──────┐      ┌────▼────────┐
          │   Sentry   │      │ Trigger.dev │
          │            │      │             │
          │ • Errors   │      │ • Tasks     │
          │ • Releases │      │ • Queue     │
          │ • Perf     │      │ • Schedule  │
          └────────────┘      └─────────────┘
```

## 📊 Integration Matrix

| Integration | Purpose | Triggers | Notifications | Status |
| ----------- | ------- | -------- | ------------- | ------ |
| **GitHub** | Version control, Code review | Push, PR, Merge | Slack | ✅ Active |
| **CircleCI** | CI/CD Pipeline | Push to main/develop | Slack, Sentry | ✅ Active |
| **Codegen** | AI Code Review | PR created/updated | GitHub, Slack, Linear | ✅ Active |
| **Linear** | Issue Tracking | Issues, PRs | Slack | ✅ Active |
| **Slack** | Team Communication | All events | - | ✅ Active |
| **Sentry** | Error Monitoring | Releases, Errors | Slack | ✅ Active |
| **Trigger.dev** | Background Tasks & Queue | API calls, Scheduled | Slack, Sentry | ✅ Active |
| **Vercel AI SDK** | AI-Powered Features | API calls, Tasks | - | ✅ Active |
| **Claude Code** | AI Development | On-demand | - | ✅ Active |
| **Cursor** | IDE Integration | On-demand | - | ✅ Active |

## 🔗 Integration Workflows

### Workflow 1: Feature Development

```text
1. Developer creates Linear issue
   └─► Issue synced to GitHub

2. Developer creates branch from Linear
   └─► Branch auto-linked to issue

3. Developer writes code with Claude Code/Cursor
   └─► AI-assisted development

4. Developer commits code
   └─► Commit message references Linear issue

5. Developer creates GitHub PR
   ├─► Codegen AI review triggered
   ├─► CircleCI build/test triggered
   ├─► Linear issue status → "In Review"
   └─► Slack notification sent

6. Codegen completes review
   ├─► Results posted to PR
   ├─► Critical findings → Linear issue created
   └─► Slack notification sent

7. CircleCI passes tests
   └─► Slack success notification

8. PR merged to main
   ├─► Linear issue → "Done"
   ├─► CircleCI deploys
   ├─► Sentry release created
   └─► Slack deployment notification

9. Sentry monitors production
   └─► Errors alert to Slack
```

### Workflow 2: Bug Fix from Production

```text
1. Sentry detects production error
   ├─► Alert sent to Slack #incidents
   └─► Team notified

2. Team creates Linear issue from Sentry
   ├─► Issue auto-assigned based on component
   └─► Severity set automatically

3. Developer creates hotfix branch
   └─► Branch linked to Linear issue

4. Fix developed with AI assistance
   ├─► Claude Code for code generation
   └─► Cursor for inline assistance

5. PR created with [HOTFIX] prefix
   ├─► Expedited review process
   ├─► Codegen AI review
   └─► CircleCI fast-track build

6. PR auto-merged after passing checks
   └─► CircleCI deploys immediately

7. Sentry release tracks fix
   ├─► Error marked as resolved
   └─► Slack confirmation sent

8. Linear issue auto-closed
   └─► Sprint metrics updated
```

### Workflow 3: Code Review with AI

```text
1. PR created/updated on GitHub
   └─► GitHub Actions workflow triggered

2. Codegen AI Review starts
   ├─► Analyzes all changed files
   ├─► Checks against project patterns
   └─► Evaluates security/performance

3. Review completed
   ├─► Results posted as PR comment
   ├─► Severity markers added
   ├─► File-specific feedback provided
   └─► Suggestions with code examples

4. Critical findings detected
   ├─► Linear issue auto-created
   ├─► Issue assigned to team
   ├─► Slack notification sent
   └─► PR review status updated

5. Developer addresses feedback
   ├─► Updates code based on AI suggestions
   └─► Pushes changes

6. Re-review triggered automatically
   └─► Confirms fixes applied

7. Final approval
   ├─► PR ready to merge
   └─► Linear issue linked to PR
```

### Workflow 4: Background Task Processing with Trigger.dev

```text
1. API receives long-running request
   ├─► Music generation requested
   ├─► Batch processing needed
   └─► Scheduled maintenance task

2. API triggers background task
   ├─► Task queued in Trigger.dev
   ├─► Task ID returned to client (202 Accepted)
   └─► Client can poll for status

3. Trigger.dev executes task
   ├─► Task runs in isolated environment
   ├─► Automatic retry on transient failures
   ├─► CAPTCHA solving with smart backoff
   └─► Progress tracked in dashboard

4. Task completes successfully
   ├─► Result stored in database
   ├─► Webhook notification sent
   ├─► Sentry tracks execution time
   └─► Slack notification (if configured)

5. Task fails after retries
   ├─► Error logged to Sentry
   ├─► Alert sent to Slack #incidents
   ├─► Task marked as failed in dashboard
   └─► Manual intervention may be required

6. Scheduled tasks (e.g., cookie refresh)
   ├─► Cron triggers at configured interval
   ├─► Trigger.dev runs maintenance task
   ├─► Refreshes authentication cookies
   ├─► Logs success/failure to Sentry
   └─► Updates task history
```

### Workflow 5: AI-Enhanced Music Generation with Vercel AI SDK

```text
1. User submits music generation request
   ├─► Prompt: "A dreamy electronic track with synths"
   ├─► Preferences: genre, mood, instrumental
   └─► Triggers AI-enhanced generation task

2. AI analyzes and enhances prompt (OpenAI GPT-4o)
   ├─► Adds specific genre details
   ├─► Includes mood descriptors
   ├─► Suggests instruments and tempo
   ├─► Enhanced: "Ambient electronic with ethereal pads, soft synths..."
   └─► Progress update: 30% (Prompt enhanced)

3. AI extracts musical style metadata
   ├─► Tool calling with structured output
   ├─► Genre: "electronic", Mood: "dreamy"
   ├─► Tempo: "medium", Instruments: ["synth", "pads", "drums"]
   ├─► Tags: ["electronic", "dreamy", "medium", "synth", "ambient"]
   └─► Progress update: 70% (Style analyzed)

4. Trigger music generation with enhanced prompt
   ├─► Calls Suno API with optimized prompt
   ├─► Automatic CAPTCHA solving if needed
   ├─► Real-time progress tracking
   └─► Progress update: 90% (Generating music)

5. Return enhanced results to user
   ├─► Original prompt vs AI-enhanced prompt comparison
   ├─► Musical style metadata and tags
   ├─► Generated music files
   ├─► Processing time and statistics
   └─► Progress update: 100% (Complete)

6. Frontend displays real-time progress
   ├─► useRealtimeTaskTrigger React hook
   ├─► Progress bar with stage updates
   ├─► Enhanced prompt preview
   ├─► Style analysis display
   └─► Final results with playback
```

## 📚 Integration Documentation

### Core Integrations

- **[Codegen Setup](./CODEGEN_SETUP.md)** - AI code review configuration
- **[Linear Integration](./LINEAR_INTEGRATION.md)** - Issue tracking and project management
- **[Slack Integration](./SLACK_INTEGRATION.md)** - Team notifications and collaboration
- **[Trigger.dev Integration](./TRIGGER_DEV_INTEGRATION.md)** - Background tasks and queue management

### Supporting Documentation

- **[CI/CD Documentation](../CI_CD_DOCUMENTATION.md)** - CircleCI and GitHub Actions
- **[Contributing Guide](../CONTRIBUTING.md)** - Development workflow
- **[Claude Code Guide](../CLAUDE.md)** - AI assistance patterns

## 🛠️ Setup Checklist

### Initial Setup (One-time)

- [ ] **GitHub Repository**
  - [ ] Enable GitHub Actions
  - [ ] Configure branch protection
  - [ ] Set up environments (staging, production)

- [ ] **CircleCI**
  - [ ] Link GitHub repository
  - [ ] Create contexts (sentry, codegen)
  - [ ] Add environment variables

- [ ] **Codegen**
  - [ ] Install GitHub App
  - [ ] Get Organization ID and API Token
  - [ ] Configure GitHub secrets

- [ ] **Linear**
  - [ ] Create workspace
  - [ ] Set up teams and projects
  - [ ] Install GitHub integration

- [ ] **Slack**
  - [ ] Create channels (#dev, #builds, #incidents, #releases)
  - [ ] Install GitHub Slack App
  - [ ] Configure CircleCI webhooks
  - [ ] Set up Linear notifications

- [ ] **Sentry**
  - [ ] Create project
  - [ ] Get DSN and Auth Token
  - [ ] Configure `.sentryrc`
  - [ ] Set up error alerts

- [ ] **Claude Code / Cursor**
  - [ ] Install MCP servers
  - [ ] Configure Context7
  - [ ] Set up R2R Agent

- [ ] **Trigger.dev**
  - [ ] Create account at <https://trigger.dev>
  - [ ] Create new project
  - [ ] Get API Key and Project Ref
  - [ ] Install MCP server with `npx trigger.dev@latest install-mcp`
  - [ ] Configure task directories

### Per-Developer Setup

- [ ] Clone repository
- [ ] Install dependencies: `npm ci`
- [ ] Copy `.env.example` to `.env`
- [ ] Install Claude Code CLI
- [ ] Configure Cursor with project settings
- [ ] Join Slack channels
- [ ] Access Linear workspace

## 🎛️ Configuration Files

| File | Purpose | Contains |
| ---- | ------- | -------- |
| `.circleci/config.yml` | CircleCI pipeline | Build, test, deploy jobs |
| `.github/workflows/*.yml` | GitHub Actions | Security, dependencies, Codegen |
| `.github/scripts/codegen_review.py` | Codegen integration | PR review logic |
| `.sentryrc` | Sentry CLI config | Auth token, org, project |
| `.sentryrc.example` | Sentry template | Setup instructions |
| `.env.example` | Environment template | Required variables |
| `trigger.config.ts` | Trigger.dev config | Task settings, retry logic, directories |
| `CLAUDE.md` | Claude Code config | Project context |
| `MCP-SETUP.md` | MCP server setup | Tool integrations |

## 🔐 Secrets Management

### GitHub Secrets (Actions)

```text
CODEGEN_ORG_ID        - Codegen organization ID
CODEGEN_API_TOKEN     - Codegen API token
```

### CircleCI Contexts

**Context: sentry**

```text
SENTRY_AUTH_TOKEN     - Sentry authentication token
SENTRY_ORG            - Sentry organization slug
SENTRY_PROJECT        - Sentry project slug
```

**Context: codegen**

```text
CODEGEN_ORG_ID        - Codegen organization ID
CODEGEN_API_TOKEN     - Codegen API token
```

**Context: slack**

```text
SLACK_WEBHOOK_URL     - Slack incoming webhook URL
```

### Environment Variables (.env)

```bash
# Suno API
SUNO_API_KEY=xxx
SUNO_COOKIE=xxx

# CAPTCHA Solving
TWOCAPTCHA_API_KEY=xxx

# Browser Configuration
BROWSER_HEADLESS=true

# Trigger.dev
TRIGGER_API_KEY=tr_dev_xxx
TRIGGER_PROJECT_REF=proj_xxx
```

## 🔍 Monitoring & Health

### Integration Health Dashboard

**Daily Checks:**

- [ ] GitHub Actions running successfully
- [ ] CircleCI builds passing
- [ ] Codegen reviews completing
- [ ] Linear sync working
- [ ] Slack notifications arriving
- [ ] Sentry tracking errors
- [ ] Trigger.dev tasks executing
- [ ] Background job queue healthy

**Weekly Reviews:**

- [ ] Review Codegen findings
- [ ] Check Sentry error trends
- [ ] Analyze Linear velocity
- [ ] Review CircleCI performance
- [ ] Optimize Slack notifications

**Monthly Audits:**

- [ ] Review API usage and costs
- [ ] Update integration configs
- [ ] Rotate API tokens
- [ ] Archive old data
- [ ] Update documentation

## 🐛 Troubleshooting

### Common Issues

**1. GitHub Actions not triggering**

- Check workflow file syntax
- Verify repository permissions
- Check branch protection rules

**2. CircleCI build failures**

- Review environment variables
- Check context configuration
- Verify Sentry auth token

**3. Codegen review not appearing**

- Verify GitHub secrets set
- Check PR isn't draft or dependabot
- Review workflow logs

**4. Linear sync issues**

- Verify GitHub integration active
- Check branch naming convention
- Review Linear integration logs

**5. Slack notifications missing**

- Verify webhook URLs current
- Check channel permissions
- Test webhook endpoints

**6. Sentry errors not tracked**

- Verify DSN configured
- Check Sentry SDK initialized
- Review error sampling rate

**7. Trigger.dev tasks failing**

- Check API key is valid and not expired
- Verify project reference is correct
- Review task timeout settings
- Check retry configuration
- Inspect task logs in Trigger.dev dashboard
- Ensure task directories are properly configured

## 📊 Metrics & Analytics

### Key Performance Indicators

**Development Velocity:**

- Issues completed per week
- PR merge time
- Time in review

**Code Quality:**

- Codegen findings per PR
- Test coverage percentage
- Build success rate

**Production Health:**

- Error rate (Sentry)
- Response time
- Uptime percentage

**Team Collaboration:**

- Slack engagement
- PR review turnaround
- Issue resolution time

## 🚀 Future Enhancements

### Planned Integrations

- **Jira** - Enterprise issue tracking
- **Notion** - Documentation and wikis
- **PagerDuty** - Incident management
- **Datadog** - Advanced monitoring
- **AWS CloudWatch** - Infrastructure monitoring

### Automation Opportunities

- Auto-assignment of issues based on code ownership
- Predictive analysis for code review times
- Automated performance regression detection
- Smart alert routing based on on-call schedule

## 🎓 Best Practices

### Integration Guidelines

1. **Keep configurations in version control**
   - Except secrets (.env, .sentryrc)
   - Use examples/templates

2. **Document all integrations**
   - Setup instructions
   - Troubleshooting guides
   - Usage examples

3. **Test integration changes**
   - Use staging environment
   - Verify notifications
   - Check logs

4. **Monitor integration health**
   - Set up alerts for failures
   - Regular health checks
   - Performance monitoring

5. **Maintain security**
   - Rotate tokens regularly
   - Use least privilege access
   - Audit permissions quarterly

## 📞 Support Contacts

| Integration | Documentation | Support |
| ----------- | ------------- | ------- |
| **Codegen** | <https://docs.codegen.com> | <support@codegen.com> |
| **Linear** | <https://linear.app/docs> | <support@linear.app> |
| **CircleCI** | <https://circleci.com/docs> | <support@circleci.com> |
| **Sentry** | <https://docs.sentry.io> | <support@sentry.io> |
| **GitHub** | <https://docs.github.com> | <support@github.com> |
| **Slack** | <https://api.slack.com/docs> | <developers@slack.com> |
| **Trigger.dev** | <https://trigger.dev/docs> | <help@trigger.dev> |

---

**Last Updated:** 2025-01-15
**Maintainer:** DevOps Team
**Questions?** Open an issue or ask in #suno-api-dev
