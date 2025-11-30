#!/bin/bash

# Calendar Migration Rollback Script
# Usage: ./scripts/rollback-calendar.sh

echo "🔄 Rolling back calendar changes..."

# Restore from backup files
if [ -f "client/src/components/EnhancedTripCalendar.tsx.backup" ]; then
    echo "✅ Restoring EnhancedTripCalendar.tsx from backup..."
    cp client/src/components/EnhancedTripCalendar.tsx.backup client/src/components/EnhancedTripCalendar.tsx
else
    echo "⚠️  Backup file not found. Using git checkout..."
    git checkout HEAD -- client/src/components/EnhancedTripCalendar.tsx
fi

if [ -f "client/src/pages/calendar.tsx.backup" ]; then
    echo "✅ Restoring calendar.tsx from backup..."
    cp client/src/pages/calendar.tsx.backup client/src/pages/calendar.tsx
else
    echo "⚠️  Backup file not found. Using git checkout..."
    git checkout HEAD -- client/src/pages/calendar.tsx
fi

echo ""
echo "✅ Rollback complete!"
echo ""
echo "Next steps:"
echo "1. Test the calendar page: http://localhost:5173/calendar"
echo "2. Verify all functionality works"
echo "3. Check for any console errors"
echo ""

