#!/bin/bash

# ============================================================================
# MORNING CHECK SCRIPT
# Purpose: Start each development session with situational awareness
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

echo -e "${CYAN}🌅 Development Session Starting${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Git status
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
LAST_COMMIT=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commits")
LAST_COMMIT_TIME=$(git log -1 --pretty=format:"%cr" 2>/dev/null || echo "unknown")

echo -e "${BLUE}📍 Current Branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}📝 Uncommitted Files:${NC} $UNCOMMITTED_COUNT files modified"
echo -e "${BLUE}🕐 Last Commit:${NC} \"$LAST_COMMIT\""
echo -e "${BLUE}📅 Committed:${NC} $LAST_COMMIT_TIME"
echo ""

# Check for today's session intent
TODAY=$(date +%Y-%m-%d)
INTENT_FILE="daily-logs/$TODAY.md"

if [ -f "$INTENT_FILE" ]; then
    echo -e "${PURPLE}🎯 TODAY'S PLANNED GOAL (from last session):${NC}"
    # Extract the goal line from the markdown file
    GOAL=$(grep -A 1 "## 🎯 Today's Single Focus:" "$INTENT_FILE" | tail -1 | sed 's/^\[ \] //' | sed 's/^- \[ \] //')
    if [ -n "$GOAL" ]; then
        echo -e "${PURPLE}→ $GOAL${NC}"
    else
        echo -e "${PURPLE}→ No specific goal found in today's log${NC}"
    fi
    echo ""
fi

# System status checks
echo -e "${GREEN}✅ System Status:${NC}"

# Check if dev server is running
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}   Dev Server: Running on port 8081${NC}"
else
    echo -e "${YELLOW}   Dev Server: Not running${NC}"
fi

# Check TypeScript compilation
echo -e "${BLUE}   Checking TypeScript compilation...${NC}"
if npm run check >/dev/null 2>&1; then
    echo -e "${GREEN}   TypeScript: No errors${NC}"
else
    echo -e "${RED}   TypeScript: Has errors${NC}"
fi

# Check database connection (Supabase)
echo -e "${BLUE}   Testing database connection...${NC}"
if curl -s http://localhost:8081/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}   Database: Connected to Supabase${NC}"
else
    echo -e "${YELLOW}   Database: Cannot reach API (server may not be running)${NC}"
fi

# Check for recent errors in logs (if any)
if [ -f "server/logs/error.log" ]; then
    RECENT_ERRORS=$(tail -5 "server/logs/error.log" | grep -c "ERROR" 2>/dev/null || echo "0")
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        echo -e "${RED}   Recent Errors: $RECENT_ERRORS errors in last 5 lines${NC}"
    else
        echo -e "${GREEN}   Recent Errors: None detected${NC}"
    fi
else
    echo -e "${BLUE}   Recent Errors: No error log found${NC}"
fi

echo ""
echo -e "${CYAN}🚀 Ready to start? Run: npm run dev${NC}"
echo -e "${CYAN}📝 Create session intent: ./scripts/new-session.sh${NC}"
