# Task Management & Questions System - Implementation Plan

## 📋 Summary of Understanding

### Current State
- ✅ Tasks table exists in database (`shared/schema.ts`)
- ✅ Basic collaboration API endpoints exist (`/api/collaboration/tasks`)
- ✅ Task widget displays mock data
- ✅ Schema supports: `assigned_to`, `created_by`, `status`, `priority`, `task_type`, `corporate_client_id`, `program_id`
- ❌ No support for multiple assignees (currently single `assigned_to`)
- ❌ No "Questions" entity (separate from tasks)
- ❌ No "Private/Open" labeling system
- ❌ No hierarchical permission enforcement for task delegation
- ❌ No To-Do list functionality

### Requirements Analysis

#### 1. **Hierarchical Task Delegation Rules**
```
Super Admin → Anyone (all users)
Corporate Admin → Super Admin + Anyone in their tenant
Program Admin → Corporate Admin + Anyone in their program
Program User → Program Admin + Anyone in their program
```

#### 2. **Question System Rules**
```
Any User → Super Admin
Super Admin → Any User
Tenant Users → Any User in their tenant
```

#### 3. **Core Features**
- Tasks/Questions can be sent to 1 or multiple users
- Answers, updates, notifications visible to all attached users
- To-Do list for task recipients
- Status updates and completion marking
- "Private" or "Open" labels (or no label = general)

---

## 💡 Suggestions & Recommendations

### 1. **Database Schema Enhancements**

#### A. Create `task_assignees` Junction Table
**Problem**: Current schema only supports single assignee (`assigned_to`). Need multiple assignees.

**Solution**: Create junction table for many-to-many relationship.

```sql
CREATE TABLE task_assignees (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
  completed_at TIMESTAMP,
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
```

#### B. Create `questions` Table
**Problem**: Questions are different from tasks - they need answers, not completion.

**Solution**: Separate table for questions with answer tracking.

```sql
CREATE TABLE questions (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  question_type VARCHAR(20) DEFAULT 'general', -- general, support, technical, billing, other
  status VARCHAR(20) DEFAULT 'open', -- open, answered, closed
  visibility VARCHAR(20) DEFAULT 'general', -- private, open, general
  created_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  answered_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  program_id VARCHAR(50) REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_recipients (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  UNIQUE(question_id, user_id)
);

CREATE INDEX idx_question_recipients_question_id ON question_recipients(question_id);
CREATE INDEX idx_question_recipients_user_id ON question_recipients(user_id);
```

#### C. Add `visibility` Field to Tasks
**Problem**: Need to label tasks as "Private" or "Open".

**Solution**: Add visibility field to tasks table.

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'general';
-- Values: 'private', 'open', 'general'
```

#### D. Create `task_updates` Table
**Problem**: Need to track updates, comments, and notifications for tasks.

**Solution**: Separate table for task activity/updates.

```sql
CREATE TABLE task_updates (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  update_type VARCHAR(20) NOT NULL, -- status_change, comment, assignment, completion
  content TEXT,
  metadata JSONB, -- Store additional data (old_status, new_status, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX idx_task_updates_user_id ON task_updates(user_id);
```

### 2. **Permission & Access Control**

#### A. Create Permission Helper Functions
```typescript
// server/task-permissions.ts

export function canAssignTaskToUser(
  assignerRole: string,
  assignerCorporateClientId: string | null,
  assignerProgramId: string | null,
  targetUserId: string,
  targetUserRole: string,
  targetUserCorporateClientId: string | null,
  targetUserProgramId: string | null
): boolean {
  // Super Admin can assign to anyone
  if (assignerRole === 'super_admin') return true;
  
  // Corporate Admin can assign to:
  // - Super Admin
  // - Anyone in their corporate client
  if (assignerRole === 'corporate_admin') {
    if (targetUserRole === 'super_admin') return true;
    return assignerCorporateClientId === targetUserCorporateClientId;
  }
  
  // Program Admin can assign to:
  // - Corporate Admin (of their corporate client)
  // - Anyone in their program
  if (assignerRole === 'program_admin') {
    if (targetUserRole === 'corporate_admin' && 
        assignerCorporateClientId === targetUserCorporateClientId) return true;
    return assignerProgramId === targetUserProgramId;
  }
  
  // Program User can assign to:
  // - Program Admin (of their program)
  // - Anyone in their program
  if (assignerRole === 'program_user') {
    if (targetUserRole === 'program_admin' && 
        assignerProgramId === targetUserProgramId) return true;
    return assignerProgramId === targetUserProgramId;
  }
  
  return false;
}

export function canSendQuestionToUser(
  senderRole: string,
  senderCorporateClientId: string | null,
  targetUserId: string,
  targetUserRole: string,
  targetUserCorporateClientId: string | null
): boolean {
  // Any user can send to Super Admin
  if (targetUserRole === 'super_admin') return true;
  
  // Super Admin can send to anyone
  if (senderRole === 'super_admin') return true;
  
  // Tenant users can send to anyone in their tenant
  if (senderCorporateClientId && 
      senderCorporateClientId === targetUserCorporateClientId) {
    return true;
  }
  
  return false;
}
```

### 3. **API Endpoints Structure**

#### Tasks API (`/api/collaboration/tasks`)
```
GET    /api/collaboration/tasks                    - List tasks (filtered by user's scope)
GET    /api/collaboration/tasks/:id                - Get task details
POST   /api/collaboration/tasks                    - Create task (with multiple assignees)
PATCH  /api/collaboration/tasks/:id                - Update task
DELETE /api/collaboration/tasks/:id                 - Delete task
GET    /api/collaboration/tasks/:id/assignees      - Get task assignees
POST   /api/collaboration/tasks/:id/assignees      - Add assignees to task
DELETE /api/collaboration/tasks/:id/assignees/:userId - Remove assignee
PATCH  /api/collaboration/tasks/:id/assignees/:userId/status - Update assignee status
GET    /api/collaboration/tasks/:id/updates         - Get task updates/history
POST   /api/collaboration/tasks/:id/updates         - Add update/comment
GET    /api/collaboration/tasks/todo                - Get user's to-do list
```

#### Questions API (`/api/collaboration/questions`)
```
GET    /api/collaboration/questions                 - List questions (filtered by user's scope)
GET    /api/collaboration/questions/:id             - Get question details
POST   /api/collaboration/questions                 - Create question (with multiple recipients)
PATCH  /api/collaboration/questions/:id             - Update question
DELETE /api/collaboration/questions/:id             - Delete question
POST   /api/collaboration/questions/:id/answer      - Answer question
GET    /api/collaboration/questions/:id/recipients  - Get question recipients
POST   /api/collaboration/questions/:id/recipients  - Add recipients to question
PATCH  /api/collaboration/questions/:id/read         - Mark question as read
```

### 4. **Frontend Components Structure**

```
client/src/
├── components/
│   ├── tasks/
│   │   ├── TaskManagementWidget.tsx          (existing - update)
│   │   ├── TaskList.tsx                      (new)
│   │   ├── TaskCard.tsx                      (new)
│   │   ├── TaskForm.tsx                      (new - create/edit)
│   │   ├── TaskDetailModal.tsx               (new)
│   │   ├── TaskAssigneeSelector.tsx           (new - multi-select)
│   │   ├── TaskStatusUpdater.tsx             (new)
│   │   └── TodoList.tsx                      (new - to-do list view)
│   ├── questions/
│   │   ├── QuestionList.tsx                  (new)
│   │   ├── QuestionCard.tsx                  (new)
│   │   ├── QuestionForm.tsx                  (new - create)
│   │   ├── QuestionDetailModal.tsx           (new)
│   │   ├── QuestionAnswerForm.tsx            (new)
│   │   └── QuestionRecipientSelector.tsx     (new)
│   └── shared/
│       ├── VisibilitySelector.tsx             (new - Private/Open/General)
│       └── UserSelector.tsx                  (new - hierarchical user picker)
├── pages/
│   ├── tasks.tsx                            (new - full tasks page)
│   └── questions.tsx                        (new - full questions page)
└── hooks/
    ├── useTasks.ts                          (update existing)
    ├── useQuestions.ts                      (new)
    ├── useTodoList.ts                       (new)
    └── useTaskPermissions.ts                (new)
```

---

## 🚀 Implementation Plan

### Phase 1: Database Schema & Migrations (Week 1)

#### 1.1 Create Migration File
**File**: `migrations/XXXX_add_task_management_features.sql`

**Tasks**:
- [ ] Create `task_assignees` junction table
- [ ] Create `questions` table
- [ ] Create `question_recipients` junction table
- [ ] Create `task_updates` table
- [ ] Add `visibility` column to `tasks` table
- [ ] Create indexes for performance
- [ ] Add RLS policies for security

#### 1.2 Update TypeScript Schema
**File**: `shared/schema.ts`

**Tasks**:
- [ ] Add `taskAssignees` table definition
- [ ] Add `questions` table definition
- [ ] Add `questionRecipients` table definition
- [ ] Add `taskUpdates` table definition
- [ ] Update `tasks` table to include `visibility`
- [ ] Generate TypeScript types

### Phase 2: Backend API Implementation (Week 1-2)

#### 2.1 Task Permissions Module
**File**: `server/task-permissions.ts` (new)

**Tasks**:
- [ ] Implement `canAssignTaskToUser()` function
- [ ] Implement `canSendQuestionToUser()` function
- [ ] Implement `canViewTask()` function
- [ ] Implement `canEditTask()` function
- [ ] Add unit tests

#### 2.2 Task Storage Module
**File**: `server/task-storage.ts` (new)

**Tasks**:
- [ ] Implement `getTasksForUser()` - with scope filtering
- [ ] Implement `getTaskById()` - with permission check
- [ ] Implement `createTask()` - with multiple assignees
- [ ] Implement `updateTask()` - with permission check
- [ ] Implement `deleteTask()` - with permission check
- [ ] Implement `addTaskAssignees()` - with permission validation
- [ ] Implement `removeTaskAssignee()`
- [ ] Implement `updateAssigneeStatus()` - for to-do list
- [ ] Implement `getTaskUpdates()`
- [ ] Implement `addTaskUpdate()` - for comments/updates
- [ ] Implement `getTodoList()` - tasks assigned to user

#### 2.3 Question Storage Module
**File**: `server/question-storage.ts` (new)

**Tasks**:
- [ ] Implement `getQuestionsForUser()` - with scope filtering
- [ ] Implement `getQuestionById()` - with permission check
- [ ] Implement `createQuestion()` - with multiple recipients
- [ ] Implement `updateQuestion()`
- [ ] Implement `answerQuestion()` - with permission check
- [ ] Implement `addQuestionRecipients()`
- [ ] Implement `markQuestionAsRead()`

#### 2.4 Task Routes
**File**: `server/routes/tasks.ts` (new) or update `server/routes/collaboration.ts`

**Tasks**:
- [ ] GET `/api/collaboration/tasks` - List tasks
- [ ] GET `/api/collaboration/tasks/:id` - Get task
- [ ] POST `/api/collaboration/tasks` - Create task
- [ ] PATCH `/api/collaboration/tasks/:id` - Update task
- [ ] DELETE `/api/collaboration/tasks/:id` - Delete task
- [ ] GET `/api/collaboration/tasks/:id/assignees` - Get assignees
- [ ] POST `/api/collaboration/tasks/:id/assignees` - Add assignees
- [ ] DELETE `/api/collaboration/tasks/:id/assignees/:userId` - Remove assignee
- [ ] PATCH `/api/collaboration/tasks/:id/assignees/:userId/status` - Update status
- [ ] GET `/api/collaboration/tasks/:id/updates` - Get updates
- [ ] POST `/api/collaboration/tasks/:id/updates` - Add update
- [ ] GET `/api/collaboration/tasks/todo` - Get to-do list

#### 2.5 Question Routes
**File**: `server/routes/questions.ts` (new)

**Tasks**:
- [ ] GET `/api/collaboration/questions` - List questions
- [ ] GET `/api/collaboration/questions/:id` - Get question
- [ ] POST `/api/collaboration/questions` - Create question
- [ ] PATCH `/api/collaboration/questions/:id` - Update question
- [ ] DELETE `/api/collaboration/questions/:id` - Delete question
- [ ] POST `/api/collaboration/questions/:id/answer` - Answer question
- [ ] GET `/api/collaboration/questions/:id/recipients` - Get recipients
- [ ] POST `/api/collaboration/questions/:id/recipients` - Add recipients
- [ ] PATCH `/api/collaboration/questions/:id/read` - Mark as read

### Phase 3: Frontend Hooks & Utilities (Week 2)

#### 3.1 Task Hooks
**File**: `client/src/hooks/useTasks.ts` (update)

**Tasks**:
- [ ] Update `useTasks()` - with scope filtering
- [ ] Update `useTask()` - single task
- [ ] Update `useCreateTask()` - with multiple assignees
- [ ] Update `useUpdateTask()`
- [ ] Add `useDeleteTask()`
- [ ] Add `useTaskAssignees()`
- [ ] Add `useAddTaskAssignees()`
- [ ] Add `useRemoveTaskAssignee()`
- [ ] Add `useUpdateAssigneeStatus()` - for to-do
- [ ] Add `useTaskUpdates()`
- [ ] Add `useAddTaskUpdate()`
- [ ] Add `useTodoList()` - user's to-do list

#### 3.2 Question Hooks
**File**: `client/src/hooks/useQuestions.ts` (new)

**Tasks**:
- [ ] Implement `useQuestions()` - list questions
- [ ] Implement `useQuestion()` - single question
- [ ] Implement `useCreateQuestion()` - with multiple recipients
- [ ] Implement `useUpdateQuestion()`
- [ ] Implement `useAnswerQuestion()`
- [ ] Implement `useQuestionRecipients()`
- [ ] Implement `useMarkQuestionAsRead()`

#### 3.3 Permission Hooks
**File**: `client/src/hooks/useTaskPermissions.ts` (new)

**Tasks**:
- [ ] Implement `useCanAssignTaskToUser()` - check if can assign
- [ ] Implement `useCanSendQuestionToUser()` - check if can send
- [ ] Implement `useAvailableUsersForTask()` - get assignable users
- [ ] Implement `useAvailableUsersForQuestion()` - get sendable users

### Phase 4: Frontend Components (Week 2-3)

#### 4.1 Shared Components
**Files**: `client/src/components/shared/`

**Tasks**:
- [ ] Create `VisibilitySelector.tsx` - Private/Open/General selector
- [ ] Create `UserSelector.tsx` - Hierarchical user picker with permission filtering
- [ ] Create `StatusBadge.tsx` - Reusable status badge
- [ ] Create `PriorityBadge.tsx` - Reusable priority badge

#### 4.2 Task Components
**Files**: `client/src/components/tasks/`

**Tasks**:
- [ ] Update `TaskManagementWidget.tsx` - use real API data
- [ ] Create `TaskList.tsx` - List view with filters
- [ ] Create `TaskCard.tsx` - Individual task card
- [ ] Create `TaskForm.tsx` - Create/edit form with:
  - Title, description
  - Priority, status
  - Task type
  - Visibility selector
  - Multi-assignee selector
  - Due date
- [ ] Create `TaskDetailModal.tsx` - Full task details with:
  - Task info
  - Assignees list
  - Updates/comments feed
  - Status update form
- [ ] Create `TaskAssigneeSelector.tsx` - Multi-select with permission filtering
- [ ] Create `TaskStatusUpdater.tsx` - Quick status update component
- [ ] Create `TodoList.tsx` - To-do list view for assigned tasks

#### 4.3 Question Components
**Files**: `client/src/components/questions/`

**Tasks**:
- [ ] Create `QuestionList.tsx` - List view with filters
- [ ] Create `QuestionCard.tsx` - Individual question card
- [ ] Create `QuestionForm.tsx` - Create form with:
  - Title, description
  - Question type
  - Visibility selector
  - Multi-recipient selector
- [ ] Create `QuestionDetailModal.tsx` - Full question details with:
  - Question info
  - Recipients list
  - Answer form (if not answered)
  - Answer display (if answered)
- [ ] Create `QuestionAnswerForm.tsx` - Answer input form
- [ ] Create `QuestionRecipientSelector.tsx` - Multi-select with permission filtering

#### 4.4 Pages
**Files**: `client/src/pages/`

**Tasks**:
- [ ] Create `tasks.tsx` - Full tasks management page
- [ ] Create `questions.tsx` - Full questions page
- [ ] Update navigation/routing to include new pages

### Phase 5: Notifications & Real-time Updates (Week 3)

#### 5.1 WebSocket Integration
**Tasks**:
- [ ] Add task creation notifications
- [ ] Add task assignment notifications
- [ ] Add task status update notifications
- [ ] Add question creation notifications
- [ ] Add question answer notifications
- [ ] Add real-time updates to task/question lists

#### 5.2 Notification System
**Tasks**:
- [ ] Create notification component
- [ ] Integrate with existing notification system
- [ ] Add notification preferences

### Phase 6: Testing & Refinement (Week 4)

#### 6.1 Testing
**Tasks**:
- [ ] Unit tests for permission functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for task creation flow
- [ ] E2E tests for question flow
- [ ] Permission boundary testing
- [ ] Multi-assignee testing

#### 6.2 Documentation
**Tasks**:
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide for task management
- [ ] User guide for questions

---

## 🔐 Security Considerations

1. **Permission Enforcement**: All API endpoints must validate permissions server-side
2. **Scope Filtering**: Users can only see tasks/questions within their scope
3. **RLS Policies**: Database-level row security for tenant isolation
4. **Input Validation**: Validate all inputs, especially user IDs and permissions
5. **Audit Logging**: Log all task/question operations for compliance

---

## 📊 Data Flow Examples

### Creating a Task
```
1. User fills TaskForm
2. Frontend validates assignees using useCanAssignTaskToUser()
3. POST /api/collaboration/tasks with assignee IDs
4. Backend validates permissions using canAssignTaskToUser()
5. Create task record
6. Create task_assignees records
7. Send notifications to assignees
8. Return created task
9. Frontend updates task list
```

### Updating Task Status (To-Do)
```
1. User updates status in TodoList
2. PATCH /api/collaboration/tasks/:id/assignees/:userId/status
3. Backend validates user is assignee
4. Update task_assignees.status
5. Create task_updates record
6. Notify other assignees and creator
7. Return updated status
8. Frontend updates UI
```

### Answering a Question
```
1. User fills QuestionAnswerForm
2. POST /api/collaboration/questions/:id/answer
3. Backend validates user can answer (creator or recipient)
4. Update questions table (answer, answered_by, answered_at)
5. Create notification for all recipients
6. Return updated question
7. Frontend updates question display
```

---

## 🎯 Success Criteria

- [ ] Super Admin can delegate tasks to any user
- [ ] Corporate Admin can delegate to Super Admin + tenant users
- [ ] Program Admin can delegate to Corporate Admin + program users
- [ ] Program User can delegate to Program Admin + program users
- [ ] Any user can send questions to Super Admin
- [ ] Super Admin can send questions to any user
- [ ] Tenant users can send questions to tenant users
- [ ] Tasks/Questions support multiple recipients
- [ ] To-Do list shows all assigned tasks
- [ ] Status updates work correctly
- [ ] Private/Open labels function properly
- [ ] All updates visible to all attached users
- [ ] Notifications work correctly
- [ ] Permission boundaries enforced

---

## 📝 Notes

- Consider adding task templates for common task types
- Consider adding question categories/tags
- Consider adding task dependencies
- Consider adding recurring tasks
- Consider adding task attachments
- Consider adding task time tracking
- Consider adding task analytics/reporting

