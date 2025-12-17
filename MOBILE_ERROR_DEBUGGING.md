# Mobile App Error Debugging Guide

## How to View Mobile App Errors

### 1. **Debug Screen (Built-in)**
The mobile app has a built-in debug screen that shows:
- **Logs Tab**: All application logs (DEBUG, INFO, WARN, ERROR)
- **Network Tab**: All API requests/responses with status codes and errors
- **Stats Tab**: Network statistics (success rate, failed requests, avg response time)

**To Access:**
1. Open the mobile app
2. Go to Menu tab
3. Tap "Debug" (or navigate to the debug screen)
4. View logs, network requests, and statistics

### 2. **Console Logs**
If running via Expo:
- Check the terminal where `npm start` is running
- Look for console.log, console.error, console.warn messages
- Errors are prefixed with emojis: 🚨 (ERROR), ⚠️ (WARN), 🔍 (DEBUG)

### 3. **ErrorBoundary**
The app has an ErrorBoundary that catches React errors:
- Shows a user-friendly error screen
- Logs detailed error information to console
- Includes stack traces in development mode

## Common Error Types

### API Errors
- **401 Unauthorized**: Authentication token expired or invalid
- **404 Not Found**: API endpoint doesn't exist
- **500 Internal Server Error**: Backend server error
- **Network Error**: Cannot reach backend server

### Data Errors
- **Trip date parsing errors**: Invalid date format
- **Theme color errors**: Missing color definitions
- **Missing data**: Expected fields not present in API response

### Authentication Errors
- **Login failed**: Invalid credentials
- **Token expired**: Need to re-login
- **Session expired**: User session no longer valid

## Enhanced Error Handling (Just Added)

### Home Screen
- ✅ Error state UI when trips fail to load
- ✅ Retry button to refetch data
- ✅ Detailed error logging with user context
- ✅ React Query error callbacks

### API Client
- ✅ Enhanced error messages with endpoint context
- ✅ Detailed error logging with timestamps
- ✅ Error details preserved in error objects

## How to Debug Specific Errors

### 1. **Check Debug Screen**
```
Menu → Debug → Logs Tab
```
Look for entries with:
- Level: ERROR 🚨
- Component: HomeScreen, ApiClient, etc.
- Metadata: Error details and context

### 2. **Check Network Tab**
```
Menu → Debug → Network Tab
```
Look for:
- Red entries (status >= 400)
- Error messages in response
- Failed requests

### 3. **Check Console**
In your terminal running Expo:
```bash
# Look for error patterns:
❌ [Home] Error fetching trips
🚨 ErrorBoundary caught an error
[ERROR] 🚨 [ApiClient] API request error
```

### 4. **Export Debug Data**
From Debug screen:
- Tap "Export" button
- Share the JSON data
- Contains all logs, network requests, and stats

## Error Logging Features

### Logger Service (`mobile/services/logger.ts`)
- Logs are stored in memory (last 1000 logs)
- Automatic emoji prefixes for visibility
- Component tagging for easier filtering
- Metadata support for context

### Network Inspector (`mobile/services/networkInspector.ts`)
- Intercepts all fetch requests
- Tracks request/response times
- Logs errors automatically
- Calculates success rates

## Common Issues and Solutions

### Issue: "API request failed: 401"
**Solution**: User needs to re-login. Token may have expired.

### Issue: "Failed to load trips"
**Solution**: 
1. Check if backend is running
2. Check API_BASE_URL in `mobile/services/api.ts`
3. Verify network connectivity
4. Check Debug → Network tab for specific error

### Issue: "Cannot read property of undefined"
**Solution**: 
1. Check ErrorBoundary for component stack
2. Look for missing data in API responses
3. Check theme colors are properly defined

### Issue: Network timeout
**Solution**:
1. Verify backend is accessible from device
2. Check firewall/network settings
3. Verify API_BASE_URL is correct for your network

## Next Steps

1. **Open the Debug screen** in the mobile app
2. **Check the Logs tab** for ERROR level entries
3. **Check the Network tab** for failed API requests
4. **Share the error details** if you need help debugging

The enhanced error handling will now:
- Show user-friendly error screens
- Log detailed error context
- Provide retry functionality
- Display error details in development mode





