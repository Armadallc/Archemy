# DATABASE CODING STANDARDS - PERMANENT PROJECT RULES

## CRITICAL SUCCESS PATTERN - NEVER DEVIATE

### 1. SNAKE_CASE DATABASE FIELD RULE
**All database field names MUST remain in snake_case throughout the entire application stack.**

```typescript
// ✅ CORRECT - Use exact database field names
user.user_id
user.primary_organization_id  
trip.scheduled_pickup_time
client.service_area_id

// ❌ WRONG - Never convert to camelCase
user.userId              // CAUSES AUTHENTICATION FAILURES
user.primaryOrganizationId
trip.scheduledPickupTime
client.serviceAreaId
```

### 2. AUTHENTICATION SUCCESS PATTERN
This pattern just fixed weeks of authentication issues:

```typescript
// ✅ CORRECT SESSION STORAGE
req.session.userId = user.user_id;  // user_id from database
req.session.organizationId = user.primary_organization_id;

// ❌ WRONG - Causes 401 errors in production
req.session.userId = user.userId;  // userId doesn't exist in DB
```

### 3. VALIDATION ENFORCEMENT
Always validate database results before use:

```typescript
function validateSessionMapping(user: any) {
  if (!user.user_id) {
    throw new Error("CRITICAL: user.user_id is undefined - check database query");
  }
  if (user.userId !== undefined) {
    throw new Error("CRITICAL: Found camelCase userId - database uses snake_case user_id");
  }
}
```

### 4. TESTING MANTRA
**Before writing any database code, ask:**
"Am I using the exact field name from the database schema?"
- If YES: Proceed
- If NO: Stop and fix immediately

### 5. FIELD NAME EXAMPLES
```sql
-- Database schema uses snake_case
CREATE TABLE users (
  user_id VARCHAR PRIMARY KEY,
  user_name VARCHAR,
  primary_organization_id VARCHAR,
  authorized_organizations VARCHAR[],
  created_at TIMESTAMP
);
```

```typescript
// Application code MUST match database exactly
const user = await db.select().from(users).where(eq(users.user_id, id));
req.session.userId = user.user_id;  // NOT user.userId
```

## SUCCESS CONFIRMATION
This snake_case consistency rule just resolved:
- Production authentication failures
- Session storage issues  
- Calendar loading problems
- 401 Unauthorized errors
