# Collaboration Module API Testing Guide

## Prerequisites

1. **Run the database migration**:
   ```bash
   # The migration file is: migrations/0036_create_collaboration_tables.sql
   # Run it in your Supabase SQL editor or via psql
   ```

2. **Start the backend server**:
   ```bash
   cd server
   npm run dev
   # Server should be running on http://localhost:8081
   ```

3. **Get an authentication token**:
   - Log in to the app in your browser
   - Open browser DevTools → Network tab
   - Find any API request and copy the `Authorization` header value
   - Or check the session cookie

## Testing Methods

### Method 1: Automated Test Script

Run the automated test script:

```bash
# Set your auth token
export TEST_AUTH_TOKEN="your_auth_token_here"

# Run the test script
npx tsx server/scripts/test-collaboration-api.ts
```

### Method 2: Manual Testing with cURL

#### Test Tasks API

```bash
# Set your auth token
AUTH_TOKEN="your_auth_token_here"
BASE_URL="http://localhost:8081"

# 1. Create a task
curl -X POST "$BASE_URL/api/collaboration/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "medium",
    "status": "pending",
    "task_type": "review"
  }'

# 2. Get all tasks
curl -X GET "$BASE_URL/api/collaboration/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 3. Get a specific task (replace TASK_ID)
curl -X GET "$BASE_URL/api/collaboration/tasks/TASK_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 4. Update a task (replace TASK_ID)
curl -X PATCH "$BASE_URL/api/collaboration/tasks/TASK_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "high"
  }'

# 5. Delete a task (replace TASK_ID)
curl -X DELETE "$BASE_URL/api/collaboration/tasks/TASK_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

#### Test Comments API

```bash
# 1. Create a comment
curl -X POST "$BASE_URL/api/collaboration/comments" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test comment",
    "source_type": "trip",
    "source_id": "test_trip_id"
  }'

# 2. Get comments for a source
curl -X GET "$BASE_URL/api/collaboration/comments?source_type=trip&source_id=test_trip_id" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 3. Update a comment (replace COMMENT_ID)
curl -X PATCH "$BASE_URL/api/collaboration/comments/COMMENT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment content"
  }'
```

#### Test Notes API

```bash
# 1. Create a note
curl -X POST "$BASE_URL/api/collaboration/notes" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test note",
    "note_type": "general",
    "is_private": false
  }'

# 2. Get all notes
curl -X GET "$BASE_URL/api/collaboration/notes" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 3. Update a note (replace NOTE_ID)
curl -X PATCH "$BASE_URL/api/collaboration/notes/NOTE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Note Title"
  }'

# 4. Delete a note (replace NOTE_ID)
curl -X DELETE "$BASE_URL/api/collaboration/notes/NOTE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Method 3: Using Postman or Insomnia

1. Import the following collection structure:

**Tasks Endpoints:**
- `POST /api/collaboration/tasks` - Create task
- `GET /api/collaboration/tasks` - Get all tasks
- `GET /api/collaboration/tasks/:id` - Get task by ID
- `PATCH /api/collaboration/tasks/:id` - Update task
- `DELETE /api/collaboration/tasks/:id` - Delete task

**Comments Endpoints:**
- `POST /api/collaboration/comments` - Create comment
- `GET /api/collaboration/comments?source_type=X&source_id=Y` - Get comments
- `PATCH /api/collaboration/comments/:id` - Update comment

**Notes Endpoints:**
- `POST /api/collaboration/notes` - Create note
- `GET /api/collaboration/notes` - Get all notes
- `PATCH /api/collaboration/notes/:id` - Update note
- `DELETE /api/collaboration/notes/:id` - Delete note

2. Set the `Authorization` header to `Bearer YOUR_TOKEN`
3. Set `Content-Type` to `application/json` for POST/PATCH requests

## Expected Responses

### Success Responses

**Create Task (201):**
```json
{
  "id": "task_id",
  "title": "Test Task",
  "description": "This is a test task",
  "status": "pending",
  "priority": "medium",
  "assigned_user": null,
  "creator": {
    "user_id": "user_id",
    "user_name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Get Tasks (200):**
```json
[
  {
    "id": "task_id",
    "title": "Test Task",
    ...
  }
]
```

### Error Responses

**Unauthorized (401):**
```json
{
  "error": "Unauthorized"
}
```

**Not Found (404):**
```json
{
  "error": "Task not found"
}
```

**Validation Error (400):**
```json
{
  "error": "Title is required"
}
```

## Testing Checklist

- [ ] Database tables exist (tasks, comments, notes)
- [ ] Can create a task
- [ ] Can get all tasks
- [ ] Can get a specific task
- [ ] Can update a task
- [ ] Can delete a task
- [ ] Can create a comment
- [ ] Can get comments for a source
- [ ] Can update a comment
- [ ] Can create a note
- [ ] Can get all notes
- [ ] Can update a note
- [ ] Can delete a note
- [ ] Authentication works (401 without token)
- [ ] Authorization works (403 for unauthorized access)
- [ ] Multi-tenant scoping works (users only see their scope)

## Troubleshooting

### "Table does not exist" error
- Run the migration: `migrations/0036_create_collaboration_tables.sql`
- Check that tables were created in Supabase

### "Unauthorized" error
- Make sure you're sending a valid auth token
- Check that the token hasn't expired
- Verify the user exists in the database

### "Route not found" error
- Check that the collaboration routes are registered in `server/routes/index.ts`
- Restart the backend server
- Verify the route path is `/api/collaboration/*`

### "Access denied" error
- Check RLS policies in Supabase
- Verify user has proper role/permissions
- Check multi-tenant scoping (corporate_client_id, program_id)

