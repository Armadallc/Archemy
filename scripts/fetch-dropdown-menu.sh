#!/bin/bash
# Script to fetch dropdown-menu.tsx from full-calendar repo

REPO_URL="https://raw.githubusercontent.com/yassir-jeraidi/full-calendar/main/src/components/ui/dropdown-menu.tsx"
OUTPUT_FILE="client/src/components/ui/dropdown-menu-full-calendar.tsx"

echo "Fetching dropdown-menu.tsx from full-calendar repo..."
curl -L -o "$OUTPUT_FILE" "$REPO_URL"

if [ $? -eq 0 ]; then
    echo "✅ Successfully fetched dropdown-menu.tsx"
    echo "📁 Saved to: $OUTPUT_FILE"
    echo ""
    echo "Next steps:"
    echo "1. Review the file: $OUTPUT_FILE"
    echo "2. Compare with existing: client/src/components/ui/dropdown-menu.tsx"
    echo "3. Replace or merge as needed"
else
    echo "❌ Failed to fetch file"
    exit 1
fi


