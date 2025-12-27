#!/bin/bash

# Deployment Script for Trip Tracking & Location Features
# Run this script to commit and prepare for deployment

set -e

echo "🚀 Starting deployment preparation..."

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Add all new files
echo "📦 Adding new files..."
git add migrations/0053_add_trip_mileage_tracking.sql
git add migrations/0054_add_trip_id_to_driver_locations.sql
git add server/services/mileage-service.ts
git add mobile/services/locationTracking.ts
git add DEPLOYMENT_CHECKLIST.md

# Add modified files
echo "📝 Adding modified files..."
git add client/src/components/dashboard/InteractiveMapWidget.tsx
git add client/src/components/EnhancedTripCalendar.tsx
git add client/src/components/booking/quick-add-location.tsx
git add client/src/components/booking/simple-booking-form.tsx
git add server/enhanced-trips-storage.ts
git add server/mobile-api.ts
git add server/routes/mobile.ts
git add server/routes/legacy.ts
git add mobile/app.json
git add mobile/app/\(tabs\)/trip-details.tsx
git add mobile/app/\(tabs\)/profile.tsx
git add mobile/contexts/AuthContext.tsx
git add mobile/services/api.ts
git add mobile/services/websocket.ts

# Check status
echo "📊 Git status:"
git status --short

# Commit
echo "💾 Committing changes..."
git commit -m "APPROVED: feat: Add trip mileage tracking and location tracking features

- Add pre-trip mileage estimation and post-trip actual mileage calculation
- Link location tracking to trips for accurate mileage tracking
- Real-time driver locations on fleet map with WebSocket updates
- Mobile app location tracking with trip linking
- Calendar scrollable trips enhancement
- Program scoping for frequent locations in trip creation

Database migrations required:
- migrations/0053_add_trip_mileage_tracking.sql
- migrations/0054_add_trip_id_to_driver_locations.sql"

echo "✅ Changes committed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the commit: git show HEAD"
echo "2. Merge to main: git checkout main && git merge $CURRENT_BRANCH"
echo "3. Push to main: git push origin main"
echo "4. Run database migrations on Render.com BEFORE deployment completes"
echo "5. See DEPLOYMENT_CHECKLIST.md for detailed instructions"

