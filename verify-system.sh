#!/bin/bash

# System Health Verification Script
# Run this before making any changes to ensure system stability

echo "🚀 System Health Check Starting..."
echo "=================================="

# Check if server is running
echo "🔍 Checking server status..."
if ! curl -s http://localhost:5000/api/auth/user >/dev/null 2>&1; then
    echo "❌ Server not responding on port 5000"
    echo "   Start server with: npm run dev"
    exit 1
else
    echo "✅ Server is running"
fi

# Test critical API endpoints
echo ""
echo "🔍 Testing API endpoints..."

SUPER_ADMIN_TOKEN="super_admin_development_token_monarch_2024"
PROGRAM="monarch_competency"
CORPORATE_CLIENT="monarch"

# Test clients endpoint
echo "  Testing clients endpoint..."
CLIENT_STATUS=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    http://localhost:5000/api/clients/program/$PROGRAM -o /dev/null)

if [ "$CLIENT_STATUS" = "200" ]; then
    echo "  ✅ Clients API: $CLIENT_STATUS"
else
    echo "  ❌ Clients API: $CLIENT_STATUS"
fi

# Test drivers endpoint  
echo "  Testing drivers endpoint..."
DRIVER_STATUS=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    http://localhost:5000/api/drivers/program/$PROGRAM -o /dev/null)

if [ "$DRIVER_STATUS" = "200" ]; then
    echo "  ✅ Drivers API: $DRIVER_STATUS"
else
    echo "  ❌ Drivers API: $DRIVER_STATUS"
fi

# Test trips endpoint
echo "  Testing trips endpoint..."
TRIP_STATUS=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    http://localhost:5000/api/trips/program/$PROGRAM -o /dev/null)

if [ "$TRIP_STATUS" = "200" ]; then
    echo "  ✅ Trips API: $TRIP_STATUS"
else
    echo "  ❌ Trips API: $TRIP_STATUS"
fi

# Test program endpoint
echo "  Testing program endpoint..."  
PROGRAM_STATUS=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    http://localhost:5000/api/programs/$PROGRAM -o /dev/null)

if [ "$PROGRAM_STATUS" = "200" ]; then
    echo "  ✅ Program API: $PROGRAM_STATUS"
else
    echo "  ❌ Program API: $PROGRAM_STATUS"
fi

echo ""
echo "📊 Health Check Summary:"
echo "=================================="

if [ "$CLIENT_STATUS" = "200" ] && [ "$DRIVER_STATUS" = "200" ] && [ "$TRIP_STATUS" = "200" ] && [ "$PROGRAM_STATUS" = "200" ]; then
    echo "🎉 All critical endpoints working!"
    echo "✅ System is stable - safe to proceed with changes"
    echo ""
    echo "💡 Remember to:"
    echo "   - Test immediately after each change"
    echo "   - Verify login still works"
    echo "   - Check dashboard loads properly"
    exit 0
else
    echo "⚠️  Some endpoints failing - DO NOT make changes"
    echo "❌ Fix these issues before proceeding"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check server logs for errors"
    echo "   - Verify database connection"  
    echo "   - Ensure authentication is working"
    exit 1
fi