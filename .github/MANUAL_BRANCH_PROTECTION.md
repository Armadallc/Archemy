# Manual Branch Protection Guide (Personal Account)

**Note:** Branch protection rules require a GitHub organization account. For personal accounts with private repos, use these manual processes to protect your branches.

---

## 🔒 Protection Strategy for Personal Account

Since GitHub branch protection isn't available for personal private repos, we'll use:

1. **Git hooks** (pre-push, pre-commit)
2. **Documented workflows** (manual PR process)
3. **Git aliases** (safe merge commands)
4. **Team discipline** (code review checklist)

---

## 📋 Manual Protection Rules for `main` Branch

### Rule 1: NEVER Push Directly to `main`

**Enforced by:** Pre-push hook (see `.git/hooks/pre-push`)

```bash
# ❌ NEVER do this:
git checkout main
git push origin main

# ✅ ALWAYS do this:
git checkout develop
git push origin develop
# Then create PR: develop → main
```

### Rule 2: Always Use Pull Requests

**Workflow:**
1. Make changes on `develop` branch
2. Push to `develop`
3. Create PR: `develop` → `main` on GitHub
4. Review PR (self-review or have collaborator review)
5. Merge PR on GitHub (don't merge locally and push)

### Rule 3: Required Checks Before Merging to `main`

**Before merging `develop` → `main`, verify:**

- [ ] All CI checks pass (if GitHub Actions is set up)
- [ ] Code has been reviewed
- [ ] No secrets in code (Gitleaks check passed locally)
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Breaking changes documented

### Rule 4: Never Force-Push to `main`

**Protected by:** Git hooks and manual discipline

```bash
# ❌ NEVER:
git push --force origin main

# ✅ If needed (emergency only):
# Create a revert commit instead
```

---

## 🛠️ Git Hooks Setup

### Pre-Push Hook (Prevents Direct Pushes to `main`)

Create `.git/hooks/pre-push`:

```bash
#!/bin/bash

# Get the branch being pushed
protected_branch='main'

while read local_ref local_sha remote_ref remote_sha
do
    if [[ "$remote_ref" == "refs/heads/$protected_branch" ]]; then
        echo "❌ ERROR: You cannot push directly to '$protected_branch' branch."
        echo "   Please create a pull request from 'develop' → 'main' instead."
        exit 1
    fi
done

exit 0
```

**To enable:**
```bash
chmod +x .git/hooks/pre-push
```

### Pre-Commit Hook (Already exists)

The existing `.git/hooks/pre-commit` already checks for:
- Protected files (requires APPROVED: prefix)
- Gitleaks (secret scanning)
- Basic validation

---

## 📝 Git Aliases for Safe Workflow

Add these to your `~/.gitconfig`:

```gitconfig
[alias]
    # Safe merge from develop to main (creates merge commit, doesn't push)
    merge-main = "!f() { \
        git checkout main && \
        git merge develop --no-ff -m 'Merge develop into main' && \
        echo '✅ Merged develop → main locally. Now create PR on GitHub to push.'; \
    }; f"
    
    # Check what would be merged
    preview-main-merge = "!f() { \
        git log main..develop --oneline; \
    }; f"
    
    # Create a release commit on main (after PR merge)
    release-commit = "!f() { \
        git checkout main && \
        git pull origin main && \
        git tag -a \"v$1\" -m \"Release version $1\" && \
        git push origin main --tags; \
    }; f"
```

**Usage:**
```bash
# Preview what would be merged
git preview-main-merge

# Merge locally (then create PR on GitHub)
git merge-main
```

---

## 🔄 Standard Workflow

### Daily Development (on `develop`)

```bash
# Work on develop branch
git checkout develop
git pull origin develop

# Make changes, commit
git add .
git commit -m "feat: your feature"
git push origin develop
```

### Releasing to `main` (via PR)

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Preview what will be merged
git preview-main-merge  # (if alias set up)

# 3. Create PR on GitHub: develop → main
#    - Go to GitHub
#    - Click "New Pull Request"
#    - Select: base: main ← compare: develop
#    - Review changes
#    - Merge PR on GitHub

# 4. After PR is merged, update local main
git checkout main
git pull origin main
```

---

## 🚨 Emergency Procedures

### If You Need to Hotfix `main` Directly

**Only in emergencies, and revert with a follow-up PR:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-name

# 2. Make fix
git add .
git commit -m "fix: emergency hotfix"
git push origin hotfix/fix-name

# 3. Create PR: hotfix/fix-name → main
# 4. Merge PR on GitHub
# 5. Merge hotfix back to develop
git checkout develop
git merge hotfix/fix-name
git push origin develop
```

---

## ✅ Pre-Merge Checklist for `develop` → `main` PR

**Before merging a PR from `develop` to `main`:**

- [ ] All commits on `develop` are reviewed
- [ ] CI/CD checks pass (if applicable)
- [ ] No secrets detected (Gitleaks passed)
- [ ] Code follows project standards
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Migration scripts are tested (if any)
- [ ] Database changes are reviewed (if any)

---

## 👥 For Collaborators

**Share this document with all collaborators.**

**Rules for everyone:**
1. ✅ Work on feature branches or `develop`
2. ✅ Create PRs for all changes
3. ✅ Never push directly to `main`
4. ✅ Review PRs before merging
5. ✅ Use the checklist before merging to `main`

---

## 🔐 Security Best Practices

1. **Never commit secrets** (use environment variables)
2. **Run Gitleaks before committing** (`gitleaks protect --staged`)
3. **Review all PRs** before merging to `main`
4. **Use signed commits** (optional but recommended)
5. **Enable 2FA** on GitHub account

---

## 📊 Alternative: Upgrade to Organization

**If you want automated branch protection:**

- Create a GitHub Organization (free for public repos)
- Upgrade to GitHub Team ($4/user/month) for private repos
- Or use GitHub Enterprise (self-hosted)

**Benefits:**
- Automated branch protection rules
- Required status checks
- Required PR reviews
- CODEOWNERS enforcement

---

*This manual protection works well for small teams and personal projects. Consider upgrading to an organization when the team grows or when automation becomes critical.*

