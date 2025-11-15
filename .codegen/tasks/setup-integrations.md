# Comprehensive Integration Setup Task for Suno API

## 🎯 Objective

Configure complete end-to-end integration ecosystem for the Suno API project, connecting all development tools and establishing automated workflows between Claude Code, Codegen.com, Cursor IDE, Linear, CircleCI, GitHub, and Sentry.

## 📋 Context

**Project:** Suno API v2.0 - TypeScript/Next.js music generation API
**Repository:** evgenygurin/suno-api
**Tech Stack:** Next.js 14, TypeScript, Sentry, Trigger.dev, FastAPI patterns

**Current Integration Status:**
- ✅ Codegen.com: Configured (Org ID: 4138, Repo ID: 9)
- ✅ GitHub: Connected (evgenygurin/suno-api)
- ✅ Sentry: Active monitoring (org: evgeny-pl, project: suno-api)
- ✅ Linear: Partial setup (Team ID: 9b57e540-4b72-46d5-a12f-b22198635ded)
- ⚠️ CircleCI: API token available, integration incomplete
- ⚠️ Cursor: MCP server not configured
- ⚠️ Claude Code: Limited integration

## 🔧 Detailed Integration Tasks

### 1. Codegen.com Platform Integration

#### 1.1 GitHub App Installation & Permissions
**Reference:** [Codegen GitHub Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/integrations/github.mdx)

**Actions Required:**
1. Install Codegen GitHub App: https://github.com/apps/codegen-sh
2. Grant required permissions:
   - ✓ Read and write repository contents
   - ✓ Create and manage pull requests
   - ✓ Write status checks and CI/CD results
   - ✓ Read and write issues and comments
   - ✓ Read repository metadata and settings
   - ✓ Read and write GitHub Actions workflows
   - ✓ Read organization projects and members
   - ✓ Manage webhooks for real-time updates

3. Verify installation:
```bash
gh api /repos/evgenygurin/suno-api/installation
```

#### 1.2 GitHub Actions Workflow for PR Reviews
**Reference:** [GitHub Actions Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/api-reference/github-actions.mdx)

**Create:** `.github/workflows/codegen-review.yml`

```yaml
name: Codegen AI Code Review

on:
  pull_request:
    types: [opened, synchronize]
    branches: [main, develop]

jobs:
  codegen-review:
    runs-on: ubuntu-latest
    # Skip for dependabot and draft PRs
    if: |
      github.actor != 'dependabot[bot]' &&
      github.event.pull_request.draft == false &&
      !contains(github.event.pull_request.labels.*.name, 'skip-review')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Codegen SDK
        run: |
          pip install codegen

      - name: Run Codegen Review
        env:
          CODEGEN_ORG_ID: ${{ secrets.CODEGEN_ORG_ID }}
          CODEGEN_API_TOKEN: ${{ secrets.CODEGEN_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CODEGEN_DEBUG: ${{ vars.CODEGEN_DEBUG || 'false' }}
        run: |
          python -c "
          import os
          import sys
          from codegen import Agent

          # Initialize agent
          agent = Agent(
              org_id=os.environ['CODEGEN_ORG_ID'],
              token=os.environ['CODEGEN_API_TOKEN']
          )

          # Get PR number
          pr_number = os.environ.get('GITHUB_REF', '').split('/')[-2]

          # Run review
          task = agent.run(
              prompt=f'Review PR #{pr_number} for code quality, security, and best practices',
              repo_id=${{ secrets.CODEGEN_REPO_ID }}
          )

          print(f'Review task started: {task.status}')
          print(f'View details: {task.web_url if hasattr(task, \"web_url\") else \"N/A\"}')
          "

      - name: Comment PR with Review Link
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🤖 **Codegen AI Review** has been triggered. Check the workflow run for details.'
            })
```

**GitHub Secrets to Configure:**
- `CODEGEN_ORG_ID`: `4138`
- `CODEGEN_API_KEY`: `sk-20183fe5-c7d7-42d6-ba99-896e70f175f5`
- `CODEGEN_REPO_ID`: `9`

#### 1.3 Webhook Configuration
**Objective:** Enable real-time updates from GitHub to Codegen

**Setup via Codegen Dashboard:**
1. Navigate to: https://app.codegen.com/integrations/github
2. Configure webhook for repository: `evgenygurin/suno-api`
3. Enable events:
   - Pull requests (opened, synchronize, closed)
   - Issues (opened, edited, closed)
   - Push events
   - Check suites (completed)

### 2. CircleCI Integration

#### 2.1 CircleCI Connection
**Reference:** [CircleCI Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/integrations/circleci.mdx)

**Required Permissions (Read-only):**
- ✓ Read project information and settings
- ✓ View build history and logs
- ✓ Read test results and artifacts
- ✓ Access check status and details

**Actions:**
1. Connect CircleCI to Codegen:
   - URL: https://app.codegen.com/integrations/circleci
   - Use token from environment variable: `$CircleCI` (configured in .env)

2. Enable automatic wake-up for failed checks:
   - When Codegen creates PR and CircleCI fails
   - Agent automatically:
     1. Detects failure
     2. Analyzes logs
     3. Generates fixes
     4. Pushes updates to same PR branch

#### 2.2 CircleCI Configuration File
**Verify:** `.circleci/config.yml` exists and includes Codegen integration

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  test:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run Tests
          command: npm test
      - run:
          name: Build
          command: npm run build
      - store_test_results:
          path: ./test-results
      - store_artifacts:
          path: ./coverage

workflows:
  main:
    jobs:
      - test
```

### 3. Linear Integration

#### 3.1 Linear Workspace Connection
**Reference:** [Linear Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/integrations/linear.mdx)

**Actions:**
1. Authorize Codegen:
   - URL: https://linear.app/integrations/codegen
   - Grant read/write access to:
     - Issues and projects
     - Comments
     - Team members
     - Status updates

2. Configure Linear API in `.env`:
```bash
LINEAR_API_KEY=<obtain from Linear API settings>
LINEAR_TEAM_ID=9b57e540-4b72-46d5-a12f-b22198635ded
LINEAR_PROJECT_ID=25c92941-1410-4158-b1f8-7532f67f9107
```

#### 3.2 Linear Multi-Agent Workflow
**Pattern:** Break large issues into sub-issues with child agents

**Example Issue Template:**
```markdown
# [PARENT ISSUE] Implement Music Generation API v3

## Context
Upgrade music generation system to support advanced features

## Instructions for Codegen
Please break this issue into smaller sub-issues and assign child agents:

1. API endpoint design
2. Authentication & rate limiting
3. Model integration (V4, V5)
4. Error handling & retry logic
5. Unit & integration tests
6. Documentation updates

## Scaffolding Requirements
- Base branch: `feature/music-gen-v3`
- Shared context: API design patterns from CLAUDE.md
- Testing framework: Jest + Supertest
```

#### 3.3 Linear Tools Available to Agents
**Capabilities:**
- `LinearGetIssueTool`: Retrieve issue details
- `LinearGetIssueCommentsTool`: Fetch comments
- `LinearCommentOnIssueTool`: Add comments
- `LinearSearchIssuesTool`: Search issues
- `LinearCreateIssueTool`: Create new issues
- `LinearGetTeamsTool`: Get team info

### 4. Sentry Integration

#### 4.1 Codegen + Sentry Connection
**Objective:** Enable agents to access error logs and traces

**Current Sentry Setup:**
```env
SENTRY_DSN=https://3d4fd8111cf37bd00a0d69b24475db51@o490495.ingest.us.sentry.io/4510362980253696
SENTRY_ORG=evgeny-pl
SENTRY_PROJECT=suno-api
SENTRY_AUTH_TOKEN=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
```

**Integration Steps:**
1. Connect Sentry to Codegen: https://app.codegen.com/integrations/sentry
2. Grant permissions:
   - Read issues and events
   - Read releases
   - Read projects
   - Optional: Write comments on issues

3. Enable agent capabilities:
   - Analyze error traces
   - Suggest fixes based on stack traces
   - Link PRs to Sentry issues
   - Update issue status when fixed

#### 4.2 Sentry Error Analysis Workflow
**Pattern:** Automatic error investigation

```python
# Example agent prompt
"""
Analyze the following Sentry error and provide a fix:

Error ID: ABC123
Issue: TypeError in music generation endpoint
Stack trace: [from Sentry]
Frequency: 150 occurrences in last 24h
Affected users: 45

Please:
1. Identify root cause
2. Implement fix in src/app/api/generate/route.ts
3. Add error handling
4. Create test case
5. Link PR to Sentry issue
"""
```

### 5. Cursor IDE Integration

#### 5.1 MCP Server Configuration
**Reference:** [MCP Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/integrations/mcp.mdx)

**Create:** `.cursor/config.json` or add to `~/.cursor/config.json`

```json
{
  "mcp.servers": {
    "codegen": {
      "command": "codegen",
      "args": ["mcp"],
      "cwd": "/Users/laptop/dev/suno-api"
    }
  }
}
```

**Alternative for advanced setup:**
```json
{
  "mcp.servers": {
    "codegen-remote": {
      "transport": "http",
      "url": "https://mcp.codegen.com/mcp/",
      "headers": {
        "Authorization": "Bearer sk-20183fe5-c7d7-42d6-ba99-896e70f175f5",
        "x-organization-id": "4138",
        "x-repo-id": "9"
      }
    }
  }
}
```

#### 5.2 Cursor Documentation Indexing
**Add to Cursor settings:**

```json
{
  "cursor.docs": [
    "https://docs.codegen.com/api-reference/index",
    "https://docs.sentry.io",
    "https://nextjs.org/docs",
    "https://docs.trigger.dev"
  ]
}
```

#### 5.3 Cursor Rules for Codegen Context
**Create:** `.cursorrules`

```bash
# Codegen Integration Rules

## Code Quality Standards
- Use TypeScript strict mode for all new code
- Follow Next.js App Router patterns (not Pages Router)
- Implement proper error handling with Sentry integration
- Add comprehensive logging with Pino
- Type all API responses and requests

## Integration Patterns
- Reference .codegen/prompts/system-prompt.md for project context
- Check .codegen/codemods/ for existing code transformations
- Use Codegen agents for complex refactoring tasks
- Link all PRs to Linear issues when available

## Testing Requirements
- 80% test coverage minimum for new features
- Unit tests with Jest for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## Security Guidelines
- Never commit secrets or API keys
- Use environment variables for all credentials
- Implement rate limiting on public endpoints
- Validate all user inputs
- Use HTTPS in production

## Documentation
- Update CLAUDE.md when architecture changes
- Add JSDoc comments for public functions
- Include examples in API documentation
- Update README.md for new features
```

### 6. Claude Code Integration

#### 6.1 Claude Code MCP Server
**Reference:** [Claude Code MCP](https://docs.codegen.com/integrations/mcp)

**Setup Command:**
```bash
claude mcp add --transport http codegen-tools https://mcp.codegen.com/mcp/ \
  --header "Authorization: Bearer sk-20183fe5-c7d7-42d6-ba99-896e70f175f5" \
  --header "x-organization-id: 4138" \
  --header "x-repo-id: 9"
```

**Verify Configuration:**
```bash
claude mcp list
```

#### 6.2 Enhanced Claude Code Usage
**Install Codegen CLI for Claude:**
```bash
uv tool install codegen
codegen login
```

**Run Claude with full Codegen integration:**
```bash
codegen claude "Refactor the music generation API to support batch requests"
```

**Benefits:**
- ✓ Cloud logging of all sessions
- ✓ Access to Linear, GitHub, CircleCI integrations
- ✓ Automatic PR creation and linking
- ✓ Sentry error context
- ✓ Team collaboration features

### 7. Additional Integrations

#### 7.1 Slack Integration (Optional)
**Reference:** [Slack Integration](https://github.com/codegen-sh/codegen/blob/develop/docs/integrations/slack.mdx)

**Actions:**
1. Add Codegen to Slack: https://app.codegen.com/integrations/slack
2. Configure notifications:
   - PR reviews completed
   - Build failures (from CircleCI)
   - Sentry critical errors
   - Linear issue updates

**Tools Available:**
- `SlackSendMessageTool`: Send messages to channels/threads

#### 7.2 Notion Integration (Optional)
**Reference:** Notion workspace documentation sync

**Actions:**
1. Connect Notion: https://codegen.sh/integrations/notion
2. Sync documentation:
   - API specifications
   - Architecture decisions
   - Development workflows
   - Team onboarding guides

#### 7.3 PostgreSQL Integration (Optional)
**For future database queries and schema analysis**

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=suno_api
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure_password>
```

## 🔄 Integration Workflow Examples

### Example 1: PR Review Workflow
```text
1. Developer creates PR → GitHub webhook → Codegen
2. Codegen agent reviews code → Runs tests
3. CircleCI runs CI pipeline
4. If CircleCI fails → Codegen analyzes logs → Auto-fixes
5. Codegen posts review comments on PR
6. Developer addresses feedback
7. PR approved and merged
8. Linear issue status updated to "Done"
9. Sentry release tracking initiated
```

### Example 2: Error Investigation Workflow
```bash
1. Sentry error triggered → Webhook to Codegen
2. Codegen agent analyzes error trace
3. Agent searches codebase for root cause
4. Creates Linear issue with findings
5. Proposes fix via PR
6. Links PR to Sentry issue and Linear ticket
7. CI tests pass → PR merged
8. Sentry issue marked as resolved
```

### Example 3: Feature Development Workflow
```bash
1. Create Linear issue: "Add music style presets"
2. Mention @Codegen in Linear issue
3. Agent breaks down into sub-tasks
4. Creates feature branch
5. Implements each sub-task
6. Runs tests via CircleCI
7. Creates PR with full description
8. PR reviewed by team + Codegen
9. Merged to main
10. Linear issue auto-closed
```

## 📊 Monitoring & Verification

### Integration Health Checks

**1. Verify All Integrations:**
```bash
curl -H "Authorization: Bearer sk-20183fe5-c7d7-42d6-ba99-896e70f175f5" \
  "https://api.codegen.com/v1/organizations/4138/integrations"
```

**Expected Response:**
```json
{
  "integrations": [
    {"type": "github", "status": "active"},
    {"type": "circleci", "status": "active"},
    {"type": "linear", "status": "active"},
    {"type": "sentry", "status": "active"}
  ]
}
```

**2. Test Agent Run:**
```bash
codegen run "Analyze the project structure and suggest improvements"
```

**3. Monitor Agent Activity:**
```bash
# View recent agent runs
curl -H "Authorization: Bearer sk-20183fe5-c7d7-42d6-ba99-896e70f175f5" \
  "https://api.codegen.com/v1/organizations/4138/agent/runs?limit=10"
```

## 🚀 Next Steps After Setup

1. **Test Integration Pipeline:**
   - Create test PR
   - Trigger Codegen review
   - Verify CircleCI integration
   - Check Sentry error handling

2. **Train Team:**
   - Document integration workflows
   - Share Codegen best practices
   - Set up Linear issue templates
   - Configure notification preferences

3. **Optimize Configuration:**
   - Fine-tune Codegen prompts
   - Adjust CircleCI wake-up sensitivity
   - Customize Linear automation
   - Configure Sentry alert thresholds

4. **Scale Usage:**
   - Enable for all repositories
   - Set up multi-agent workflows
   - Implement custom codemods
   - Integrate with additional tools

## 📚 Reference Documentation

- **Codegen.com Docs:** https://docs.codegen.com
- **GitHub Integration:** https://docs.codegen.com/integrations/github
- **CircleCI Integration:** https://docs.codegen.com/integrations/circleci
- **Linear Integration:** https://docs.codegen.com/integrations/linear
- **MCP Protocol:** https://docs.codegen.com/integrations/mcp
- **API Reference:** https://docs.codegen.com/api-reference/overview
- **Agent SDK:** https://docs.codegen.com/introduction/sdk

## ✅ Success Criteria

Integration setup is complete when:

- [ ] GitHub App installed and webhooks active
- [ ] CircleCI connected and monitoring builds
- [ ] Linear workspace authorized with working API
- [ ] Sentry integration providing error context
- [ ] Cursor MCP server configured and functional
- [ ] Claude Code connected via MCP
- [ ] GitHub Actions workflow running PR reviews
- [ ] All environment variables configured
- [ ] Documentation indexed in Cursor
- [ ] Test PR successfully reviewed by Codegen
- [ ] Integration health checks passing

## 🔐 Security Checklist

- [ ] All API keys stored in environment variables
- [ ] GitHub secrets configured (not committed)
- [ ] Codegen permissions follow least-privilege
- [ ] CircleCI access is read-only
- [ ] Linear API key has appropriate scopes
- [ ] Sentry auth token limited to project
- [ ] Webhook signatures validated
- [ ] HTTPS enforced for all API calls
- [ ] Rate limiting configured
- [ ] Audit logging enabled

---

**Estimated Time:** 4-6 hours
**Priority:** High
**Assignee:** Development Team + Codegen Agent
**Labels:** integration, infrastructure, automation, tooling
