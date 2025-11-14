# Codegen.com AI Code Review Setup

This guide explains how to set up and use Codegen.com AI-powered code reviews in this project.

## 🎯 What is Codegen?

[Codegen](https://codegen.com) is an AI-powered code review platform that provides intelligent, context-aware feedback on pull requests. It integrates directly with GitHub Actions to review code automatically.

## 📋 Prerequisites

1. GitHub repository with Actions enabled
2. Codegen.com account
3. GitHub App installed
4. Organization ID and API Token from Codegen

## 🚀 Setup Instructions

### Step 1: Install Codegen GitHub App

1. Visit [Codegen GitHub App Installation](https://github.com/apps/codegen-app)
2. Click **"Install"** or **"Configure"** if already installed
3. Select this repository (or all repositories in your organization)
4. Grant required permissions:
   - **Pull Requests**: Read & Write (for posting reviews)
   - **Contents**: Read (for analyzing code)
   - **Issues**: Read & Write (optional, for issue comments)

### Step 2: Get Codegen Credentials

1. Log in to [Codegen Dashboard](https://app.codegen.com)
2. Navigate to **Settings** → **API**
3. Copy your **Organization ID** (format: `org_xxxxx`)
4. Generate an **API Token** if you don't have one
   - Click **"Create New Token"**
   - Give it a descriptive name (e.g., "GitHub Actions - suno-api")
   - Copy the token (starts with `cgn_`)

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add two secrets:

   **Secret 1: CODEGEN_ORG_ID**
   ```text
   Name: CODEGEN_ORG_ID
   Value: org_xxxxxxxxxxxxx
   ```

   **Secret 2: CODEGEN_API_TOKEN**
   ```text
   Name: CODEGEN_API_TOKEN
   Value: cgn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 4: Verify Installation

1. Create a test branch:
   ```bash
   git checkout -b test/codegen-setup
   ```

2. Make a small change (e.g., add a comment to a file)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: verify Codegen integration"
   git push -u origin test/codegen-setup
   ```

4. Create a Pull Request on GitHub

5. Check GitHub Actions:
   - Go to the **Actions** tab
   - Find the **"CI/CD Pipeline"** workflow
   - Verify **"Codegen AI Review"** job runs successfully

6. Check Codegen Dashboard:
   - Log in to [Codegen Dashboard](https://app.codegen.com)
   - Navigate to **Reviews** or **Activity**
   - You should see your PR review

## 🔧 How It Works

### Automated Review Process

When you create or update a pull request:

1. **Trigger**: GitHub Actions workflow starts on PR creation/update
2. **Skip Logic**: Review is skipped for:
   - Dependabot PRs
   - Draft PRs (title contains `[DRAFT]` or `WIP`)
   - PRs with `skip-review` label
3. **Analysis**: Codegen Agent analyzes all changed files
4. **Review**: AI generates comprehensive feedback
5. **Results**: Review posted as PR comment and/or in Codegen Dashboard

### Review Focus Areas

The AI reviews code for:

1. **Code Quality**
   - TypeScript/JavaScript best practices
   - Next.js 14 App Router patterns
   - React 18 functional components
   - Proper async/await usage

2. **Security**
   - No hardcoded secrets
   - Input validation
   - XSS/injection prevention
   - Cookie handling

3. **Browser Automation**
   - Playwright best practices
   - Timeout management
   - Anti-detection measures
   - Resource cleanup

4. **CAPTCHA Integration**
   - 2Captcha API usage
   - Error handling
   - Cost optimization

5. **Performance**
   - Efficient async operations
   - Caching strategies
   - Rate limiting

6. **Logging & Errors**
   - Pino structured logging
   - Comprehensive error handling
   - No `console.log` usage

7. **Documentation**
   - JSDoc comments
   - README updates
   - Code comments

## 📝 Configuration

### Review Script Location

The review logic is in `.github/scripts/codegen_review.py`

### Workflow Configuration

The workflow is defined in `.github/workflows/ci.yml`:

```yaml
codegen-review:
  name: Codegen AI Review
  needs: test
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  continue-on-error: true  # Won't block PR merge
  # ... rest of configuration
```

### Customizing Review Behavior

To skip review for specific PRs, add one of these:

**Option 1: Label**
- Add label `skip-review` to PR

**Option 2: Draft**
- Mark PR as draft
- Or include `[DRAFT]` or `WIP` in title

**Option 3: Dependabot**
- Reviews automatically skipped for Dependabot

## 🎛️ Advanced Configuration

### Custom Review Prompts

Edit `.github/scripts/codegen_review.py` function `create_review_prompt()` to customize what the AI focuses on.

### Timeout Configuration

Default timeout is 5 minutes with 3 retries. Adjust in `codegen_review.py`:

```python
success = run_codegen_review(
    agent,
    pr_info,
    max_retries=3,     # Number of retry attempts
    timeout=300        # Timeout in seconds
)
```

### Integration with Linear

Codegen can create Linear issues automatically:

1. Go to Codegen Dashboard → **Integrations** → **Linear**
2. Click **"Connect Linear"**
3. Authorize access
4. Configure auto-issue creation rules

### Integration with Slack

Get review notifications in Slack:

1. Go to Codegen Dashboard → **Integrations** → **Slack**
2. Click **"Add to Slack"**
3. Select channel for notifications
4. Configure notification preferences

## 🔍 Monitoring Reviews

### GitHub Actions Logs

1. Go to **Actions** tab in repository
2. Click on specific workflow run
3. Expand **"Codegen AI Review"** job
4. View detailed logs

### Codegen Dashboard

1. Log in to [Codegen Dashboard](https://app.codegen.com)
2. Navigate to **Reviews**
3. Filter by repository, date, status
4. View detailed review results

## 🐛 Troubleshooting

### "CODEGEN_ORG_ID and CODEGEN_API_TOKEN must be set"

**Problem**: GitHub secrets not configured

**Solution**:
1. Verify secrets are added in GitHub Settings → Secrets
2. Check secret names are exactly: `CODEGEN_ORG_ID` and `CODEGEN_API_TOKEN`
3. Ensure secrets are available to Actions

### "codegen package not installed"

**Problem**: Python package installation failed

**Solution**:
1. Check GitHub Actions log for installation step
2. Verify `pip install codegen` runs successfully
3. Check if pypi.org is accessible from GitHub Actions

### "Review timed out after 10 minutes"

**Problem**: Review took too long

**Solution**:
1. Large PRs may take longer - this is normal
2. Check Codegen Dashboard for partial results
3. Consider breaking PR into smaller chunks

### Review Not Running

**Problem**: Workflow doesn't trigger

**Solution**:
1. Verify workflow file exists: `.github/workflows/ci.yml`
2. Check if PR is draft (reviews skipped)
3. Check if PR author is `dependabot[bot]` (reviews skipped)
4. Verify GitHub Actions are enabled for repository

### "Resource not accessible by integration"

**Problem**: GitHub App permissions insufficient

**Solution**:
1. Reinstall Codegen GitHub App
2. Grant all required permissions
3. Verify App is installed for this repository

## 📚 Additional Resources

- **Codegen Documentation**: https://docs.codegen.com
- **GitHub App**: https://github.com/apps/codegen-app
- **Dashboard**: https://app.codegen.com
- **Support**: support@codegen.com

## 🔐 Security Notes

- ✅ API tokens are stored as GitHub encrypted secrets
- ✅ Tokens are not exposed in logs or PR comments
- ✅ Codegen has read-only access to code
- ✅ Review results can be private or public (configure in Codegen Dashboard)

## 🚀 Next Steps

After setup, consider:

1. **Configure Linear integration** for automatic issue creation
2. **Set up Slack notifications** for team awareness
3. **Customize review prompts** for project-specific patterns
4. **Review Codegen Analytics** to track code quality trends
5. **Train team** on interpreting AI feedback

---

**Questions or Issues?**

- Open an issue in this repository
- Contact Codegen support: support@codegen.com
- Check Codegen documentation: https://docs.codegen.com
