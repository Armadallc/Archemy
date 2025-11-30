# Protecting Current Functions Throughout the App

## Overview

This document outlines strategies to protect and maintain existing functionality as the application grows. The goal is to prevent regressions, catch errors early, and maintain code quality.

---

## 1. Testing Strategy

### Current Status
- ✅ Vitest configured for client and server
- ✅ Some tests exist (chat hooks, discussions routes, mention parser)
- ⚠️ Coverage is incomplete

### Recommended Approach

#### A. Unit Tests (High Priority)
Test individual functions and components in isolation.

**Priority Areas:**
1. **API Routes** - All backend endpoints
2. **Hooks** - Custom React hooks (useAuth, useActivityLog, useDiscussions, etc.)
3. **Services** - Business logic (activityLogService, mentionParser, etc.)
4. **Utilities** - Helper functions (displayNames, urlBuilder, etc.)

**Example Test Structure:**
```typescript
// server/__tests__/routes/activity-log.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getActivityLog } from '../../services/activityLogService';

describe('Activity Log Service', () => {
  it('should fetch activities for authenticated user', async () => {
    // Test implementation
  });
  
  it('should filter activities by scope', async () => {
    // Test implementation
  });
});
```

#### B. Integration Tests
Test how components work together.

**Priority Areas:**
1. **Route Registration** - Ensure all routes are registered
2. **Authentication Flow** - Login, logout, session management
3. **Data Flow** - API → Hook → Component

#### C. E2E Tests (Future)
Use Playwright for critical user flows.

**Critical Flows:**
- User login → Dashboard → Create trip
- Activity feed loading
- Chat module functionality
- Kanban board drag-and-drop

### Action Items
- [ ] Create tests for all API routes
- [ ] Add tests for critical hooks (useActivityLog, useDiscussions, useKanbanBoard)
- [ ] Test route registration (prevent 404s)
- [ ] Add integration tests for authentication
- [ ] Set up test coverage reporting

---

## 2. Error Handling

### Current Status
- ✅ ErrorBoundary component exists
- ✅ Global error tracking (clickTracker)
- ⚠️ Inconsistent error handling in API calls

### Improvements Needed

#### A. API Error Handling
Wrap all API calls with consistent error handling:

```typescript
// client/src/lib/apiHelpers.ts
export async function safeApiRequest<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const response = await apiRequest(method, url, data);
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`API Error [${method} ${url}]:`, error);
    return { data: null, error: error as Error };
  }
}
```

#### B. Component Error Boundaries
Add error boundaries around major sections:

```typescript
// Wrap major features
<ErrorBoundary fallback={<ActivityFeedError />}>
  <ActivityFeed />
</ErrorBoundary>

<ErrorBoundary fallback={<ChatError />}>
  <ChatPage />
</ErrorBoundary>
```

#### C. Backend Error Handling
Ensure all routes have proper error handling:

```typescript
router.get('/api/endpoint', requireSupabaseAuth, async (req, res) => {
  try {
    // Route logic
  } catch (error: any) {
    console.error('Route error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
```

### Action Items
- [ ] Create `safeApiRequest` helper
- [ ] Add error boundaries to major components
- [ ] Standardize backend error responses
- [ ] Add error logging service (Sentry, LogRocket, etc.)

---

## 3. Type Safety

### Current Status
- ✅ TypeScript is configured
- ⚠️ Some `any` types exist
- ⚠️ Missing type definitions for some API responses

### Improvements

#### A. Strict Type Definitions
Define types for all API responses:

```typescript
// shared/types/api.ts
export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiscussionsResponse {
  discussions: Discussion[];
  total: number;
}
```

#### B. Remove `any` Types
Replace `any` with proper types:

```typescript
// Before
function handleError(error: any) { }

// After
function handleError(error: Error | unknown) {
  if (error instanceof Error) {
    // Handle Error
  }
}
```

#### C. API Response Validation
Use Zod or similar for runtime validation:

```typescript
import { z } from 'zod';

const ActivityLogEntrySchema = z.object({
  id: z.string(),
  activity_type: z.string(),
  created_at: z.string(),
  // ... etc
});

// Validate API responses
const validated = ActivityLogEntrySchema.parse(apiResponse);
```

### Action Items
- [ ] Audit and remove `any` types
- [ ] Create type definitions for all API responses
- [ ] Add runtime validation with Zod
- [ ] Enable stricter TypeScript settings

---

## 4. Route Registration Protection

### Problem
Routes can be forgotten during registration (like we just fixed with activity-log and discussions).

### Solution: Automated Route Checker

Create a script to verify all route files are registered:

```typescript
// scripts/check-routes.ts
import fs from 'fs';
import path from 'path';

const routeFiles = fs.readdirSync('./server/routes')
  .filter(f => f.endsWith('.ts') && f !== 'index.ts');

const indexContent = fs.readFileSync('./server/routes/index.ts', 'utf-8');

const missingRoutes = routeFiles.filter(file => {
  const routeName = file.replace('.ts', '');
  return !indexContent.includes(`from "./${routeName}"`) ||
         !indexContent.includes(`router.use("/${routeName}"`);
});

if (missingRoutes.length > 0) {
  console.error('❌ Missing route registrations:', missingRoutes);
  process.exit(1);
}

console.log('✅ All routes are registered');
```

Add to pre-commit hook or CI/CD.

### Action Items
- [ ] Create route checker script
- [ ] Add to pre-commit hook
- [ ] Add to CI/CD pipeline

---

## 5. Code Quality Checks

### Current Tools
- TypeScript compiler (`npm run check`)
- ESLint (likely configured)
- Prettier (likely configured)

### Recommended Additions

#### A. Pre-commit Hooks
Use Husky + lint-staged:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### B. CI/CD Checks
Run on every PR:
- Type checking
- Linting
- Tests
- Route registration check
- Build verification

#### C. Dependency Auditing
Regular security audits:

```bash
npm audit
npm audit fix
```

### Action Items
- [ ] Set up Husky pre-commit hooks
- [ ] Configure lint-staged
- [ ] Add CI/CD pipeline checks
- [ ] Schedule regular dependency audits

---

## 6. Documentation

### Current Status
- ✅ Some documentation exists
- ⚠️ API documentation incomplete
- ⚠️ Component documentation missing

### Improvements

#### A. API Documentation
Document all endpoints:

```typescript
/**
 * GET /api/activity-log
 * 
 * Get activity log entries for the current user
 * 
 * @query limit - Number of results (default: 50)
 * @query offset - Pagination offset (default: 0)
 * @query mentionsOnly - Filter to mentions only (default: false)
 * 
 * @returns {ActivityLogEntry[]} Array of activity log entries
 * 
 * @example
 * GET /api/activity-log?limit=20&mentionsOnly=true
 */
```

#### B. Component Documentation
Document complex components:

```typescript
/**
 * ActivityFeed Component
 * 
 * Displays a timeline of user activities including:
 * - Task creation/updates
 * - Trip creation
 * - Discussion messages
 * - Mentions
 * 
 * @example
 * <ActivityFeed />
 */
```

#### C. Architecture Documentation
Keep architecture decisions documented:
- Route structure
- State management approach
- Authentication flow
- Data flow diagrams

### Action Items
- [ ] Document all API endpoints
- [ ] Add JSDoc to complex components
- [ ] Create architecture decision records (ADRs)
- [ ] Keep README updated

---

## 7. Monitoring & Logging

### Current Status
- ✅ Console logging
- ✅ Error tracking (clickTracker)
- ⚠️ No production error monitoring

### Recommended Tools

#### A. Error Monitoring
- **Sentry** - Error tracking and performance monitoring
- **LogRocket** - Session replay and error tracking
- **Rollbar** - Error tracking

#### B. Performance Monitoring
- **Lighthouse CI** - Performance metrics
- **Web Vitals** - Core web vitals tracking

#### C. API Monitoring
- **Health check endpoint** - `/api/health`
- **Uptime monitoring** - External service (UptimeRobot, etc.)

### Action Items
- [ ] Set up error monitoring service
- [ ] Add performance monitoring
- [ ] Create health check dashboard
- [ ] Set up alerts for critical errors

---

## 8. Backup & Version Control

### Current Status
- ✅ Git version control
- ⚠️ Branch protection unknown

### Best Practices

#### A. Git Workflow
- Use feature branches
- Require PR reviews
- Protect main/master branch
- Use semantic commit messages

#### B. Database Backups
- Regular automated backups
- Test restore procedures
- Version control migrations

#### C. Environment Variables
- Never commit secrets
- Use `.env.example` for documentation
- Rotate secrets regularly

### Action Items
- [ ] Set up branch protection rules
- [ ] Configure automated database backups
- [ ] Document backup/restore procedures
- [ ] Audit environment variable security

---

## 9. Immediate Action Plan

### High Priority (This Week)
1. ✅ **Route Registration Checker** - Prevent 404s
2. ✅ **Error Boundaries** - Add to major components
3. ✅ **API Error Handling** - Standardize error responses
4. ✅ **Type Definitions** - Create for all API responses

### Medium Priority (This Month)
1. **Unit Tests** - Critical routes and hooks
2. **Integration Tests** - Authentication and data flow
3. **Error Monitoring** - Set up Sentry or similar
4. **Documentation** - API and component docs

### Low Priority (Ongoing)
1. **E2E Tests** - Critical user flows
2. **Performance Monitoring** - Web vitals tracking
3. **Code Quality** - Remove `any` types, improve type safety
4. **CI/CD** - Automated checks and deployments

---

## 10. Quick Wins

### Today
1. Create route registration checker script
2. Add error boundaries to ActivityFeed and ChatPage
3. Document the route registration process

### This Week
1. Add tests for activity-log and discussions routes
2. Create type definitions for API responses
3. Set up pre-commit hooks

### This Month
1. Comprehensive test coverage for critical features
2. Error monitoring service integration
3. Complete API documentation

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated:** 2025-01-27

