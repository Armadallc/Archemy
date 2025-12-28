#!/bin/bash
# Script to fetch the actual calendar view files from full-calendar repo

REPO_BASE="https://raw.githubusercontent.com/yassir-jeraidi/full-calendar/main"
OUTPUT_DIR="client/src/components/bentobox-calendar/layouts/full-calendar/views"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Actual view files based on calendar-body.tsx imports
declare -a FILES=(
    "src/modules/components/calendar/views/week-and-day-view/calendar-week-view.tsx"
    "src/modules/components/calendar/views/week-and-day-view/calendar-day-view.tsx"
    "src/modules/components/calendar/views/month-view/calendar-month-view.tsx"
    "src/modules/components/calendar/views/year-view/calendar-year-view.tsx"
    "src/modules/components/calendar/views/agenda-view/agenda-events.tsx"
)

echo "📥 Fetching actual calendar view files from full-calendar repo..."
echo ""

SUCCESS=0
FAILED=0

for FILE in "${FILES[@]}"; do
    FILENAME=$(basename "$FILE")
    URL="$REPO_BASE/$FILE"
    OUTPUT="$OUTPUT_DIR/$FILENAME"
    
    echo "Fetching: $FILENAME"
    
    if curl -L -k -s -o "$OUTPUT" "$URL" 2>/dev/null && [ -s "$OUTPUT" ] && ! grep -q "404: Not Found" "$OUTPUT" 2>/dev/null; then
        echo "  ✅ Saved to: $OUTPUT"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ❌ Failed to fetch"
        FAILED=$((FAILED + 1))
        rm -f "$OUTPUT" 2>/dev/null
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully fetched: $SUCCESS files"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED files"
fi
echo ""
echo "📁 Files saved to: $OUTPUT_DIR"


