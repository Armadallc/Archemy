# Kanban Board Implementation Plan

**Date:** 2025-01-27  
**Status:** Planning Phase  
**Priority:** High

---

## 🎯 Overview

Implement a fully functional Kanban board system that integrates with the existing tasks table, supports drag-and-drop, multi-tenant scoping, and activity logging.

---

## 📋 Current State Analysis

### ✅ What We Have
1. **UI Components**: Full Kanban board components with drag-and-drop support (`client/src/components/kanban.tsx`)
2. **Tasks Table**: Existing `tasks` table with status, priority, assignments
3. **Activity Log**: Already supports kanban events (`kanban_card_created`, `kanban_card_moved`, etc.)
4. **Multi-tenant Infrastructure**: Corporate client and program scoping in place
5. **Backend Routes**: Basic task CRUD operations exist

### ❌ What's Missing
1. **Database Tables**: No `kanban_boards`, `kanban_columns`, or `kanban_cards` tables
2. **Backend API**: No kanban-specific endpoints
3. **Integration**: Tasks not connected to kanban columns
4. **Persistence**: Drag-and-drop changes not saved
5. **Default Columns**: No predefined column structure

---

## 🏗️ Architecture Decision

### Option A: Separate Kanban Tables (Recommended)
Create dedicated `kanban_boards`, `kanban_columns`, and `kanban_cards` tables. Tasks can be linked to kanban cards.

**Pros:**
- Flexible: Can have multiple boards per program
- Customizable: Each board can have different columns
- Scalable: Supports future features (board templates, custom workflows)
- Clear separation of concerns

**Cons:**
- More complex schema
- Need to sync tasks with cards

### Option B: Tasks as Cards (Simpler)
Use tasks directly as kanban cards, map task status to columns.

**Pros:**
- Simpler: No new tables needed
- Direct: Tasks are cards
- Less code

**Cons:**
- Inflexible: One board per program
- Limited: Can't customize columns per board
- Status mapping: Task status must match column IDs

### ✅ **Decision: Option A (Separate Tables)**
We'll create dedicated kanban tables for maximum flexibility and future scalability.

---

## 📊 Database Schema

### 1. `kanban_boards` Table
```sql
CREATE TABLE kanban_boards (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Multi-tenant scoping
    corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
    program_id VARCHAR(50) REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Board settings
    is_default BOOLEAN DEFAULT false, -- One default board per program
    board_type VARCHAR(50) DEFAULT 'task' CHECK (board_type IN ('task', 'trip', 'custom')),
    
    -- Metadata
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_kanban_boards_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 2. `kanban_columns` Table
```sql
CREATE TABLE kanban_columns (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    board_id VARCHAR(50) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL, -- Order within board (0, 1, 2, ...)
    color VARCHAR(7), -- Hex color for column header
    wip_limit INTEGER, -- Work-in-progress limit (optional)
    
    -- Column settings
    is_default BOOLEAN DEFAULT false, -- Predefined columns (Backlog, To Do, etc.)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_kanban_columns_board FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE,
    UNIQUE(board_id, position) -- Ensure unique positions per board
);
```

### 3. `kanban_cards` Table
```sql
CREATE TABLE kanban_cards (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    board_id VARCHAR(50) NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    column_id VARCHAR(50) NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    
    -- Card content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Link to task (optional - cards can exist without tasks)
    task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Card metadata
    position INTEGER NOT NULL, -- Order within column (0, 1, 2, ...)
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Multi-tenant scoping (inherited from board, but stored for performance)
    corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
    program_id VARCHAR(50) REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_kanban_cards_board FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_kanban_cards_column FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE,
    CONSTRAINT fk_kanban_cards_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_kanban_cards_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_kanban_cards_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(column_id, position) -- Ensure unique positions per column
);
```

### 4. Indexes
```sql
CREATE INDEX idx_kanban_boards_program ON kanban_boards(program_id);
CREATE INDEX idx_kanban_boards_corporate_client ON kanban_boards(corporate_client_id);
CREATE INDEX idx_kanban_columns_board ON kanban_columns(board_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(board_id, position);
CREATE INDEX idx_kanban_cards_board ON kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_task ON kanban_cards(task_id);
CREATE INDEX idx_kanban_cards_position ON kanban_cards(column_id, position);
CREATE INDEX idx_kanban_cards_assigned_to ON kanban_cards(assigned_to);
```

---

## 🔄 Default Column Setup

When a new board is created, automatically create these default columns:

1. **Backlog** (position: 0) - Tasks not yet started
2. **To Do** (position: 1) - Tasks ready to work on
3. **In Progress** (position: 2) - Tasks currently being worked on
4. **In Review** (position: 3) - Tasks awaiting review/approval
5. **Done** (position: 4) - Completed tasks

---

## 🛠️ Implementation Phases

### Phase 1: Database & Schema ✅
- [x] Create migration file for kanban tables
- [ ] Update Drizzle schema (`shared/schema.ts`)
- [ ] Apply migration to database
- [ ] Create default board and columns for existing programs

### Phase 2: Backend API Routes
- [ ] **GET `/api/kanban/boards`** - List boards (filtered by program/corporate client)
- [ ] **POST `/api/kanban/boards`** - Create new board
- [ ] **GET `/api/kanban/boards/:boardId`** - Get board with columns and cards
- [ ] **PATCH `/api/kanban/boards/:boardId`** - Update board
- [ ] **DELETE `/api/kanban/boards/:boardId`** - Delete board
- [ ] **GET `/api/kanban/boards/:boardId/columns`** - Get columns for board
- [ ] **POST `/api/kanban/boards/:boardId/columns`** - Create column
- [ ] **PATCH `/api/kanban/columns/:columnId`** - Update column (name, position, color)
- [ ] **DELETE `/api/kanban/columns/:columnId`** - Delete column
- [ ] **GET `/api/kanban/columns/:columnId/cards`** - Get cards in column
- [ ] **POST `/api/kanban/cards`** - Create card
- [ ] **PATCH `/api/kanban/cards/:cardId`** - Update card (title, description, etc.)
- [ ] **PATCH `/api/kanban/cards/:cardId/move`** - Move card to different column/position
- [ ] **DELETE `/api/kanban/cards/:cardId`** - Delete card
- [ ] **POST `/api/kanban/cards/:cardId/link-task`** - Link card to existing task
- [ ] **POST `/api/kanban/cards/:cardId/create-task`** - Create task from card

### Phase 3: Activity Logging
- [ ] Log `kanban_card_created` when card is created
- [ ] Log `kanban_card_moved` when card is moved between columns
- [ ] Log `kanban_column_created` when column is created
- [ ] Log `kanban_column_deleted` when column is deleted
- [ ] Include metadata: `board_id`, `column_id`, `previous_column_id`, `position`

### Phase 4: Frontend Integration
- [ ] Create `useKanbanBoard` hook for fetching board data
- [ ] Create `useKanbanCards` hook for card operations
- [ ] Update `activity-feed.tsx` to use real kanban data
- [ ] **Implement drag-and-drop persistence**:
  - Use `onDropOverColumn` callback in `KanbanBoardColumn` to handle card drops
  - Use `onDropOverListItem` callback in `KanbanBoardColumnListItem` for positioning
  - Use `useDndEvents()` hook to monitor drag events (`onDragEnd` for persistence)
  - Call API to update card `column_id` and `position` on drop
- [ ] **Card Data Structure**: Ensure cards have `data` prop with `{ id, title, description, ... }`
- [ ] Add "Create Card" functionality
- [ ] Add "Edit Card" dialog (inline editing with `KanbanBoardCardTextarea`)
- [ ] Add "Link to Task" functionality
- [ ] Add "Create Task from Card" functionality
- [ ] Display card priority, due date, assignee
- [ ] Add column management (create, edit, delete, reorder)
- [ ] Use `useJsLoaded()` hook for skeleton loading states

### Phase 5: Task Integration
- [ ] Add "Create Card from Task" button in task management
- [ ] Sync task status with card column (optional)
- [ ] Show linked task info on card
- [ ] Navigate to task from card

### Phase 6: Multi-tenant Scoping
- [ ] Filter boards by current program/corporate client
- [ ] Ensure users can only see boards they have access to
- [ ] Create default board when program is created (optional)

---

## 🔄 Drag-and-Drop Implementation Details

### How the Kanban Board Drag-and-Drop Works

The kanban board uses HTML5 Drag and Drop API with custom event handlers:

1. **Card Drag Start**: 
   - `KanbanBoardCard` component sets `draggable={true}`
   - On `onDragStart`, it calls `event.dataTransfer.setData(DATA_TRANSFER_TYPES.CARD, JSON.stringify(data))`
   - The `data` prop must contain at least `{ id: string }` but can include any card data

2. **Column Drop Handler**:
   ```typescript
   <KanbanBoardColumn
     columnId={column.id}
     onDropOverColumn={(dataTransferData) => {
       const cardData = JSON.parse(dataTransferData);
       // Update card: set column_id to column.id, position to end of column
       moveCard(cardData.id, column.id, -1); // -1 means append to end
     }}
   >
   ```

3. **Card Position Drop Handler**:
   ```typescript
   <KanbanBoardColumnListItem
     cardId={existingCard.id}
     onDropOverListItem={(dataTransferData, dropDirection) => {
       const cardData = JSON.parse(dataTransferData);
       // dropDirection is 'top' or 'bottom'
       // Calculate new position based on existingCard.position and dropDirection
       const newPosition = dropDirection === 'top' 
         ? existingCard.position 
         : existingCard.position + 1;
       moveCard(cardData.id, column.id, newPosition);
     }}
   >
   ```

4. **Drag End Handler** (for cleanup/activity logging):
   ```typescript
   const { onDragEnd } = useDndEvents();
   
   useDndMonitor({
     onDragEnd: (activeId, overId) => {
       // Log activity: kanban_card_moved
       // overId will be columnId if dropped on column
       // overId will be cardId if dropped on another card
     }
   });
   ```

### Position Management

When moving cards, we need to:
1. **Remove card from old column**: Shift all cards after it up by 1
2. **Insert card into new column**: Shift all cards at/after target position down by 1
3. **Update database**: Batch update all affected card positions

Example position update logic:
```typescript
async function moveCard(cardId: string, newColumnId: string, newPosition: number) {
  // 1. Get current card
  const card = await getCard(cardId);
  const oldColumnId = card.column_id;
  const oldPosition = card.position;
  
  // 2. Remove from old column (if different)
  if (oldColumnId !== newColumnId) {
    await shiftCardsUp(oldColumnId, oldPosition);
  }
  
  // 3. Insert into new column
  await shiftCardsDown(newColumnId, newPosition);
  
  // 4. Update card
  await updateCard(cardId, {
    column_id: newColumnId,
    position: newPosition
  });
}
```

---

## 📝 API Route Examples

### Get Board with Columns and Cards
```typescript
GET /api/kanban/boards/:boardId

Response:
{
  id: "board-123",
  name: "Task Board",
  description: "Main task board",
  program_id: "program-456",
  columns: [
    {
      id: "col-1",
      name: "Backlog",
      position: 0,
      cards: [
        {
          id: "card-1",
          title: "Fix bug",
          description: "Fix the login bug",
          position: 0,
          priority: "high",
          assigned_to: { user_id: "user-1", first_name: "John", last_name: "Doe" },
          task_id: "task-123"
        }
      ]
    }
  ]
}
```

### Move Card
```typescript
PATCH /api/kanban/cards/:cardId/move

Body:
{
  column_id: "col-2",
  position: 0  // New position in target column
}

Response:
{
  id: "card-1",
  column_id: "col-2",
  position: 0,
  updated_at: "2025-01-27T10:00:00Z"
}
```

---

## 🎨 UI/UX Considerations

1. **Default Board**: Each program should have one default board
2. **Column Colors**: Use `KanbanColorCircle` component for column color indicators
3. **Card Priority**: Visual indicators (badges, colors)
4. **Due Dates**: Show overdue cards with warning
5. **Assignee Avatars**: Show assignee avatar on card
6. **WIP Limits**: Display work-in-progress limits on columns
7. **Drag Feedback**: Built-in visual feedback during drag operations (border highlights)
8. **Loading States**: Use `useJsLoaded()` hook with `KanbanBoardColumnSkeleton` until JS is ready
9. **Error Handling**: Toast notifications for errors
10. **Accessibility**: Full keyboard support (space/enter to pick up, arrow keys to move, escape to cancel)
11. **Screen Reader Support**: Automatic announcements via `KanbanBoardAccessibility` component
12. **Inline Editing**: Use `KanbanBoardCardTextarea` for card title/description editing

---

## 🔐 Security & Permissions

1. **Access Control**: Users can only see boards in their program/corporate client
2. **Edit Permissions**: Only admins can create/edit/delete boards and columns
3. **Card Permissions**: Users can create cards, but only assigned users or admins can edit
4. **RLS Policies**: Add Row Level Security policies for kanban tables

---

## 📈 Future Enhancements (Post-MVP)

1. **Board Templates**: Pre-configured board templates
2. **Custom Workflows**: Different column sets for different workflows
3. **Card Attachments**: File attachments on cards
4. **Card Comments**: Comments on cards (link to existing comments table)
5. **Card Tags**: Tag system for cards
6. **Card Checklists**: Subtasks within cards
7. **Board Sharing**: Share boards with specific users
8. **Card History**: Track all changes to cards
9. **Bulk Operations**: Move multiple cards at once
10. **Card Filtering**: Filter cards by assignee, priority, due date

---

## 🧪 Testing Checklist

- [ ] Create board
- [ ] Create column
- [ ] Create card
- [ ] Move card between columns
- [ ] Reorder cards within column
- [ ] Reorder columns
- [ ] Link card to task
- [ ] Create task from card
- [ ] Delete card
- [ ] Delete column
- [ ] Delete board
- [ ] Multi-tenant filtering (users only see their program's boards)
- [ ] Activity log entries created correctly
- [ ] Drag-and-drop persistence
- [ ] Error handling (invalid moves, permissions, etc.)

---

## 📚 Files to Create/Modify

### New Files
- `migrations/0041_create_kanban_tables.sql`
- `server/routes/kanban.ts`
- `server/services/kanbanService.ts` (optional - for complex logic)
- `client/src/hooks/useKanbanBoard.ts`
- `client/src/hooks/useKanbanCards.ts`
- `client/src/components/kanban/KanbanBoardContainer.tsx` (wrapper)

### Modified Files
- `shared/schema.ts` - Add kanban table schemas
- `server/routes/index.ts` - Register kanban routes
- `server/services/activityLogService.ts` - Add kanban logging helpers
- `client/src/pages/activity-feed.tsx` - Replace mock data with real data, implement drag-and-drop handlers
- `client/src/components/kanban.tsx` - (No changes needed - component is complete)

---

## ⏱️ Estimated Timeline

- **Phase 1 (Database)**: 1-2 hours
- **Phase 2 (Backend API)**: 3-4 hours
- **Phase 3 (Activity Logging)**: 1 hour
- **Phase 4 (Frontend Integration)**: 4-5 hours
- **Phase 5 (Task Integration)**: 2-3 hours
- **Phase 6 (Multi-tenant)**: 1-2 hours
- **Testing & Polish**: 2-3 hours

**Total**: ~14-20 hours

---

## 🚀 Getting Started

1. Start with Phase 1: Create database migration
2. Test migration in development
3. Build backend API routes
4. Test API with Postman/curl
5. Integrate frontend
6. Test end-to-end workflow
7. Add activity logging
8. Polish UI/UX

---

## 📝 Notes

### Kanban Component API
- **Cards**: Must have `data` prop with object containing at least `{ id: string }`
- **Drag Events**: Use `useDndEvents()` hook to access `onDragStart`, `onDragOver`, `onDragEnd`, etc.
- **Drop Handlers**: 
  - `KanbanBoardColumn` has `onDropOverColumn?: (dataTransferData: string) => void`
  - `KanbanBoardColumnListItem` has `onDropOverListItem?: (dataTransferData: string, dropDirection: 'top' | 'bottom') => void`
- **Data Transfer**: Cards use `DATA_TRANSFER_TYPES.CARD` ('kanban-board-card') to transfer JSON stringified card data
- **Accessibility**: Full keyboard and screen reader support built-in

### Data Model
- Cards can exist without tasks (standalone kanban items)
- Tasks can exist without cards (not all tasks need to be on kanban)
- When a card is linked to a task, we can optionally sync status
- Default board is created automatically for each program
- Columns can be reordered by updating position values
- Cards can be reordered by updating position values within column

### Implementation Details
- Use `KanbanBoardColumnListItem` for precise card positioning (top/bottom of other cards)
- Use `KanbanBoardColumn` `onDropOverColumn` for dropping cards into empty columns
- Parse `dataTransferData` as JSON to get card ID and other data
- Update card `column_id` and `position` in database on successful drop
- Use `useDndEvents().onDragEnd` to trigger persistence after drop completes

