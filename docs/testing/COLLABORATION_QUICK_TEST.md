# Collaboration API - Quick Test Guide

## ✅ Database Migration Status
The migration has been successfully run! All tables are created:
- ✅ `tasks` table
- ✅ `comments` table  
- ✅ `notes` table

## 🔐 Getting an Authentication Token

### Option 1: From Browser (Easiest)
1. Open your app in the browser: `http://localhost:5173`
2. Log in with your credentials
3. Open DevTools (F12) → Network tab
4. Make any API request (e.g., navigate to a page)
5. Click on any request → Headers tab
6. Look for `Authorization: Bearer <token>` or check Cookies for session

### Option 2: From Browser Console
1. Log in to the app
2. Open DevTools → Console
3. Run:
   ```javascript
   // Get Supabase session
   const { data } = await supabase.auth.getSession();
   console.log('Token:', data.session?.access_token);
   ```

## 🧪 Quick API Tests

### Test 1: Verify Endpoint is Registered
```bash
# This should return 401 (Unauthorized), not 404
curl -X GET http://localhost:8081/api/collaboration/tasks \
  -H "Content-Type: application/json"
```

**Expected:** `{"error":"Unauthorized"}` or `{"message":"Not authenticated"}`

**If you get 404:** The route isn't registered - check server logs

### Test 2: Create a Task (with auth token)
```bash
# Replace YOUR_TOKEN with actual token
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:8081/api/collaboration/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing the collaboration API",
    "priority": "medium",
    "status": "pending"
  }'
```

**Expected:** 201 Created with task object

### Test 3: Get All Tasks
```bash
curl -X GET http://localhost:8081/api/collaboration/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:** 200 OK with array of tasks (empty if none created)

### Test 4: Create a Comment
```bash
curl -X POST http://localhost:8081/api/collaboration/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test comment",
    "source_type": "trip",
    "source_id": "test_trip_123"
  }'
```

**Expected:** 201 Created with comment object

### Test 5: Create a Note
```bash
curl -X POST http://localhost:8081/api/collaboration/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test note",
    "note_type": "general",
    "is_private": false
  }'
```

**Expected:** 201 Created with note object

## 🔍 Troubleshooting

### "API endpoint not found" (404)
- Check server logs for route registration
- Verify `server/routes/index.ts` includes collaboration routes
- Restart the backend server

### "Unauthorized" (401)
- This is expected without a token
- Get a valid auth token from browser
- Make sure token hasn't expired

### "Access denied" (403)
- Check RLS policies in Supabase
- Verify user has proper role/permissions
- Check multi-tenant scoping (corporate_client_id, program_id)

### Database errors
- Verify migration ran successfully
- Check table names match: `tasks`, `comments`, `notes`
- Verify foreign key constraints are correct

## 📊 Expected Response Examples

### Successful Task Creation (201)
```json
{
  "id": "task_abc123",
  "title": "Test Task",
  "description": "Testing the collaboration API",
  "status": "pending",
  "priority": "medium",
  "assigned_user": null,
  "creator": {
    "user_id": "user_123",
    "user_name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Successful Comment Creation (201)
```json
{
  "id": "comment_abc123",
  "content": "This is a test comment",
  "source_type": "trip",
  "source_id": "test_trip_123",
  "parent_comment_id": null,
  "creator": {
    "user_id": "user_123",
    "user_name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

## ✅ Success Criteria

All tests pass when:
- ✅ Endpoints return 401 without auth (not 404)
- ✅ Endpoints return 201 when creating resources with valid auth
- ✅ Endpoints return 200 when fetching resources
- ✅ Data is correctly stored in database
- ✅ Foreign key relationships work
- ✅ RLS policies enforce multi-tenant scoping

