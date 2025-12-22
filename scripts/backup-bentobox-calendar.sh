#!/bin/bash

# Backup script for BentoBox calendar before full-calendar integration
# Usage: ./scripts/backup-bentobox-calendar.sh

set -e

echo "🔄 Creating backup of BentoBox calendar state..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BACKUP_BRANCH="backup/bentobox-calendar-pre-integration-$(date +%Y%m%d-%H%M%S)"

echo "📦 Current branch: $CURRENT_BRANCH"
echo "💾 Backup branch: $BACKUP_BRANCH"

# Create backup branch
git checkout -b "$BACKUP_BRANCH"

# Stage all changes
git add -A

# Create commit
git commit -m "Backup: BentoBox calendar state before full-calendar integration

- All current calendar features preserved
- Color palette documented
- Feature flags ready
- Rollback plan in place"

# Push backup branch
git push origin "$BACKUP_BRANCH"

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "✅ Backup created successfully!"
echo "📝 Backup branch: $BACKUP_BRANCH"
echo "🔄 Returned to: $CURRENT_BRANCH"
echo ""
echo "To restore this backup:"
echo "  git checkout $BACKUP_BRANCH"

