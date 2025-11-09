# TEST 3: Cross-Corporate Security Test - Console Command

## Corrected Command

Copy and paste this into the browser console:

```javascript
// Get auth token
const token = localStorage.getItem('auth_token');

// Replace with actual IDs
const monarchProgramId = 'monarch_competency'; // Use actual Monarch program ID
const halcyonClientId = '6453aaca-3027-41b1-ba02-7022d0d3d261'; // Halcyon client ID

// Attempt to create trip for Monarch program (should FAIL)
fetch('http://localhost:8081/api/trips', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    program_id: monarchProgramId, // Attempting to use Monarch program
    client_id: halcyonClientId, // Halcyon client
    pickup_address: '123 Test St, Denver, CO',
    dropoff_address: '456 Test Ave, Denver, CO',
    scheduled_pickup_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    passenger_count: 1,
    status: 'scheduled',
    trip_type: 'one_way'
  })
})
.then(r => {
  console.log('📊 Response Status:', r.status);
  return r.json().then(data => {
    console.log('📊 Response Data:', data);
    return { status: r.status, data: data };
  });
})
.then(result => {
  if (result.status === 403 || result.status === 400) {
    console.log('✅ SECURITY WORKING: Request was blocked');
  } else if (result.status === 201) {
    console.error('❌ SECURITY GAP: Trip was created! This should not happen.');
  } else {
    console.warn('⚠️ Unexpected status:', result.status);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

## What Changed

1. **Fixed variable names**: `monarchProgramId` and `halcyonClientId` are now properly quoted as strings
2. **Fixed response handling**: Capture `r.status` before calling `.json()` since you can only read the response once
3. **Added better logging**: Shows status code and response data clearly
4. **Added security check**: Automatically tells you if security is working or if there's a gap

## Expected Output

**If Security is Working:**
```
📊 Response Status: 403
📊 Response Data: {message: "Access denied to program", ...}
✅ SECURITY WORKING: Request was blocked
```

**If Security Gap Exists:**
```
📊 Response Status: 201
📊 Response Data: {id: "...", program_id: "monarch_competency", ...}
❌ SECURITY GAP: Trip was created! This should not happen.
```






