<!--
==================================================================================
Pull Request Template for Suno API
==================================================================================
Please fill out all sections completely. This helps reviewers understand your
changes and ensures high-quality contributions.

For detailed guidelines, see: .github/PR_GUIDELINES.md
For quick checklist, see: .github/PR_CHECKLIST.md
==================================================================================
-->

## 📋 Description

### What Changed (User Perspective)
<!-- Describe what changed from an end-user perspective, not implementation details -->
<!-- Example: "API now supports batch music generation with up to 5 tracks in a single request" -->

### Why This Change
<!-- Explain the motivation: bug fix, new feature, performance improvement, etc. -->

### Who Is Affected
<!-- Who benefits from or needs to know about this change? -->
<!-- Example: "All users, Docker users, developers using specific endpoint" -->

## 📝 Changelog Entry

<!-- Copy this entry to CHANGELOG.md under [Unreleased] section -->
<!-- Follow Keep a Changelog format: https://keepachangelog.com/en/1.0.0/ -->

### Category
<!-- Select one by replacing [ ] with [x] -->
- [ ] Added - New features
- [ ] Changed - Changes in existing functionality
- [ ] Deprecated - Soon-to-be removed features
- [ ] Removed - Removed features
- [ ] Fixed - Bug fixes
- [ ] Security - Vulnerability fixes
- [ ] Performance - Performance improvements

### Entry
<!-- Write a user-focused changelog entry (1-2 sentences) -->
```markdown
- Your changelog entry here
```

**Good Example:**
```markdown
- Added batch music generation endpoint supporting up to 5 tracks in a single request
```

**Bad Example:**
```markdown
- Implemented GenerateMusicBatchRequest interface with queue processor
```

## 🔧 Type of Change

<!-- Select all that apply by replacing [ ] with [x] -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement (non-breaking change that improves performance)
- [ ] Refactoring (no functional changes, code improvements)
- [ ] Documentation update (README, comments, guides)
- [ ] Configuration change (env vars, CI/CD, Docker)
- [ ] Dependency update (package upgrades/changes)
- [ ] Infrastructure (CI/CD, deployment, tooling)

## 🎯 Related Issues/PRs

<!-- Link related issues, PRs, or discussions -->
- Closes #
- Related to #
- Depends on #

## 🧪 Testing

### Test Coverage
<!-- Describe what tests were added/modified -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] No tests needed (explain why):

### Manual Testing Performed
<!-- Describe what you manually tested -->
```text
1. Test scenario 1...
2. Test scenario 2...
3. Test scenario 3...
```

### Test Commands
<!-- Commands to reproduce testing -->
```bash
npm test                  # Run all tests
npm run test:specific     # Run specific test suite
npm run dev               # Test in development
curl -X POST ...          # Example API call
```

## 🔍 Browser Automation Changes
<!-- Only if this PR affects Playwright/browser automation -->

### CAPTCHA Handling
- [ ] No changes to CAPTCHA solving
- [ ] CAPTCHA solving modified (describe):
- [ ] New anti-detection measures added
- [ ] Tested with multiple CAPTCHA scenarios

### Browser Compatibility
<!-- Tested browsers -->
- [ ] Chromium (rebrowser-patches)
- [ ] Firefox
- [ ] macOS (fewer CAPTCHAs)
- [ ] Linux/Docker

### Anti-Detection Measures
<!-- If changes affect detection avoidance -->
- [ ] No changes to anti-detection
- [ ] Anti-detection updated (describe):
- [ ] Tested detection resistance

## 📚 Documentation

<!-- All documentation that was updated -->
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Code comments added for complex logic
- [ ] Environment variables documented in .env.example
- [ ] CI_CD_DOCUMENTATION.md updated (if CI/CD changes)
- [ ] CLAUDE.md updated (if development workflow changes)
- [ ] MCP integration docs updated (if MCP changes)

## 🔒 Security Considerations

<!-- Security implications of your changes -->
- [ ] No secrets or API keys committed
- [ ] Environment variables used correctly
- [ ] Input validation added where needed
- [ ] No new security vulnerabilities introduced
- [ ] Security audit passed (`npm audit`)
- [ ] Secrets properly handled in CI/CD

### Sensitive Data Handling
<!-- If this PR handles cookies, tokens, or user data -->
- [ ] Not applicable
- [ ] Cookies/tokens never logged
- [ ] Proper encryption/sanitization
- [ ] Complies with privacy requirements

## 🚀 Deployment

### Environment Variables
<!-- List any new or changed environment variables -->
```bash
# New variables (add to .env.example):
NEW_VAR=value

# Changed variables (update documentation):
EXISTING_VAR=new_default_value

# Removed variables:
DEPRECATED_VAR (no longer needed)
```

### Breaking Changes
<!-- Only if this is a breaking change -->
- [ ] Not a breaking change
- [ ] Breaking change (complete section below)

#### Migration Guide
<!-- Provide clear migration instructions for breaking changes -->
```markdown
**Before:**
```typescript
// Old usage
```

**After:**
```typescript
// New usage
```

**Steps to migrate:**
1. Update...
2. Change...
3. Test...
```bash

### Deployment Notes
<!-- Special deployment considerations -->
- [ ] No special deployment steps needed
- [ ] Requires database migration
- [ ] Requires environment variable updates
- [ ] Requires service restart
- [ ] Requires cache clearing
- [ ] Deployment steps (list below):

### Rollback Plan
<!-- How to rollback if deployment fails -->
```markdown
1. Revert to previous commit: git revert <commit-hash>
2. Restore environment variables: ...
3. Restart services: ...
```

## ✅ Pre-Submission Checklist

### Code Quality
<!-- Verify all items before submitting -->
- [ ] Code compiles (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] No console.log statements (use Pino logger)
- [ ] TypeScript strict mode compliant (no `any` types)
- [ ] Error handling is comprehensive

### Testing
- [ ] Existing tests still pass
- [ ] New tests added for new code
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Performance tested (if applicable)

### Documentation
- [ ] CHANGELOG.md updated with user-focused entry
- [ ] README.md updated if needed
- [ ] API docs updated if endpoints changed
- [ ] Comments added for complex logic
- [ ] .env.example updated if env vars changed

### Security & Best Practices
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables properly used
- [ ] Input validation added
- [ ] npm audit passes (no critical/high vulnerabilities)
- [ ] Following Next.js 14 App Router patterns
- [ ] Following project TypeScript patterns from CLAUDE.md

### Browser Automation (if applicable)
- [ ] Playwright code uses proper error handling
- [ ] Timeouts configured appropriately
- [ ] Browser contexts properly cleaned up
- [ ] Anti-detection measures maintained
- [ ] CAPTCHA solving tested

### CI/CD
- [ ] CI checks passing locally
- [ ] No CircleCI config syntax errors
- [ ] GitHub Actions workflows still valid
- [ ] Sentry integration tested (if applicable)

## 🔗 Additional Context

### Screenshots
<!-- If UI changes, add screenshots/videos -->

### Performance Benchmarks
<!-- If performance changes, show before/after -->
```text
Before:
After:
```

### Dependencies
<!-- List any new dependencies and why they're needed -->
- `package-name@version` - Reason for adding

### Related Documentation
<!-- Links to relevant documentation -->
- Documentation:
- API Reference:
- External resources:

## 👀 Reviewer Notes

### Review Focus Areas
<!-- What should reviewers pay special attention to? -->
1.
2.
3.

### Known Limitations
<!-- Anything reviewers should be aware of -->
-

### Future Improvements
<!-- Follow-up work planned but not in this PR -->
-

---

## 📖 Template Usage Tips

**First time creating a PR?**
- Read `.github/PR_GUIDELINES.md` for detailed guidance
- Check `.github/PR_CHECKLIST.md` for quick reference
- Look at recently merged PRs as examples

**For hotfixes:**
Use template `.github/PULL_REQUEST_TEMPLATE/hotfix.md`:
```bash
gh pr create --template hotfix.md --base main
```

**Questions about this template?**
See `.github/PR_DOCUMENTATION_INDEX.md` for navigation

<!--
==================================================================================
Thank you for your contribution to Suno API! 🎵
==================================================================================
-->
