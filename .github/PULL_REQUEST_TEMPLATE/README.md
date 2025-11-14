# Pull Request Templates Guide

This directory contains specialized PR templates for different types of changes.

## 📋 Available Templates

### 1. Default Template (`../.github/PULL_REQUEST_TEMPLATE.md`)

**Use for:** Most pull requests (features, bug fixes, refactoring)

**When:**

- Adding new functionality
- Fixing non-critical bugs
- Refactoring code
- Updating documentation
- Changing configurations

**Automatically used when:**

- Creating PR through GitHub UI
- Using `gh pr create` without template flag

---

### 2. Hotfix Template (`hotfix.md`)

**Use for:** Critical production issues requiring immediate deployment

**When:**

- Production is down
- Critical security vulnerability
- Data loss risk
- Major functionality broken
- High-severity bugs affecting users

**How to use:**

```bash
# GitHub CLI
gh pr create --template hotfix.md --base main

# Or via URL parameter
# When creating PR, add: ?template=hotfix.md
```

**Key Requirements:**

- Root cause analysis
- Tested rollback plan
- Risk assessment
- Monitoring plan
- Communication plan

---

## 🎯 Template Selection Decision Tree

```text
Is this a critical production issue?
├─ YES → Use HOTFIX template
│         - Production down?
│         - Security breach?
│         - Data loss?
│         - Major functionality broken?
│
└─ NO → Use DEFAULT template
          - New feature?
          - Bug fix?
          - Refactoring?
          - Documentation?
```

## 🚀 How to Use Templates

### Method 1: GitHub UI (Automatic)

1. Go to repository
2. Click "Pull Requests" tab
3. Click "New pull request"
4. Select branches
5. Click "Create pull request"
6. **Default template loads automatically**
7. Fill out all sections
8. Submit

### Method 2: GitHub UI (Select Template)

1. Create PR as above
2. In URL, add: `?template=hotfix.md`
3. Template loads
4. Fill out all sections
5. Submit

Example URL:

```text
https://github.com/yourusername/suno-api/compare/main...feature-branch?template=hotfix.md
```

### Method 3: GitHub CLI (Recommended)

**Default template:**

```bash
# Automatically uses default template
gh pr create
```

**Hotfix template:**

```bash
# Use hotfix template
gh pr create --template hotfix.md --base main
```

**With all options:**

```bash
gh pr create \
  --template hotfix.md \
  --base main \
  --title "HOTFIX: Fix critical CAPTCHA timeout issue" \
  --label "hotfix,critical"
```

## 📚 Template Guidelines by Type

### Default Template

**Focus areas:**

1. **User impact** - What changed from user perspective
2. **Changelog** - User-focused entry for CHANGELOG.md
3. **Testing** - Comprehensive test coverage
4. **Documentation** - All docs updated
5. **Security** - No secrets, proper validation
6. **Browser automation** - If Playwright changes

**Common sections to fill:**

- Description (user perspective)
- Changelog entry
- Type of change
- Testing performed
- Documentation updates
- Pre-submission checklist

**Time to complete:** 10-15 minutes

### Hotfix Template

**Focus areas:**

1. **Severity** - How critical is this?
2. **Root cause** - What went wrong and why?
3. **Rollback plan** - Tested procedure to revert
4. **Risk assessment** - What could go wrong?
5. **Monitoring** - How to verify success?
6. **Communication** - Who needs to know?

**Common sections to fill:**

- Severity level
- Root cause analysis
- The fix (technical + user perspective)
- Rollback plan (tested!)
- Monitoring plan
- Communication plan

**Time to complete:** 20-30 minutes (don't rush!)

## 🎓 Best Practices

### For All PRs

1. **Fill out ALL sections** - Even if "N/A", explain why
2. **Be specific** - Vague descriptions slow down reviews
3. **Think user-first** - Changelog from user perspective
4. **Test thoroughly** - Including edge cases
5. **Update docs** - Especially CHANGELOG.md
6. **Self-review** - Check your own PR before submitting

### For Hotfixes

1. **Don't rush** - Urgency ≠ Skip steps
2. **Test rollback** - Before deploying fix
3. **Document root cause** - For post-mortem
4. **Monitor closely** - First hour is critical
5. **Communicate clearly** - Keep team informed
6. **Learn from it** - Add tests, update monitoring

## 📊 Checklist Quick Reference

### Before Creating PR

```bash
# 1. Run quality checks
npx tsc --noEmit    # TypeScript compilation
npm run lint        # Linting
npm run build       # Build
npm test            # All tests

# 2. Update documentation
# - Update CHANGELOG.md under [Unreleased]
# - Update README.md if needed
# - Update .env.example if env vars changed

# 3. Self-review
git diff main...HEAD    # Review your changes
```

### When Filling Template

- [ ] Description focuses on user impact
- [ ] Changelog entry is user-focused (not technical)
- [ ] All applicable checkboxes checked
- [ ] Tests documented and passing
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] No secrets committed

### Hotfix Specific

- [ ] Severity level selected
- [ ] Root cause documented
- [ ] Rollback plan written AND TESTED
- [ ] Monitoring plan defined
- [ ] Communication plan ready
- [ ] Risk assessment complete
- [ ] Post-deployment verification planned

## 🔗 Related Documentation

- **Detailed Guidelines:** `.github/PR_GUIDELINES.md`
- **Quick Checklist:** `.github/PR_CHECKLIST.md`
- **CI/CD Process:** `CI_CD_DOCUMENTATION.md`
- **Development Guide:** `CLAUDE.md`
- **Contributing:** `CONTRIBUTING.md`

## ❓ Common Questions

### Q: Which template should I use for dependency updates?

**A:** Default template. Mark as "Dependency update" type and update CHANGELOG.md under "Changed" or "Security" category.

### Q: Do I need to use hotfix template for all bugs?

**A:** No! Only for critical production issues. Normal bugs use default template.

### Q: Can I skip sections that don't apply?

**A:** Mark as "N/A" and briefly explain why. Don't delete sections.

### Q: What if I'm not sure about something?

**A:** Ask in PR description or GitHub Discussions. Better to ask than guess!

### Q: How detailed should my changelog entry be?

**A:** 1-2 sentences, user-focused. Example:

- ✅ "API now supports batch generation of up to 5 tracks"
- ❌ "Implemented BatchGenerationRequest class"

### Q: Do I need to update CHANGELOG.md myself?

**A:** Yes! Add your entry under `[Unreleased]` section. Copy from template.

### Q: What if tests are failing?

**A:** Don't create PR! Fix tests first, or explain why failure is expected (rare).

### Q: Can I create PR with incomplete template?

**A:** For draft PRs, yes. But mark as Draft and complete before requesting review.

## 📞 Getting Help

**Template questions:**

- Check this README
- See `.github/PR_GUIDELINES.md`
- Ask in GitHub Discussions
- Tag maintainer in PR

**Technical questions:**

- Check `CLAUDE.md` for development patterns
- See `README.md` for project overview
- Check existing PRs for examples
- Ask in team chat

**Urgent hotfix assistance:**

- Contact team lead immediately
- Don't deploy without review
- Use hotfix template completely
- Document everything

## 🎯 Success Criteria

A good PR:

- ✅ Uses appropriate template
- ✅ All sections completed (or marked N/A with reason)
- ✅ Changelog entry is user-focused
- ✅ Tests pass and cover changes
- ✅ Documentation updated
- ✅ No secrets committed
- ✅ Self-reviewed before submitting
- ✅ CI checks pass

A good hotfix PR also:

- ✅ Rollback plan tested
- ✅ Root cause documented
- ✅ Monitoring plan defined
- ✅ Communication plan ready
- ✅ Risk assessment complete

## 🔄 Template Updates

**This documentation:**

- Last updated: January 2025
- Maintained by: DevOps team
- Feedback: Create issue with "documentation" label

**To suggest template improvements:**

1. Open GitHub issue
2. Label: "template-improvement"
3. Describe the improvement
4. Or create PR with changes

---

**Remember:** Good PR descriptions make reviews faster and deployments safer! 🚀
