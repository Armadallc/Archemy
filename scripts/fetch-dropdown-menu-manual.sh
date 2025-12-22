#!/bin/bash
# Manual script to fetch dropdown-menu from full-calendar repo
# Run this script manually in your terminal

REPO_URL="https://raw.githubusercontent.com/yassir-jeraidi/full-calendar/main/src/components/ui/dropdown-menu.tsx"
OUTPUT_FILE="client/src/components/ui/dropdown-menu-full-calendar.tsx"

echo "📥 Fetching dropdown-menu.tsx from full-calendar repo..."
echo "URL: $REPO_URL"
echo ""

# Try with curl first (with insecure flag if needed)
if command -v curl &> /dev/null; then
    curl -L -k -o "$OUTPUT_FILE" "$REPO_URL" 2>&1
    if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
        echo "✅ Successfully fetched using curl"
    else
        echo "⚠️  Curl failed, trying wget..."
        if command -v wget &> /dev/null; then
            wget --no-check-certificate -O "$OUTPUT_FILE" "$REPO_URL" 2>&1
            if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
                echo "✅ Successfully fetched using wget"
            else
                echo "❌ Both curl and wget failed"
                echo ""
                echo "Please manually:"
                echo "1. Open: $REPO_URL"
                echo "2. Copy the content"
                echo "3. Save to: $OUTPUT_FILE"
                exit 1
            fi
        else
            echo "❌ Neither curl nor wget available"
            echo ""
            echo "Please manually:"
            echo "1. Open: $REPO_URL"
            echo "2. Copy the content"
            echo "3. Save to: $OUTPUT_FILE"
            exit 1
        fi
    fi
else
    echo "❌ curl not available"
    exit 1
fi

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    echo ""
    echo "📁 File saved to: $OUTPUT_FILE"
    echo "📊 File size: $(wc -l < "$OUTPUT_FILE") lines"
    echo ""
    echo "Next steps:"
    echo "1. Review: $OUTPUT_FILE"
    echo "2. Compare with: client/src/components/ui/dropdown-menu.tsx"
    echo "3. Replace or merge as needed"
    echo ""
    echo "To compare:"
    echo "  diff client/src/components/ui/dropdown-menu.tsx $OUTPUT_FILE"
else
    echo "❌ File not created or is empty"
    exit 1
fi

