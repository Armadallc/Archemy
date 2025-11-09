# GitHub Branch Protection Setup Guide

> **⚠️ IMPORTANT:** This guide is for GitHub Organizations only.
> 
> **For personal accounts with private repos**, see: [`.github/MANUAL_BRANCH_PROTECTION.md`](./MANUAL_BRANCH_PROTECTION.md)
> 
> Branch protection rules are only available for:
> - Public repos (personal or organization)
> - Private repos in GitHub Organizations
> - Private repos with GitHub Team/Enterprise plans

---

This document provides exact settings to apply in GitHub UI for protecting `main` and `develop` branches (organization accounts only).

---

## How to Apply Branch Protection Rules

1. Navigate to: **Settings → Branches**
2. Click **"Add rule"** or **"Edit"** next to existing rules
3. Apply settings below for each branch

---

## Branch Protection Rule: `main` (Production)

### Basic Settings

**Branch name pattern:** `main`

### Protection Settings

✅ **Require a pull request before merging**
- Required number of approvals: **1** (or 2 for stricter policy)
- Dismiss stale pull request approvals when new commits are pushed: ✅ **Enabled**
- Require review from Code Owners: ✅ **Enabled** (if you want CODEOWNERS enforced)
- Restrict who can dismiss pull request reviews: (optional)

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging: ✅ **Enabled**
- Status checks required (select these):
  - `CI` (from `.github/workflows/ci.yml`)
  - `Semgrep (Code Scanning)` (from `.github/workflows/semgrep.yml`)
  - `Gitleaks (Secret Scanning)` (from `.github/workflows/gitleaks.yml`)

✅ **Require conversation resolution before merging**: ✅ **Enabled**

✅ **Require signed commits**: (Optional - only enable if you use signed commits)

✅ **Require linear history**: (Optional - creates a cleaner history)

### Restriction Settings

✅ **Restrict who can push to matching branches**
- ✅ **Enabled**
- Add your username/maintainer accounts only (prevents direct pushes)

✅ **Do not allow bypassing the above settings**: ✅ **Enabled**
- Even admins must follow these rules

---

## Branch Protection Rule: `develop` (Integration)

### Basic Settings

**Branch name pattern:** `develop`

### Protection Settings

✅ **Require a pull request before merging**
- Required number of approvals: **0** or **1** (0 allows fast iteration; 1 is safer)
- Dismiss stale pull request approvals when new commits are pushed: ✅ **Enabled**
- Require review from Code Owners: (Optional for develop)

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging: ✅ **Enabled**
- Status checks required:
  - `CI` (from `.github/workflows/ci.yml`)
  - `Semgrep (Code Scanning)` (from `.github/workflows/semgrep.yml`)
  - `Gitleaks (Secret Scanning)` (from `.github/workflows/gitleaks.yml`)

✅ **Require conversation resolution before merging**: ✅ **Enabled** (or optional for develop)

✅ **Require signed commits**: (Optional)

### Restriction Settings

✅ **Restrict who can push to matching branches**
- ✅ **Enabled** (or optional for develop if you want faster workflow)
- Add maintainer accounts

✅ **Do not allow bypassing the above settings**: (Optional for develop)

---

## Additional Repository Settings

### General Settings → Default Branch
- Set default branch to `develop` (if using GitFlow) or `main` (if using GitHub Flow)

### General Settings → Pull Requests
- ✅ **Allow merge commits** (or squash/rebase based on your preference)
- ✅ **Allow squash merging**
- ✅ **Allow rebase merging**

### General Settings → Rules → Rulesets (if available on your plan)
- Consider creating rulesets for additional automation

---

## Quick Reference Checklist

For **main** branch:
- [ ] Require PR with 1-2 approvals
- [ ] Require status checks: CI, Semgrep, Gitleaks
- [ ] Require conversation resolution
- [ ] Restrict who can push (maintainers only)
- [ ] Do not allow bypassing

For **develop** branch:
- [ ] Require PR with 0-1 approvals (faster iteration)
- [ ] Require status checks: CI, Semgrep, Gitleaks
- [ ] Restrict who can push (or optional for faster workflow)
- [ ] Do not allow bypassing (optional)

---

## Notes

- **Status checks** won't appear until workflows run at least once. After first PR/commit, refresh the branch protection page to see available checks.
- **CODEOWNERS enforcement** only works if CODEOWNERS file is present (already added: `.github/CODEOWNERS`)
- These settings prevent force-pushing and deletion of protected branches
- Even with bypass disabled, you can still use `--no-verify` locally (though CI will catch issues)

---

## Security Best Practices

1. **Never disable protections** for "quick fixes" - use proper PR process
2. **Review CODEOWNERS** periodically to ensure correct maintainers
3. **Monitor failed status checks** - fix or adjust workflows if needed
4. **Keep 2FA enabled** for all collaborators (enforce in org settings if applicable)

---

*Last Updated: $(date)*



