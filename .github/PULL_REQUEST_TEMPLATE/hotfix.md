<!--
==================================================================================
🚨 HOTFIX Pull Request Template
==================================================================================
Use this template for critical production issues that need immediate deployment.

IMPORTANT:
- Hotfixes go directly to main branch
- Require thorough testing despite urgency
- Need clear rollback plan
- Require post-deployment monitoring

For detailed hotfix process, see: .github/PR_GUIDELINES.md#hotfix-process
==================================================================================
-->

## 🚨 Hotfix Summary

### Issue Being Fixed
<!-- Brief description of the critical issue -->

### Severity Level
<!-- Select one -->
- [ ] **Critical** - Production down, data loss, security breach
- [ ] **High** - Major functionality broken, significant user impact
- [ ] **Medium** - Important bug, limited user impact

### User Impact
<!-- Who is affected and how? -->
**Affected Users:**
**Impact:**
**Estimated Downtime:**

## 🔍 Root Cause Analysis

### What Went Wrong
<!-- Technical explanation of the issue -->

### How It Happened
<!-- When was this introduced? Which commit/PR? -->
- Introduced in:
- Deployed on:
- Detected on:
- Time to detection:

### Why It Wasn't Caught Earlier
<!-- Why didn't tests catch this? -->
- [ ] No test coverage for this scenario
- [ ] Test gap identified (will add tests)
- [ ] Environmental difference (dev vs prod)
- [ ] Race condition/timing issue
- [ ] External service change
- [ ] Other:

## 🔧 The Fix

### What Changed (Technical)
<!-- Precise technical description of the fix -->

### What Changed (User Perspective)
<!-- User-facing description for changelog -->

### Why This Approach
<!-- Why this fix instead of alternatives? -->

## 📝 Changelog Entry

```markdown
### Fixed
- [HOTFIX] Your user-focused fix description here
```

## ✅ Verification

### Testing Performed
<!-- All testing done before deployment -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing in development
- [ ] Manual testing in staging (if available)
- [ ] Smoke tests prepared for production

### Test Scenarios Covered

```text
1. Scenario that triggered the bug...
2. Related scenarios that could be affected...
3. Edge cases...
```

### Performance Impact

- [ ] No performance impact
- [ ] Performance impact assessed:

## 🎯 Deployment Plan

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed by at least one other developer
- [ ] Rollback plan documented and tested
- [ ] Monitoring plan ready
- [ ] Communication plan ready
- [ ] Backup of current state taken

### Deployment Steps

```bash
1. Command or action...
2. Command or action...
3. Command or action...
```

### Immediate Post-Deployment Verification

```bash
# Commands to verify fix is working
1. curl ...
2. Check logs...
3. Monitor metrics...
```

### Expected Behavior After Deploy
<!-- What should we see if deployment is successful? -->
1.
2.
3.

## 🔄 Rollback Plan

### When to Rollback
<!-- What indicators mean we should rollback? -->
- [ ] Error rate increases
- [ ] Response time degrades
- [ ] New errors appear in logs
- [ ] User reports of issues
- [ ] Other:

### Rollback Steps
<!-- Tested procedure to rollback -->
```bash
1. git revert <commit-hash>
2. Deploy previous version...
3. Verify rollback successful...
```

### Rollback Testing

- [ ] Rollback procedure tested in development
- [ ] Rollback procedure tested in staging
- [ ] Rollback takes < 5 minutes
- [ ] Rollback verified to work

## 🎯 Risk Assessment

### What Could Go Wrong
<!-- Honest assessment of risks -->
1. **Risk:**
   **Likelihood:** High/Medium/Low
   **Impact:** High/Medium/Low
   **Mitigation:**

2. **Risk:**
   **Likelihood:**
   **Impact:**
   **Mitigation:**

### Dependencies
<!-- What else could this affect? -->
- [ ] No dependencies on other services
- [ ] Affects these services:

### Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe and provide migration):

## 📊 Monitoring Plan

### Metrics to Watch
<!-- What to monitor after deployment -->
- [ ] Error rate (target: < X%)
- [ ] Response time (target: < Xms)
- [ ] CAPTCHA solve rate
- [ ] Browser automation success rate
- [ ] API endpoint availability
- [ ] Memory/CPU usage
- [ ] Other:

### Monitoring Duration
<!-- How long to actively monitor after deploy? -->
- First 15 minutes: Active monitoring
- First hour: Regular checks
- First 24 hours: Alert monitoring

### Alert Thresholds

```text
Error rate > X% → Investigate immediately
Response time > Xms → Investigate
CPU/Memory > X% → Investigate
```

### Monitoring Tools

- [ ] Sentry error tracking
- [ ] Application logs (Pino)
- [ ] Server metrics
- [ ] Browser automation logs
- [ ] CAPTCHA service status

## 📢 Communication Plan

### Who Needs to Know
<!-- Stakeholders to notify -->
- [ ] Team members
- [ ] Project manager
- [ ] Users (if user-facing)
- [ ] Support team
- [ ] Other:

### Communication Timeline

- **Before deployment:**
- **During deployment:**
- **After deployment:**

### Status Update Template

```markdown
**Status:** Deploying hotfix
**Issue:** Brief description
**Fix:** Brief description
**ETA:** X minutes
**Impact:** Who/what is affected
```

## 🔍 Browser Automation Specific
<!-- Only if hotfix affects Playwright/browser automation -->

### CAPTCHA Impact

- [ ] No impact on CAPTCHA solving
- [ ] CAPTCHA handling changed:
- [ ] 2Captcha service tested
- [ ] CAPTCHA solve rate monitored

### Browser Detection

- [ ] No impact on anti-detection
- [ ] Anti-detection measures tested
- [ ] rebrowser-patches still effective

## 🔒 Security

### Security Implications

- [ ] No security implications
- [ ] Security impact assessed:
- [ ] No new vulnerabilities introduced
- [ ] Security team notified (if applicable)

### Sensitive Data

- [ ] No sensitive data handling changes
- [ ] Sensitive data handling verified:
- [ ] Logs don't contain secrets
- [ ] Cookies/tokens properly handled

## 📚 Documentation Updates

- [ ] CHANGELOG.md updated (mark as HOTFIX)
- [ ] README.md updated if needed
- [ ] Post-mortem document created
- [ ] Runbook updated
- [ ] Tests added to prevent regression

## 🎓 Lessons Learned

### What We'll Do Differently
<!-- Quick notes for post-mortem -->
1.
2.
3.

### Tests to Add
<!-- What tests would have caught this? -->
1.
2.

### Monitoring to Add
<!-- What monitoring would have detected this sooner? -->
1.
2.

## ✅ Hotfix Checklist

### Pre-Deployment

- [ ] Issue severity confirmed (Critical/High/Medium)
- [ ] Root cause identified and documented
- [ ] Fix implemented and tested
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Rollback plan tested
- [ ] Deployment steps documented
- [ ] Monitoring plan ready
- [ ] Communication plan ready
- [ ] Team notified of impending deployment

### During Deployment

- [ ] Backup taken
- [ ] Deployment executed per plan
- [ ] Immediate verification successful
- [ ] No errors in logs
- [ ] Metrics look normal
- [ ] Status communicated

### Post-Deployment (First Hour)

- [ ] Fix verified working
- [ ] No new errors
- [ ] Metrics stable
- [ ] Users notified (if applicable)
- [ ] Monitoring active
- [ ] Team updated on status

### Post-Deployment (24 Hours)

- [ ] No regressions detected
- [ ] Metrics stable
- [ ] Post-mortem scheduled
- [ ] Documentation updated
- [ ] Tests added to prevent regression

## 👀 Reviewer Notes

### Critical Review Points
<!-- What reviewers must verify -->
1. Rollback plan is viable and tested
2. Fix addresses root cause, not just symptoms
3. Monitoring plan is comprehensive
4. No new risks introduced
5. Communication plan covers all stakeholders

### Fast-Track Approval
<!-- For critical issues only -->
- [ ] This is production-down critical
- [ ] Standard review process applies
- [ ] Expedited review requested (reason):

---

## ⚠️ Remember

- **Test the rollback plan** - Not just the fix
- **Monitor closely** - First hour is critical
- **Communicate clearly** - Keep stakeholders informed
- **Document learnings** - Update tests and monitoring
- **Stay calm** - Rushed fixes often create new issues

<!--
==================================================================================
Hotfix deployment is stressful - take time to verify everything!
==================================================================================
-->
