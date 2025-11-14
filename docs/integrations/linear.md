# Linear Integration Setup

This guide explains how to integrate Linear with the suno-api project for enhanced project management and issue tracking.

## 🎯 What is Linear?

[Linear](https://linear.app) is a modern issue tracking and project management tool designed for engineering teams. It offers:

- Fast, keyboard-first interface
- GitHub bidirectional sync
- Automatic issue creation from commits and PRs
- Roadmap planning and cycles
- Team collaboration features

## 📋 Integration Points

This project integrates Linear with:

1. **GitHub** - Bidirectional sync of issues and PRs
2. **Codegen** - Automatic issue creation from code reviews
3. **CircleCI** - Build status updates in Linear issues
4. **Slack** - Notifications for Linear updates

## 🚀 Setup Instructions

### Step 1: Install Linear GitHub Integration

1. Log in to [Linear](https://linear.app)
2. Navigate to **Settings** → **Integrations** → **GitHub**
3. Click **"Add GitHub Integration"**
4. Authorize Linear to access your GitHub account
5. Select the `gcui-art/suno-api` repository
6. Configure sync settings:
   - ✅ **Sync issues to GitHub**
   - ✅ **Sync PRs to Linear**
   - ✅ **Create Linear issues from PRs**
   - ✅ **Update issue status from PR status**

### Step 2: Configure GitHub → Linear Sync

**Automatic Issue Creation from Commits:**

Use Linear keywords in commit messages:

```bash
git commit -m "fix: resolve CAPTCHA timeout

Fixes SUN-123
Closes SUN-124
"
```

**Supported Keywords:**
- `Fixes [ISSUE-ID]` - Marks issue as completed
- `Closes [ISSUE-ID]` - Closes issue
- `Resolves [ISSUE-ID]` - Resolves issue
- `Relates to [ISSUE-ID]` - Links to issue

**Automatic Issue Creation from PR Branches:**

When creating branches, use Linear issue ID:

```bash
# Format: [team]/[issue-id]-[description]
git checkout -b sun/SUN-123-fix-captcha-timeout

# Linear automatically links this branch to issue SUN-123
```

### Step 3: Configure Bidirectional Status Sync

Linear status → GitHub PR status mapping:

| Linear Status  | GitHub PR Status | Auto-sync |
| -------------- | ---------------- | --------- |
| Backlog        | -                | -         |
| Todo           | Draft            | ✅        |
| In Progress    | Open             | ✅        |
| In Review      | Review Requested | ✅        |
| Done           | Merged           | ✅        |
| Cancelled      | Closed           | ✅        |

### Step 4: Set Up Codegen → Linear Integration

Codegen can automatically create Linear issues from code review findings:

1. Log in to [Codegen Dashboard](https://app.codegen.com)
2. Navigate to **Integrations** → **Linear**
3. Click **"Connect Linear"**
4. Authorize Codegen to access your Linear workspace
5. Configure auto-issue creation:

   ```yaml
   Auto-create issues for:
   - Critical findings: ✅
   - High severity bugs: ✅
   - Security vulnerabilities: ✅
   - Performance issues: ⬜
   - Code quality suggestions: ⬜
   ```

6. Select default Linear team: **SUN** (suno-api)
7. Choose default labels:
   - `code-review`
   - `automated`
   - `needs-triage`

### Step 5: Configure CircleCI Integration

Add Linear updates to CircleCI builds:

1. Get Linear API key:
   - Linear Settings → **API** → **Personal API Keys**
   - Click **"Create New Key"**
   - Name: `CircleCI - suno-api`
   - Copy the key (starts with `lin_api_`)

2. Add to CircleCI:
   - Go to [CircleCI Project Settings](https://app.circleci.com)
   - Navigate to **Environment Variables**
   - Add variable:
     ```
     Name: LINEAR_API_KEY
     Value: lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

3. Update CircleCI config (`.circleci/config.yml`):

   ```yaml
   # Add Linear notification step
   - run:
       name: Update Linear issue status
       when: always
       command: |
         if [ -n "$LINEAR_ISSUE_ID" ]; then
           curl -X POST https://api.linear.app/graphql \
             -H "Authorization: $LINEAR_API_KEY" \
             -H "Content-Type: application/json" \
             -d "{
               \"query\": \"mutation {
                 issueUpdate(
                   id: \\\"$LINEAR_ISSUE_ID\\\",
                   input: {
                     stateId: \\\"completed\\\"
                   }
                 ) { success }
               }\"
             }"
         fi
   ```

### Step 6: Set Up Slack Notifications

Get Linear updates in Slack:

1. In Linear: **Settings** → **Integrations** → **Slack**
2. Click **"Add to Slack"**
3. Authorize access
4. Configure notification channels:

   ```text
   #eng-notifications:
   - New issues created
   - Issue status changes
   - PR merged

   #code-review:
   - Codegen issues created
   - Code review comments

   #deployments:
   - Issues completed
   - Releases created
   ```

## 🎛️ Advanced Configuration

### Custom Issue Templates

Create Linear templates for common issue types:

1. **Bug Report Template**:
   ```markdown
   ## Bug Description
   [Clear description of the bug]

   ## Steps to Reproduce
   1. [Step 1]
   2. [Step 2]

   ## Expected Behavior
   [What should happen]

   ## Actual Behavior
   [What actually happens]

   ## Environment
   - Browser: [e.g., Chrome 120]
   - OS: [e.g., macOS 14]
   - Suno API Version: [e.g., v1.2.3]

   ## Related Code
   [Link to relevant code/PR]
   ```

2. **Feature Request Template**:
   ```markdown
   ## Feature Description
   [Clear description of the feature]

   ## Use Case
   [Why is this needed?]

   ## Proposed Solution
   [How should it work?]

   ## Alternatives Considered
   [Other approaches]

   ## Additional Context
   [Screenshots, mockups, etc.]
   ```

### Automation Rules

Set up Linear automation rules:

**Auto-assign based on labels:**
```yaml
When: Issue labeled "browser-automation"
Then: Assign to @playwright-expert

When: Issue labeled "captcha"
Then: Assign to @captcha-team

When: Issue labeled "security"
Then: Assign to @security-team
```

**Auto-update status from PR:**
```yaml
When: PR opened for issue
Then: Move to "In Review"

When: PR merged for issue
Then: Move to "Done"

When: PR closed without merge
Then: Move back to "In Progress"
```

**Auto-add to cycles:**
```yaml
When: Issue labeled "hotfix"
Then: Add to current cycle

When: Issue labeled "p0" or "critical"
Then: Add to current cycle, notify team
```

### GitHub Action for Linear Sync

Create `.github/workflows/linear-sync.yml`:

```yaml
name: Linear Sync

on:
  pull_request:
    types: [opened, closed, reopened]
  issues:
    types: [opened, closed, labeled]

jobs:
  sync:
    name: Sync with Linear
    runs-on: ubuntu-latest
    steps:
      - name: Extract Linear ID from branch
        if: github.event_name == 'pull_request'
        id: linear
        run: |
          BRANCH="${{ github.head_ref }}"
          if [[ $BRANCH =~ sun/([A-Z]+-[0-9]+) ]]; then
            echo "issue_id=${BASH_REMATCH[1]}" >> $GITHUB_OUTPUT
          fi

      - name: Update Linear issue
        if: steps.linear.outputs.issue_id != ''
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
          ISSUE_ID: ${{ steps.linear.outputs.issue_id }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          PR_STATE: ${{ github.event.pull_request.state }}
        run: |
          # GraphQL query to update Linear issue
          curl -X POST https://api.linear.app/graphql \
            -H "Authorization: $LINEAR_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
              \"query\": \"mutation {
                issueUpdate(
                  id: \\\"$ISSUE_ID\\\",
                  input: {
                    description: \\\"Related PR: #$PR_NUMBER\\\"
                  }
                ) { success }
              }\"
            }"
```

## 📊 Workflow Examples

### Example 1: Feature Development

```bash
# 1. Create issue in Linear
# Issue: SUN-125 - "Add retry logic for CAPTCHA solving"

# 2. Create branch from Linear
git checkout -b sun/SUN-125-captcha-retry-logic

# 3. Implement feature
# ... write code ...

# 4. Commit with Linear reference
git commit -m "feat: add CAPTCHA retry logic

- Implement exponential backoff
- Add max retry configuration
- Improve error messages

Relates to SUN-125"

# 5. Push and create PR
git push -u origin sun/SUN-125-captcha-retry-logic
gh pr create --title "feat: Add CAPTCHA retry logic" --body "Fixes SUN-125"

# 6. Linear automatically:
#    - Links PR to issue
#    - Updates issue status to "In Review"
#    - Notifies team in Slack

# 7. After PR merge:
#    - Linear marks issue as "Done"
#    - Updates cycle progress
#    - Triggers deployment notifications
```

### Example 2: Bug Fix from Codegen

```bash
# 1. Codegen finds critical security issue in PR
# 2. Codegen creates Linear issue: SUN-126 "Fix XSS vulnerability in user input"
# 3. Issue auto-assigned to security team
# 4. Team notified in #code-review Slack channel
# 5. Developer fixes:

git checkout -b sun/SUN-126-fix-xss-vulnerability

git commit -m "fix: sanitize user input to prevent XSS

- Add input validation
- Escape special characters
- Add security tests

Fixes SUN-126"

# 6. PR created and merged
# 7. Linear issue auto-closed
# 8. Security audit updated
```

### Example 3: Hotfix Deployment

```bash
# 1. Critical production bug reported
# 2. Create Linear issue: SUN-127 "Fix production CAPTCHA timeout"
# 3. Label: "hotfix", "p0"
# 4. Auto-added to current cycle

git checkout -b sun/SUN-127-hotfix-captcha-timeout

# 5. Fix and commit
git commit -m "fix: increase CAPTCHA timeout for production

Fixes SUN-127"

# 6. Create PR with [HOTFIX] prefix
gh pr create --title "[HOTFIX] Fix CAPTCHA timeout" --body "Closes SUN-127"

# 7. Auto-merged after passing CI
# 8. CircleCI deploys to production
# 9. Linear updated, Slack notification sent
# 10. Issue moved to "Done", cycle updated
```

## 🔍 Monitoring and Analytics

### Linear Insights

View project health in Linear:

1. **Cycle Progress**
   - Go to **Cycles** view
   - See completion percentage
   - Identify blockers

2. **Team Velocity**
   - Navigate to **Insights** → **Velocity**
   - Track issues completed per week
   - Optimize sprint planning

3. **Issue Aging**
   - View **Insights** → **Aging**
   - Identify stale issues
   - Prioritize old bugs

### GitHub Integration Dashboard

Monitor sync status:

1. Go to Linear → **Settings** → **Integrations** → **GitHub**
2. View sync logs
3. Check for failed syncs
4. Resync if needed

## 🐛 Troubleshooting

### Issue not syncing from GitHub

**Problem**: PR created but Linear issue not updated

**Solution**:
1. Check branch name follows format: `sun/SUN-XXX-description`
2. Verify Linear GitHub integration is active
3. Check Linear → Settings → Integrations → GitHub sync logs
4. Manually trigger sync in Linear dashboard

### Codegen not creating Linear issues

**Problem**: Code reviews complete but no Linear issues created

**Solution**:
1. Verify Codegen-Linear integration is connected
2. Check severity threshold settings in Codegen
3. Verify Linear team ID is configured correctly
4. Check Codegen activity logs

### CircleCI not updating Linear

**Problem**: Build completes but Linear issue status unchanged

**Solution**:
1. Verify `LINEAR_API_KEY` is set in CircleCI
2. Check API key has write permissions
3. Verify GraphQL query syntax
4. Check CircleCI build logs for errors

## 📚 Best Practices

### Issue Naming

Use clear, actionable titles:

✅ **Good**:
- "Fix CAPTCHA timeout in browser automation"
- "Add retry logic for 2Captcha API calls"
- "Improve error handling in /api/generate endpoint"

❌ **Bad**:
- "Bug in code"
- "Fix stuff"
- "Update API"

### Labels

Use consistent labels:

**Type labels**:
- `bug` - Something broken
- `feature` - New functionality
- `improvement` - Enhancement to existing feature
- `refactor` - Code cleanup
- `docs` - Documentation

**Priority labels**:
- `p0` - Critical, immediate attention
- `p1` - High priority
- `p2` - Medium priority
- `p3` - Low priority

**Component labels**:
- `browser-automation` - Playwright related
- `captcha` - 2Captcha integration
- `api` - API endpoints
- `security` - Security concerns
- `performance` - Performance optimization

### Issue Estimates

Use t-shirt sizing:

- **XS** (1 point): < 2 hours - Small bug fix, config change
- **S** (2 points): 2-4 hours - Simple feature, minor refactor
- **M** (3 points): 1 day - Standard feature, moderate complexity
- **L** (5 points): 2-3 days - Complex feature, significant refactor
- **XL** (8 points): 1 week - Major feature, architectural change

## 🚀 Next Steps

After Linear integration:

1. **Create first cycle** for current sprint
2. **Import existing GitHub issues** to Linear
3. **Set up team** and assign members
4. **Configure roadmap** for quarterly planning
5. **Train team** on Linear workflow
6. **Review analytics** weekly to track progress

---

**Questions or Issues?**

- Linear Documentation: https://linear.app/docs
- Linear API: https://developers.linear.app
- Support: support@linear.app
