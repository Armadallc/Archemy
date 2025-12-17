# User Creation and Login Issues - Research Document

## Overview
This document outlines identified issues with user creation and authentication, root causes, and solutions.

## Identified Issues

### 1. **auth_user_id Not Saved During User Creation**
**Problem**: When users are created through the POST `/api/users` endpoint, the `auth_user_id` field is sometimes not saved to the database, even though the Supabase Auth user is created successfully.

**Root Causes**:
- Database insert may fail silently after Supabase Auth user creation
- Race condition between Auth user creation and database insert
- Database constraint or validation error that doesn't propagate properly
- The `auth_user_id` field might not be included in the insert payload due to schema mismatch

**Evidence**:
- `mike@monarch.com` was created with `auth_user_id: null` in database
- Supabase Auth user existed with ID `e26295be-256a-486a-828d-846f51ddc787`
- Users could not log in because the database user wasn't linked to the Auth user

**Solution Implemented**:
- Added verification step after user creation to check if `auth_user_id` was saved
- Added automatic retry mechanism to update `auth_user_id` if missing
- Added comprehensive logging to track the issue
- Created sync script (`sync-all-users-auth.js`) to link existing users

### 2. **Password Not Set Correctly**
**Problem**: Even when `auth_user_id` is linked, users may not be able to log in because the password wasn't set correctly during creation.

**Root Causes**:
- Password may not be passed correctly to Supabase Auth `createUser` function
- Password validation rules in Supabase may reject the password
- Password may be hashed incorrectly or not at all

**Solution Implemented**:
- Added password update script to reset passwords
- Verified password is passed directly (not hashed) to Supabase Auth
- Added password strength validation (if needed)

### 3. **Users Created Before Auth System Migration**
**Problem**: Users created before the Supabase Auth integration don't have `auth_user_id` values and cannot log in.

**Root Causes**:
- Legacy user creation process didn't create Supabase Auth users
- Migration script wasn't run for existing users
- Users were created through different code paths

**Solution Implemented**:
- Created `sync-all-users-auth.js` script to sync all existing users
- Script creates Supabase Auth users for database users without `auth_user_id`
- Sets default passwords (`{username}123`) that users must change on first login

### 4. **User Deletion Leaves Orphaned Auth Users**
**Problem**: When users are deleted from the database, their Supabase Auth accounts may remain, causing confusion and potential security issues.

**Root Causes**:
- Delete endpoint previously only did soft delete (`is_active: false`)
- Hard delete now removes from database but may not remove from Supabase Auth
- No cleanup process for orphaned Auth users

**Solution Implemented**:
- Updated DELETE endpoint to remove from both database and Supabase Auth
- Added error handling if Auth deletion fails (continues with database deletion)
- Created `delete-user.js` script for manual cleanup

## Common Failure Scenarios

### Scenario 1: User Created, Can't Login
**Symptoms**:
- User exists in database
- User exists in Supabase Auth
- Login fails with "Invalid login credentials"

**Diagnosis Steps**:
1. Check if `auth_user_id` is set in database user record
2. Verify Supabase Auth user exists with matching email
3. Check if `auth_user_id` matches Supabase Auth user ID
4. Verify password is correct in Supabase Auth

**Fix**:
```bash
# Link user
node server/scripts/create-user-auth.js <email> <password>

# Or sync all users
node server/scripts/sync-all-users-auth.js
```

### Scenario 2: User Created, Missing auth_user_id
**Symptoms**:
- User exists in database with `auth_user_id: null`
- Supabase Auth user may or may not exist
- Login fails

**Diagnosis Steps**:
1. Check database for `auth_user_id` value
2. Search Supabase Auth for user by email
3. If Auth user exists, link them
4. If Auth user doesn't exist, create it

**Fix**:
- Run sync script or manually link using `create-user-auth.js`

### Scenario 3: Password Mismatch
**Symptoms**:
- User exists and is linked correctly
- Login fails with "Invalid login credentials"
- Password was set during creation

**Diagnosis Steps**:
1. Verify password in Supabase Auth (may need to reset)
2. Check if password meets Supabase requirements
3. Verify password wasn't hashed before being sent to Supabase

**Fix**:
```bash
# Reset password
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.auth.admin.updateUserById('<auth_user_id>', { password: '<new_password>' });
"
```

## Prevention Strategies

### 1. **Improved Error Handling**
- Added verification step after user creation
- Automatic retry for `auth_user_id` linking
- Comprehensive logging for debugging

### 2. **Validation**
- Verify `auth_user_id` is saved before returning success
- Check password requirements before creating Auth user
- Validate email format and uniqueness

### 3. **Monitoring**
- Log all user creation attempts
- Track failed login attempts
- Monitor for users with `auth_user_id: null`

### 4. **Testing**
- Test user creation flow end-to-end
- Verify login works immediately after creation
- Test edge cases (duplicate emails, invalid passwords, etc.)

## Best Practices

1. **Always verify `auth_user_id` after creation**
2. **Use transaction-like approach**: If Auth user creation fails, don't create database user
3. **If database user creation fails, clean up Auth user**
4. **Log all steps for debugging**
5. **Provide clear error messages to admins**
6. **Run sync script periodically to catch orphaned users**

## Scripts Available

1. **`sync-all-users-auth.js`**: Sync all database users to Supabase Auth
2. **`create-user-auth.js`**: Create/link Supabase Auth user for a specific email
3. **`delete-user.js`**: Delete user from both database and Supabase Auth

## Future Improvements

1. **Database Transaction Support**: Use transactions to ensure atomicity
2. **Retry Logic**: Implement exponential backoff for failed operations
3. **Health Check Endpoint**: Verify all users are properly linked
4. **Automated Sync**: Run sync script on a schedule
5. **User Creation Audit Log**: Track all user creation/deletion events












