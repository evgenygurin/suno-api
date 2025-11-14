# Pull Request Quick Checklist

Quick reference for experienced contributors. For detailed guidelines, see [PR_GUIDELINES.md](./PR_GUIDELINES.md).

## ⚡️ Before Creating PR (2 minutes)

### Run All Checks

```bash
# Verify everything passes locally
npx tsc --noEmit        # TypeScript compilation
npm run lint            # ESLint
npm run build           # Next.js build
npm test                # All tests
npm audit               # Security check
```

### Update Documentation

```bash
# Essential updates
✓ CHANGELOG.md          # Add entry under [Unreleased]
✓ README.md             # If user-facing changes
✓ .env.example          # If new env vars
```

## 📋 Template Sections (5 minutes)

### Must Complete

- [ ] **Description** - User perspective (not implementation)
- [ ] **Changelog Entry** - User-focused, one category
- [ ] **Type of Change** - At least one checkbox
- [ ] **Testing** - What you tested manually
- [ ] **Documentation** - What you updated

### Common Mistakes

- ❌ Technical changelog: "Implemented XYZ class"
- ✅ User-focused: "Added batch music generation"
- ❌ Vague description: "Fixed issue"
- ✅ Specific: "Fixed CAPTCHA timeout in Firefox"

## 🎯 Quality Gates

### Code Quality

```bash
✓ TypeScript: No `any` types
✓ Logging: Use Pino, not console.log
✓ Errors: Comprehensive try-catch
✓ Types: Proper interfaces/types
✓ Async: Proper await, error handling
```

### Testing

```bash
✓ Existing tests pass
✓ New tests for new code
✓ Edge cases covered
✓ Manual testing done
✓ Browser automation tested (if applicable)
```

### Security

```bash
✓ No secrets in code
✓ Environment variables used
✓ Input validation added
✓ No console.log statements
✓ Cookies/tokens never logged
```

### Documentation

```bash
✓ CHANGELOG.md updated
✓ README.md updated (if needed)
✓ API docs updated (if endpoints changed)
✓ Comments for complex logic
✓ .env.example updated (if env vars)
```

## 🔧 Project-Specific Checks

### Next.js 14 App Router

- [ ] Using App Router patterns (not Pages Router)
- [ ] Server/Client components correct
- [ ] Metadata API used correctly
- [ ] Route handlers in `route.ts`

### Playwright/Browser Automation

- [ ] Proper timeouts configured
- [ ] Error handling comprehensive
- [ ] Browser contexts cleaned up
- [ ] Anti-detection maintained (rebrowser-patches)

### CAPTCHA Integration

- [ ] 2Captcha API properly used
- [ ] Error handling for failed solves
- [ ] Cost optimization considered
- [ ] Never log API keys

## 🚨 Hotfix Additional Checks

If using hotfix template:

```bash
CRITICAL - Must Have:
✓ Severity level selected
✓ Root cause documented
✓ Rollback plan TESTED (not just written!)
✓ Monitoring plan defined
✓ Communication plan ready
✓ Risk assessment complete

Don't Deploy Without:
✓ Another developer reviewed
✓ Tests pass
✓ Rollback tested
✓ Monitoring ready
✓ Team notified
```

## 📊 Self-Review Checklist

### Before Clicking "Create PR"

```bash
# Review your own changes
git diff main...HEAD

# Ask yourself:
✓ Would I understand this in 6 months?
✓ Is every change necessary?
✓ Could this break anything?
✓ Are my tests sufficient?
✓ Is documentation complete?
```

### Common Issues to Check

- [ ] No merge conflicts
- [ ] No debugging code left (console.log, debugger)
- [ ] No commented code (remove it)
- [ ] No TODOs without issues
- [ ] No hardcoded values (use env vars)
- [ ] No secrets or API keys

## 🎯 Quick Git Commands

### Common Operations

```bash
# Update from main
git fetch origin main
git rebase origin/main

# Squash commits (if needed)
git rebase -i main

# Force push (after rebase)
git push --force-with-lease

# Create PR with GitHub CLI
gh pr create --fill
```

### Fixing Issues

```bash
# Amend last commit
git add .
git commit --amend --no-edit
git push --force-with-lease

# Undo last commit (keep changes)
git reset --soft HEAD^

# Discard changes
git checkout -- <file>
```

## 📈 Branching Quick Reference

```text
Feature:    feature/* → main
Hotfix:     hotfix/*  → main (then sync)
```

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Run all checks | 2-3 min |
| Fill template | 5-10 min |
| Self-review | 3-5 min |
| **Total** | **10-20 min** |

For hotfix: Add 10-15 min for rollback plan and monitoring setup.

## 🔗 Quick Links

- **Detailed Guide:** [PR_GUIDELINES.md](./PR_GUIDELINES.md)
- **Template Selection:** [PULL_REQUEST_TEMPLATE/README.md](./PULL_REQUEST_TEMPLATE/README.md)
- **CI/CD Docs:** [../CI_CD_DOCUMENTATION.md](../CI_CD_DOCUMENTATION.md)
- **Development Guide:** [../CLAUDE.md](../CLAUDE.md)

## ✅ Final Check

Before submitting:

```bash
✓ All commands passed locally
✓ Documentation updated
✓ Template completely filled
✓ Self-reviewed changes
✓ No secrets committed
✓ Tests pass
✓ Ready for review
```

**If all checks pass:** Create PR! 🚀

**If something fails:** Fix it before creating PR.

---

**Pro tip:** Save this checklist as a pre-commit hook or keep it open while working on PRs!
