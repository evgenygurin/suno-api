# Slack Integration Setup

This guide explains how to integrate Slack with the suno-api project for real-time notifications and team collaboration.

## 🎯 What is This Integration?

This Slack integration provides unified notifications from all development tools:

- 📢 **GitHub** - PR reviews, CI/CD status, deployments
- 🔴 **CircleCI** - Build status, test results, deployment progress
- 📝 **Linear** - Issue updates, sprint progress, roadmap changes
- 🤖 **Codegen** - AI code review results, critical findings
- 🐛 **Sentry** - Production errors, performance issues, releases

## 📋 Recommended Channel Structure

```text
#suno-api-dev
├─ GitHub PR notifications
├─ Code review discussions
└─ Development updates

#suno-api-builds
├─ CircleCI build status
├─ Test results
└─ Deployment notifications

#suno-api-incidents
├─ Sentry error alerts (critical/high only)
├─ Performance degradation warnings
└─ Production issue coordination

#suno-api-sprint
├─ Linear sprint updates
├─ Issue status changes
└─ Cycle progress reports

#suno-api-releases
├─ Release announcements
├─ Deployment confirmations
└─ Changelog updates
```

## 🚀 Setup Instructions

### Step 1: GitHub → Slack Integration

#### Option A: GitHub Slack App (Recommended)

1. Install GitHub Slack App:
   - Visit [GitHub Slack App](https://slack.com/apps/A01BP7R4KNY-github)
   - Click **"Add to Slack"**
   - Select your workspace
   - Authorize access

2. Configure in Slack:
   ```text
   /github subscribe gcui-art/suno-api
   ```

3. Customize notifications:
   ```text
   # Subscribe to specific events
   /github subscribe gcui-art/suno-api reviews comments

   # Full feature set
   /github subscribe gcui-art/suno-api \
     issues pulls commits releases deployments \
     reviews comments branches

   # Unsubscribe from noisy events
   /github unsubscribe gcui-art/suno-api commits
   ```

4. Configure channel-specific routing:
   ```text
   # In #suno-api-dev
   /github subscribe gcui-art/suno-api pulls reviews comments

   # In #suno-api-releases
   /github subscribe gcui-art/suno-api releases deployments

   # In #suno-api-builds
   /github subscribe gcui-art/suno-api checks
   ```

#### Option B: Webhook Integration

1. Create Incoming Webhook:
   - Go to Slack: **Apps** → **Incoming Webhooks**
   - Click **"Add to Slack"**
   - Select channel (e.g., `#suno-api-dev`)
   - Copy webhook URL

2. Add to GitHub:
   - Repository → **Settings** → **Webhooks**
   - Click **"Add webhook"**
   - Payload URL: `[Your Slack webhook URL]`
   - Content type: `application/json`
   - Events: Select desired events
   - Save webhook

### Step 2: CircleCI → Slack Integration

1. Get Slack Webhook URL:
   - Slack: **Apps** → **Incoming Webhooks**
   - Create webhook for `#suno-api-builds`
   - Copy URL

2. Add to CircleCI Environment:
   - Go to [CircleCI Project Settings](https://app.circleci.com)
   - Navigate to **Environment Variables**
   - Add variable:
     ```
     Name: SLACK_WEBHOOK_URL
     Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
     ```

3. Update `.circleci/config.yml`:

   ```yaml
   version: 2.1

   orbs:
     slack: circleci/slack@4.12.5

   jobs:
     test:
       # ... existing config
       steps:
         - checkout
         - run: npm ci
         - run: npm test

         # Notify on failure
         - slack/notify:
             event: fail
             channel: C0123456789  # suno-api-builds channel ID
             custom: |
               {
                 "blocks": [
                   {
                     "type": "section",
                     "text": {
                       "type": "mrkdwn",
                       "text": "❌ *Build Failed*\n*Project:* suno-api\n*Branch:* ${CIRCLE_BRANCH}\n*Author:* ${CIRCLE_USERNAME}"
                     }
                   },
                   {
                     "type": "actions",
                     "elements": [
                       {
                         "type": "button",
                         "text": {
                           "type": "plain_text",
                           "text": "View Build"
                         },
                         "url": "${CIRCLE_BUILD_URL}"
                       }
                     ]
                   }
                 ]
               }

     deploy:
       # ... existing config
       steps:
         - run: npm run deploy

         # Notify on success
         - slack/notify:
             event: pass
             channel: C9876543210  # suno-api-releases channel ID
             custom: |
               {
                 "blocks": [
                   {
                     "type": "section",
                     "text": {
                       "type": "mrkdwn",
                       "text": "🚀 *Deployment Successful*\n*Environment:* ${DEPLOY_ENV}\n*Version:* ${CIRCLE_TAG}\n*Deployed by:* ${CIRCLE_USERNAME}"
                     }
                   }
                 ]
               }

   workflows:
     test-and-deploy:
       jobs:
         - test
         - deploy:
             requires:
               - test
             filters:
               branches:
                 only: main
   ```

### Step 3: Linear → Slack Integration

1. In Linear workspace:
   - Go to **Settings** → **Integrations** → **Slack**
   - Click **"Add to Slack"**
   - Select your Slack workspace
   - Authorize access

2. Configure notification channels:

   **#suno-api-sprint:**
   ```text
   Notifications:
   - Issue created
   - Issue status changed
   - Issue assigned
   - Cycle started/completed
   - Sprint planning updates
   ```

   **#suno-api-dev:**
   ```text
   Notifications:
   - Issue moved to "In Review"
   - PR linked to issue
   - Issue blocked
   ```

3. Set up notification rules:
   ```text
   When: Issue labeled "critical"
   Then: Notify @channel in #suno-api-incidents

   When: Issue moved to "Done"
   Then: Notify in #suno-api-sprint

   When: Cycle completed
   Then: Post summary in #suno-api-sprint
   ```

### Step 4: Codegen → Slack Integration

1. In Codegen Dashboard:
   - Navigate to **Settings** → **Integrations** → **Slack**
   - Click **"Connect Slack"**
   - Authorize access

2. Configure review notifications:

   **Channel: #suno-api-dev**
   ```yaml
   Notify when:
   - Review completed: ✅
   - Critical issues found: ✅
   - Security vulnerabilities: ✅
   - Performance issues: ⬜
   - Code quality suggestions: ⬜

   Message format:
   - Include severity
   - Link to PR
   - Show top 3 findings
   - Mention PR author
   ```

3. Customize notification template:
   ```json
   {
     "blocks": [
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "🤖 *Codegen Review Complete*\n*PR:* <${PR_URL}|#${PR_NUMBER} - ${PR_TITLE}>\n*Severity:* ${MAX_SEVERITY}\n*Findings:* ${TOTAL_FINDINGS}"
         }
       },
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "*Top Issues:*\n${TOP_ISSUES_LIST}"
         }
       }
     ]
   }
   ```

### Step 5: Sentry → Slack Integration

1. In Sentry:
   - Project → **Settings** → **Integrations** → **Slack**
   - Click **"Add Workspace"**
   - Select your Slack workspace
   - Authorize access

2. Configure alert rules:

   **Rule 1: Critical Errors**
   ```yaml
   Name: Critical Production Errors
   Conditions:
   - Environment: production
   - Level: error or fatal
   - Event count: ≥ 1 in 5 minutes

   Actions:
   - Send Slack notification to #suno-api-incidents
   - Mention: @oncall
   - Include: Stack trace, user context, tags
   ```

   **Rule 2: Performance Degradation**
   ```yaml
   Name: Performance Issues
   Conditions:
   - Transaction duration: > 2s
   - Affected users: ≥ 10 in 15 minutes

   Actions:
   - Send Slack notification to #suno-api-incidents
   - Include: Transaction name, duration, user count
   ```

   **Rule 3: Release Monitoring**
   ```yaml
   Name: New Release Deployed
   Conditions:
   - New release created

   Actions:
   - Send Slack notification to #suno-api-releases
   - Include: Version, commit, deploy time
   ```

3. Customize notification format:
   ```json
   {
     "attachments": [
       {
         "color": "danger",
         "title": "🔴 Production Error",
         "title_link": "${SENTRY_ISSUE_URL}",
         "text": "${ERROR_MESSAGE}",
         "fields": [
           {
             "title": "Environment",
             "value": "production",
             "short": true
           },
           {
             "title": "Affected Users",
             "value": "${USER_COUNT}",
             "short": true
           },
           {
             "title": "First Seen",
             "value": "${FIRST_SEEN}",
             "short": true
           },
           {
             "title": "Event Count",
             "value": "${EVENT_COUNT}",
             "short": true
           }
         ]
       }
     ]
   }
   ```

## 🎛️ Advanced Features

### Custom Slack Bot for suno-api

Create a custom bot for project-specific commands:

**Setup:**

1. Create Slack App:
   - Go to [Slack API](https://api.slack.com/apps)
   - Click **"Create New App"**
   - Name: `suno-api-bot`
   - Workspace: Your workspace

2. Add Bot Scopes:
   ```text
   chat:write
   channels:read
   groups:read
   users:read
   commands
   ```

3. Install to workspace

4. Get Bot Token (starts with `xoxb-`)

**Bot Commands:**

```javascript
// /suno-status - Get current project status
{
  "command": "/suno-status",
  "response": {
    "text": "📊 *suno-api Status*",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "🟢 All systems operational\n• API: Healthy\n• CAPTCHA: 98% success rate\n• Queue: 0 pending"
        }
      }
    ]
  }
}

// /suno-deploy - Trigger deployment
{
  "command": "/suno-deploy <environment>",
  "description": "Deploy to staging or production"
}

// /suno-incidents - List recent incidents
{
  "command": "/suno-incidents [count]",
  "description": "Show recent production incidents"
}

// /suno-metrics - Show key metrics
{
  "command": "/suno-metrics [period]",
  "description": "Display performance metrics"
}
```

### Automated Daily Standups

Create automated daily standup reports:

```javascript
// GitHub Action: .github/workflows/daily-standup.yml
name: Daily Standup Report

on:
  schedule:
    - cron: '0 9 * * 1-5'  # Mon-Fri at 9 AM UTC

jobs:
  standup:
    runs-on: ubuntu-latest
    steps:
      - name: Generate standup report
        run: |
          # Get yesterday's stats
          COMMITS=$(gh api repos/gcui-art/suno-api/commits \
            --jq '[.[] | select(.commit.author.date > (now - 86400 | todate))] | length')

          PRS_MERGED=$(gh pr list --state merged --limit 100 \
            --json mergedAt --jq '[.[] | select(.mergedAt > (now - 86400 | todate))] | length')

          ISSUES_CLOSED=$(gh issue list --state closed --limit 100 \
            --json closedAt --jq '[.[] | select(.closedAt > (now - 86400 | todate))] | length')

          # Post to Slack
          curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
            -H 'Content-Type: application/json' \
            -d "{
              \"text\": \"📊 *Daily Standup Report*\",
              \"blocks\": [
                {
                  \"type\": \"section\",
                  \"text\": {
                    \"type\": \"mrkdwn\",
                    \"text\": \"*Yesterday's Activity:*\n• ${COMMITS} commits\n• ${PRS_MERGED} PRs merged\n• ${ISSUES_CLOSED} issues closed\"
                  }
                }
              ]
            }"
```

### Sprint Summary Reports

Weekly sprint progress updates:

```yaml
# .github/workflows/sprint-summary.yml
name: Sprint Summary

on:
  schedule:
    - cron: '0 17 * * 5'  # Every Friday at 5 PM UTC

jobs:
  summary:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch Linear sprint data
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: |
          # GraphQL query to Linear
          RESPONSE=$(curl -X POST https://api.linear.app/graphql \
            -H "Authorization: $LINEAR_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{
              "query": "query { team(id: \"SUN\") { activeCycle { completedIssueCount inProgressIssueCount } } }"
            }')

          # Parse and post to Slack
          # ... format and send to #suno-api-sprint
```

## 📊 Notification Best Practices

### Reduce Notification Fatigue

**Do's:**
- ✅ Use different channels for different priorities
- ✅ Mention @channel only for critical issues
- ✅ Use threads for follow-up discussions
- ✅ Batch low-priority notifications
- ✅ Set quiet hours (evenings/weekends)

**Don'ts:**
- ❌ Send every CI build to main channel
- ❌ Duplicate notifications across channels
- ❌ Overuse @here/@channel
- ❌ Send verbose messages
- ❌ Ignore threading

### Message Formatting

**Good notification:**
```text
🚀 Deployment Successful
Environment: Production
Version: v1.2.3
Changes: 15 commits, 3 PRs merged
Duration: 3m 42s
[View Deployment] [View Release Notes]
```

**Bad notification:**
```text
Deployment completed successfully to production environment. Version 1.2.3 was deployed by username at 2024-01-15 14:32:11 UTC. The deployment included changes from pull requests #45, #47, and #49 with a total of 15 commits...
```

### Priority-based Routing

```yaml
Critical (immediate attention):
  Channel: #suno-api-incidents
  Mention: @oncall or @channel
  Examples:
    - Production errors
    - Security vulnerabilities
    - Failed deployments
    - Service outages

High (same-day attention):
  Channel: #suno-api-dev
  Mention: @team-leads
  Examples:
    - Failed PR builds
    - Code review findings
    - Dependency alerts

Medium (this week):
  Channel: #suno-api-dev
  Mention: None
  Examples:
    - PR opened
    - Issue created
    - Build passed

Low (informational):
  Channel: #suno-api-activity (optional)
  Mention: None
  Examples:
    - Commits pushed
    - Comments added
    - Labels changed
```

## 🔍 Monitoring Integration Health

### Verify Integration Status

**Weekly checklist:**

```bash
# 1. Test GitHub notifications
git commit --allow-empty -m "test: Slack notification test"
git push

# 2. Verify in Slack that notification appeared

# 3. Check CircleCI webhook
curl -X POST "$CIRCLE_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 4. Verify Linear sync
# Create test issue in Linear, check Slack notification

# 5. Test Sentry alerts
# Trigger test error, verify Slack alert
```

### Debug Integration Issues

**GitHub notifications not appearing:**

1. Check Slack app installation:
   ```text
   /github subscribe list
   ```

2. Verify subscription:
   ```text
   /github subscribe gcui-art/suno-api
   ```

3. Check webhook status in GitHub Settings

**CircleCI notifications missing:**

1. Verify environment variable:
   ```bash
   echo $SLACK_WEBHOOK_URL
   ```

2. Check CircleCI Slack orb version
3. Review build logs for Slack step errors

**Sentry alerts not working:**

1. Check Sentry integration status
2. Verify alert rules are active
3. Test with sample error
4. Check Slack workspace permissions

## 🚀 Next Steps

After Slack integration:

1. **Set up channels** and invite team members
2. **Configure notification preferences** for each integration
3. **Test all integrations** with sample events
4. **Train team** on using Slack commands and threads
5. **Create runbook** for responding to critical alerts
6. **Review and optimize** notification volume weekly

---

**Resources:**

- Slack API Documentation: https://api.slack.com
- CircleCI Slack Orb: https://circleci.com/developer/orbs/orb/circleci/slack
- GitHub Slack App: https://slack.github.com
- Linear Slack Integration: https://linear.app/docs/slack
- Sentry Slack Integration: https://docs.sentry.io/product/integrations/notification-incidents/slack
