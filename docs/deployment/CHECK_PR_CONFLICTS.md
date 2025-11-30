# How to Check for Merge Conflicts in GitHub PR

## Where to Look for Conflicts

### 1. On the PR Page (GitHub Web Interface)

**Location:** Your PR page on GitHub

**What to look for:**
- **Yellow/Orange banner** at the top saying "This branch has conflicts that must be resolved"
- **"Resolve conflicts" button** (if conflicts exist)
- **Files changed** tab - conflicted files will show conflict markers

**Steps:**
1. Go to your PR: https://github.com/Armadallc/HALCYON/pulls
2. Click on your PR
3. Look for:
   - Banner at top indicating conflicts
   - "Resolve conflicts" button
   - In "Files changed" tab, look for files with conflict markers like:
     ```
     <<<<<<< feature/consistent-typography-headers
     your changes
     =======
     main branch changes
     >>>>>>> main
     ```

### 2. Check PR Status

**On the PR page, look for:**
- **Merge status** (top right): Shows if it can be merged
- **Checks** section: Shows if CI/CD passed
- **Files changed** tab: Lists all changed files

### 3. Common Conflict Locations

For this PR, conflicts might be in:
- `package.json` - if main has different scripts
- `vercel.json` - if main has different config
- Any files that were modified in both branches

---

## If Conflicts Exist

### Option 1: Resolve in GitHub (Simple conflicts)
1. Click **"Resolve conflicts"** button on PR page
2. GitHub will show conflicted files
3. Edit each file to resolve conflicts
4. Mark as resolved
5. Click **"Commit merge"**

### Option 2: Resolve Locally (Complex conflicts)
1. Checkout your branch locally
2. Merge main into your branch
3. Resolve conflicts
4. Push the resolved branch

---

## Quick Check Commands

Run these locally to check for conflicts:

```bash
# Fetch latest main
git fetch origin main

# Check what would conflict
git merge --no-commit --no-ff origin/main

# If conflicts, abort and resolve
git merge --abort
```

---

**Next Steps:**
1. Check your PR page for conflict indicators
2. If conflicts exist, we can resolve them
3. If no conflicts, you can merge the PR!

