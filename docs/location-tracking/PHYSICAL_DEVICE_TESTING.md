# Physical Device Testing - Location Tracking

## Quick Setup for Testing Location Tracking

### 1. Verify Backend is Running Locally

Make sure your backend server is running on port 8081:
```bash
# From project root
npm run dev
# or
cd server && npm start
```

Verify it's accessible:
```bash
curl http://localhost:8081/api/mobile/test
# Should return: {"message":"Mobile API test endpoint working"}
```

### 2. Configure Mobile App for Physical Device

The mobile app is already configured to use `192.168.12.215:8081` by default for physical devices.

**If your computer's IP is different**, update `mobile/.env`:
```bash
EXPO_PUBLIC_API_URL=http://YOUR_IP:8081
EXPO_PUBLIC_WS_URL=ws://YOUR_IP:8081
```

**To find your IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

### 3. Start Expo

```bash
cd mobile
npx expo start --clear
```

### 4. Connect Physical Device

1. Make sure your phone and computer are on the **same Wi-Fi network**
2. Scan the QR code with Expo Go app (iOS) or Camera app (Android)
3. The app should load and connect to your local backend

### 5. Test Location Tracking

1. **Login** as driver: `driver@monarch.com`
2. **Check console logs** - you should see:
   - `✅ User is a driver, initializing location tracking...`
   - `📍 LocationTrackingService.initialize called for userId: driver_monarch_1758946085589`
   - `✅ Found driver ID: driver_monarch_1758946085589`
   - `📍 Requesting location permissions...`

3. **Grant location permission** when prompted
4. **Verify tracking started**:
   - `✅ Location tracking initialized, starting...`
   - `📍 Location update sent: { lat: ..., lng: ... }`

### 6. Verify Location Updates

**Check backend logs** - you should see:
```
🔍 Mobile: Fetching driver profile for user: driver_monarch_1758946085589
✅ Mobile: Found driver ID: driver_monarch_1758946085589
POST /api/mobile/driver/:driverId/location - Location update received
```

**Check database:**
```sql
SELECT * FROM driver_locations 
WHERE driver_id = 'driver_monarch_1758946085589' 
ORDER BY timestamp DESC 
LIMIT 5;
```

**Check dashboard:**
- Open dashboard in browser: `http://localhost:5173` (or your frontend URL)
- Go to fleet map
- Your location should appear as a marker
- Marker should update in real-time

## Troubleshooting

### "Network request failed"
- **Check firewall**: Allow connections on port 8081
- **Same network**: Phone and computer must be on same Wi-Fi
- **IP address**: Verify your computer's IP hasn't changed
- **Backend running**: Make sure `npm run dev` is running

### "API endpoint not found"
- **Backend restarted**: Make sure you restarted the backend after adding the new endpoint
- **Check route**: Verify `/api/mobile/driver/profile` exists in `server/routes/mobile.ts`

### "No driver record found"
- **Check database**: Run verification query to confirm driver record exists
- **Auto-create**: The endpoint should auto-create the record, but check logs if it fails

### Location permission not showing
- **Check role**: User must have `role = 'driver'`
- **Check driver record**: Must exist in `drivers` table
- **App permissions**: Check device Settings > Apps > HALCYON DRIVE > Permissions

### Location updates not appearing on dashboard
- **Check backend**: Verify location updates are being received
- **Check WebSocket**: Verify WebSocket connection is active
- **Check polling**: Dashboard polls every 5 seconds, wait a moment
- **Check map**: Verify map is loading and markers are rendering

## Testing Checklist

- [ ] Backend running on port 8081
- [ ] Mobile app connects to local backend (check logs for `http://192.168.12.215:8081`)
- [ ] Driver login successful
- [ ] Location permission prompt appears
- [ ] Permission granted
- [ ] Location tracking starts (check console logs)
- [ ] Location updates sent to backend (check backend logs)
- [ ] Location stored in database (check `driver_locations` table)
- [ ] Location appears on dashboard map
- [ ] Location updates in real-time on dashboard

## Next Steps After Testing

Once everything works locally:
1. Commit all changes
2. Create PR to `main` branch
3. Merge to deploy backend changes
4. Deploy mobile app (if needed)
5. Test on production


