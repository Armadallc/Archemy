#!/bin/bash
# Script to fetch calendar layout/grid files from full-calendar repo

REPO_BASE="https://raw.githubusercontent.com/yassir-jeraidi/full-calendar/main"
OUTPUT_DIR="client/src/components/bentobox-calendar/layouts/full-calendar"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Files to fetch
declare -a FILES=(
    "src/modules/components/calendar/calendar-body.tsx"
    "src/modules/components/calendar/views/week-view.tsx"
    "src/modules/components/calendar/views/day-view.tsx"
    "src/modules/components/calendar/views/month-view.tsx"
    "src/modules/components/calendar/helpers.ts"
    "src/modules/components/calendar/hooks.ts"
    "src/modules/components/calendar/types.ts"
)

echo "📥 Fetching calendar layout files from full-calendar repo..."
echo ""

SUCCESS=0
FAILED=0

for FILE in "${FILES[@]}"; do
    FILENAME=$(basename "$FILE")
    URL="$REPO_BASE/$FILE"
    OUTPUT="$OUTPUT_DIR/$FILENAME"
    
    echo "Fetching: $FILENAME"
    
    if curl -L -k -s -o "$OUTPUT" "$URL" 2>/dev/null && [ -s "$OUTPUT" ]; then
        echo "  ✅ Saved to: $OUTPUT"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ❌ Failed to fetch"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully fetched: $SUCCESS files"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED files"
    echo ""
    echo "Manual download:"
    echo "1. Visit: https://github.com/yassir-jeraidi/full-calendar"
    echo "2. Navigate to each file"
    echo "3. Copy to: $OUTPUT_DIR"
fi
echo ""
echo "📁 Files saved to: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Review fetched files"
echo "2. Extract layout/grid structure"
echo "3. Create adapter components"
echo "4. Integrate with BentoBoxGanttView"




