#!/bin/bash

# ============================================================================
# END SESSION LOG SCRIPT
# Purpose: Capture what was accomplished before stopping work
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

# Create daily-logs directory if it doesn't exist
mkdir -p daily-logs

# Get current date and time
TODAY=$(date +%Y-%m-%d)
NOW=$(date '+%Y-%m-%d %H:%M:%S')
SESSION_FILE="daily-logs/$TODAY.md"
NEXT_SESSION_FILE="daily-logs/next-session.md"

echo -e "${CYAN}📝 Session Completion Log${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Interactive prompts
echo -e "${BLUE}What did you complete today? (separate multiple items with commas)${NC}"
read -r COMPLETED

echo -e "${BLUE}What's partially done? (optional - press Enter to skip)${NC}"
read -r PARTIAL

echo -e "${BLUE}Anything break or need fixing? (optional - press Enter to skip)${NC}"
read -r BROKEN

echo -e "${BLUE}Key learnings or gotchas? (optional - press Enter to skip)${NC}"
read -r LEARNINGS

echo -e "${BLUE}Next session priority?${NC}"
read -r NEXT_PRIORITY

# Get current git status
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')

# Append to today's session log
if [ -f "$SESSION_FILE" ]; then
    cat >> "$SESSION_FILE" << EOF

### $NOW - Session End

**Completed:** $COMPLETED
**Partially Done:** ${PARTIAL:-"None"}
**Issues:** ${BROKEN:-"None"}
**Learnings:** ${LEARNINGS:-"None"}

**Final Git State:**
- Commit: $CURRENT_COMMIT
- Branch: $CURRENT_BRANCH
- Uncommitted: $UNCOMMITTED_COUNT files

EOF
    echo -e "${GREEN}✅ Session log updated: $SESSION_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  No session log found for today${NC}"
fi

# Create next session file
cat > "$NEXT_SESSION_FILE" << EOF
# Next Session Handoff - $TODAY

## 🎯 Priority Focus:
$NEXT_PRIORITY

## 📸 Current State:
**Last Session Ended:** $NOW
**Git Commit:** $CURRENT_COMMIT
**Branch:** $CURRENT_BRANCH
**Uncommitted Changes:** $UNCOMMITTED_COUNT files

## 🔄 Where to Start:
1. Run: \`./scripts/morning-check.sh\`
2. Review uncommitted changes: \`git status\`
3. Continue from: $NEXT_PRIORITY

## 📋 Context from Last Session:
**Completed:** $COMPLETED
**Partially Done:** ${PARTIAL:-"None"}
**Issues to Address:** ${BROKEN:-"None"}
**Key Learnings:** ${LEARNINGS:-"None"}

EOF

echo -e "${GREEN}📋 Next session ready: $NEXT_SESSION_FILE${NC}"
echo ""
echo -e "${CYAN}🎯 Next session priority: $NEXT_PRIORITY${NC}"
echo -e "${BLUE}💡 Run \`./scripts/morning-check.sh\` to start next session${NC}"
