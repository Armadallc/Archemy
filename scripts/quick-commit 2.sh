#!/bin/bash

# ============================================================================
# QUICK COMMIT SCRIPT
# Purpose: Make committing working increments effortless
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
    echo -e "${RED}❌ Please provide a commit message${NC}"
    echo -e "${BLUE}Usage: $0 \"Your commit message\"${NC}"
    echo -e "${BLUE}       $0 \"Your commit message\" --no-push${NC}"
    exit 1
fi

COMMIT_MESSAGE="$1"
NO_PUSH=false

# Check for --no-push flag
if [ "$2" = "--no-push" ]; then
    NO_PUSH=true
fi

# Check if there are changes to commit
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${BLUE}📝 Staging all changes...${NC}"
    git add .
    
    # Format commit message with checkmark
    if [[ ! "$COMMIT_MESSAGE" =~ ^✅ ]]; then
        COMMIT_MESSAGE="✅ $COMMIT_MESSAGE"
    fi
    
    echo -e "${BLUE}💾 Committing: \"$COMMIT_MESSAGE\"${NC}"
    git commit -m "$COMMIT_MESSAGE"
    
    # Get commit hash
    COMMIT_HASH=$(git rev-parse --short HEAD)
    
    echo -e "${GREEN}✅ Changes committed: \"$COMMIT_MESSAGE\"${NC}"
    echo -e "${BLUE}🔗 Commit: $COMMIT_HASH${NC}"
    
    # Push to current branch unless --no-push flag
    if [ "$NO_PUSH" = false ]; then
        CURRENT_BRANCH=$(git branch --show-current)
        echo -e "${BLUE}📤 Pushing to branch: $CURRENT_BRANCH${NC}"
        
        if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
            echo -e "${GREEN}✅ Pushed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Push failed (remote may not exist or no internet)${NC}"
            echo -e "${BLUE}💡 Changes are committed locally${NC}"
        fi
    else
        echo -e "${YELLOW}⏸️  Skipped push (--no-push flag)${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    echo -e "${BLUE}💡 Working directory is clean${NC}"
fi
