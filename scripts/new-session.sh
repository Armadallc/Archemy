#!/bin/bash

# ============================================================================
# NEW SESSION INTENT SCRIPT
# Purpose: Force clear goal definition before starting coding
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

# Get current git commit hash
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Check if file already exists
if [ -f "$SESSION_FILE" ]; then
    echo -e "${YELLOW}📝 Session log for today already exists: $SESSION_FILE${NC}"
    echo -e "${BLUE}Opening existing file...${NC}"
    
    # Open existing file in default editor
    if command -v code >/dev/null 2>&1; then
        code "$SESSION_FILE"
    elif command -v nano >/dev/null 2>&1; then
        nano "$SESSION_FILE"
    elif command -v vim >/dev/null 2>&1; then
        vim "$SESSION_FILE"
    else
        echo -e "${BLUE}File location: $SESSION_FILE${NC}"
    fi
    exit 0
fi

# Create new session file
cat > "$SESSION_FILE" << EOF
# Development Session - $TODAY

## 🎯 Today's Single Focus:
[One sentence - what's the ONE thing I'm building today?]

## 🔨 Specific Tasks:
- [ ] [Smallest testable increment]
- [ ] [Next smallest testable increment]
- [ ] [Next smallest testable increment]

## 🚫 Scope Guardrails (What I'm NOT Doing Today):
[List of tempting features that would distract from today's goal]
- Don't start [feature X]
- Don't refactor [system Y]
- Don't redesign [component Z]

## ⏰ Time Budget: [X] hours max
If I can't finish in [X] hours, this goal is too big. Break it smaller.

## 📸 Current State:
**Session Started:** $NOW
**Git Commit:** $CURRENT_COMMIT
**Branch:** $(git branch --show-current 2>/dev/null || echo "unknown")

## 🧪 Success Criteria:
[How will I know this is "done" today?]
- [ ] [Specific testable outcome]
- [ ] [Feature works in dev environment]
- [ ] [No console errors]

---
## 📝 SESSION LOG (update as you work):

### $NOW - Started
[What you're beginning with]

### [Timestamp] - Progress Update
[What's working, what's not]

### [Timestamp] - Completed
[What you finished]

---
## 📋 COMPLETION SUMMARY:
[Fill this out at end of session]

### ✅ What was completed:
- 

### ⚠️ What's partially done:
- 

### ❌ What broke or needs fixing:
- 

### 💡 Key learnings:
- 

### 🎯 Next session priority:
- 

EOF

echo -e "${GREEN}✅ Created session log: $SESSION_FILE${NC}"
echo -e "${BLUE}📝 Opening in editor...${NC}"

# Open file in default editor
if command -v code >/dev/null 2>&1; then
    code "$SESSION_FILE"
elif command -v nano >/dev/null 2>&1; then
    nano "$SESSION_FILE"
elif command -v vim >/dev/null 2>&1; then
    vim "$SESSION_FILE"
else
    echo -e "${BLUE}📝 Please edit: $SESSION_FILE${NC}"
fi
