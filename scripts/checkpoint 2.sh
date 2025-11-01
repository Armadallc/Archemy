#!/bin/bash

# ============================================================================
# FEATURE CHECKPOINT SCRIPT
# Purpose: Create explicit "save points" when something works
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT" || exit 1

# Check if message provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Please provide a checkpoint description${NC}"
    echo -e "${BLUE}Usage: $0 \"Checkpoint description\"${NC}"
    exit 1
fi

CHECKPOINT_MESSAGE="$1"
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date '+%Y-%m-%d-%H%M')
TAG_NAME="checkpoint/$(echo "$CHECKPOINT_MESSAGE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')-$TIMESTAMP"

echo -e "${BLUE}🔍 Running health check...${NC}"

# Check TypeScript compilation
echo -e "${BLUE}   Checking TypeScript compilation...${NC}"
if npm run check >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}   ❌ TypeScript compilation failed${NC}"
    echo -e "${YELLOW}⚠️  Checkpoint not created due to compilation errors${NC}"
    echo -e "${BLUE}💡 Run \`npm run check\` to see errors${NC}"
    exit 1
fi

# Check if dev server can start (quick test)
echo -e "${BLUE}   Testing dev server startup...${NC}"
if timeout 10s npm run dev >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Dev server starts without errors${NC}"
else
    echo -e "${YELLOW}   ⚠️  Dev server test inconclusive (timeout)${NC}"
fi

# Check for obvious build issues
echo -e "${BLUE}   Checking for build issues...${NC}"
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Build successful${NC}"
else
    echo -e "${RED}   ❌ Build failed${NC}"
    echo -e "${YELLOW}⚠️  Checkpoint not created due to build errors${NC}"
    echo -e "${BLUE}💡 Run \`npm run build\` to see errors${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}💾 Creating checkpoint: \"$CHECKPOINT_MESSAGE\"${NC}"

# Stage all changes
git add .

# Create commit
git commit -m "💾 Checkpoint: $CHECKPOINT_MESSAGE"

# Create lightweight tag
git tag "$TAG_NAME"

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

echo -e "${GREEN}   📌 Git tag: $TAG_NAME${NC}"
echo -e "${GREEN}   ✅ Committed and tagged${NC}"
echo -e "${BLUE}   🔗 Commit: $COMMIT_HASH${NC}"

# Log checkpoint
CHECKPOINT_LOG="daily-logs/checkpoints.md"
mkdir -p daily-logs

if [ ! -f "$CHECKPOINT_LOG" ]; then
    cat > "$CHECKPOINT_LOG" << EOF
# Development Checkpoints

This file tracks major working milestones for easy rollback.

EOF
fi

cat >> "$CHECKPOINT_LOG" << EOF
## $TODAY - $CHECKPOINT_MESSAGE
- **Tag:** \`$TAG_NAME\`
- **Commit:** \`$COMMIT_HASH\`
- **Created:** $(date '+%Y-%m-%d %H:%M:%S')
- **Rollback:** \`git checkout $TAG_NAME\`

EOF

echo -e "${GREEN}📝 Checkpoint logged to: $CHECKPOINT_LOG${NC}"
echo ""
echo -e "${CYAN}🔄 To rollback to this point later:${NC}"
echo -e "${BLUE}   git checkout $TAG_NAME${NC}"
echo ""
echo -e "${GREEN}✅ Checkpoint created successfully!${NC}"
