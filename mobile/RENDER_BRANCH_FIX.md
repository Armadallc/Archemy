# Render Branch Configuration Fix

## Issue
Render is watching the `main` branch, but the `build:web:prod` script fix is in `feature/unified-spa-layout` branch. Since `main` is protected, we need to either:

1. **Temporarily change Render to watch the feature branch** (Quick fix)
2. **Create a PR to merge the fix to main** (Proper workflow)

## Solution 1: Update Render to Watch Feature Branch (Quick)

1. Go to Render Dashboard → Your Static Site → Settings
2. Find **Branch** setting
3. Change from `main` to `feature/unified-spa-layout`
4. Click **Save Changes**
5. Render will automatically trigger a new deployment

## Solution 2: Create PR (Recommended)

1. The fix is already committed to `feature/unified-spa-layout`
2. Go to GitHub and create a PR: `feature/unified-spa-layout` → `main`
3. Merge the PR
4. Render will automatically detect the merge to `main` and deploy

## Verify the Fix is in Feature Branch

The commit `63c33cda` contains:
- Updated `build:web:prod` script in `mobile/package.json`
- Uses: `expo export --platform web --output-dir web-build`

This commit is in `feature/unified-spa-layout` branch.

