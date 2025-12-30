# Personal Todo List - Implementation Plan

## 📋 Overview

A simple, personal Todo list feature that allows individual users to create, manage, and track their own tasks. This is separate from the collaborative task management system and is meant for personal organization.

---

## 🎯 Requirements

### Core Features
- ✅ Users can create personal todos
- ✅ Users can mark todos as complete/incomplete
- ✅ Users can delete todos
- ✅ Users can edit todo text
- ✅ Users can set priority (optional)
- ✅ Users can set due dates (optional)
- ✅ Todos are private to each user
- ✅ Simple, clean UI in the existing TASKS widget

### Non-Requirements (Out of Scope)
- ❌ Sharing todos with other users
- ❌ Assigning todos to others
- ❌ Comments or updates on todos
- ❌ Complex permissions
- ❌ Notifications

---

## 🗄️ Database Schema

### Option 1: Simple Table (Recommended)
Create a dedicated `user_todos` table for personal todos.

```sql
CREATE TABLE user_todos (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  due_date TIMESTAMP,
  position INTEGER DEFAULT 0, -- For drag-and-drop ordering
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX idx_user_todos_user_id_completed ON user_todos(user_id, is_completed);
CREATE INDEX idx_user_todos_user_id_due_date ON user_todos(user_id, due_date);
```

### Option 2: Reuse Tasks Table (Alternative)
Use existing `tasks` table with a flag to indicate personal todos.

**Pros**: Reuses existing infrastructure  
**Cons**: Mixes personal todos with collaborative tasks

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
```

**Recommendation**: Use Option 1 for cleaner separation and simpler queries.

---

## 🔧 Backend Implementation

### 1. Storage Module
**File**: `server/user-todos-storage.ts` (new)

```typescript
import { supabase } from '../supabase-client';

export const userTodosStorage = {
  // Get all todos for a user
  async getUserTodos(userId: string, filters?: {
    completed?: boolean;
    priority?: string;
  }) {
    let query = supabase
      .from('user_todos')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (filters?.completed !== undefined) {
      query = query.eq('is_completed', filters.completed);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get single todo
  async getTodoById(todoId: string, userId: string) {
    const { data, error } = await supabase
      .from('user_todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create todo
  async createTodo(userId: string, todo: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) {
    const { data, error } = await supabase
      .from('user_todos')
      .insert({
        user_id: userId,
        title: todo.title,
        description: todo.description || null,
        priority: todo.priority || 'medium',
        due_date: todo.due_date || null,
        position: 0, // Will be updated if reordering is needed
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update todo
  async updateTodo(todoId: string, userId: string, updates: {
    title?: string;
    description?: string;
    is_completed?: boolean;
    priority?: string;
    due_date?: string;
    position?: number;
  }) {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Set completed_at when marking as complete
    if (updates.is_completed === true) {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.is_completed === false) {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('user_todos')
      .update(updateData)
      .eq('id', todoId)
      .eq('user_id', userId) // Ensure user owns this todo
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete todo
  async deleteTodo(todoId: string, userId: string) {
    const { error } = await supabase
      .from('user_todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId); // Ensure user owns this todo

    if (error) throw error;
    return { success: true };
  },

  // Reorder todos (for drag-and-drop)
  async reorderTodos(userId: string, todoIds: string[]) {
    const updates = todoIds.map((id, index) => ({
      id,
      position: index,
    }));

    // Update in batch
    for (const update of updates) {
      await supabase
        .from('user_todos')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('user_id', userId);
    }

    return { success: true };
  },
};
```

### 2. API Routes
**File**: `server/routes/user-todos.ts` (new)

```typescript
import express from 'express';
import { requireSupabaseAuth, SupabaseAuthenticatedRequest } from '../supabase-auth';
import { userTodosStorage } from '../user-todos-storage';

const router = express.Router();

// GET /api/user-todos - Get all todos for current user
router.get('/', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const { completed, priority } = req.query;

    const filters: any = {};
    if (completed !== undefined) {
      filters.completed = completed === 'true';
    }
    if (priority) {
      filters.priority = priority as string;
    }

    const todos = await userTodosStorage.getUserTodos(userId, filters);
    res.json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Failed to fetch todos', error: error.message });
  }
});

// GET /api/user-todos/:id - Get single todo
router.get('/:id', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const todoId = req.params.id;

    const todo = await userTodosStorage.getTodoById(todoId, userId);
    res.json(todo);
  } catch (error: any) {
    console.error('Error fetching todo:', error);
    res.status(404).json({ message: 'Todo not found', error: error.message });
  }
});

// POST /api/user-todos - Create todo
router.post('/', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const { title, description, priority, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const todo = await userTodosStorage.createTodo(userId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority || 'medium',
      due_date: due_date || undefined,
    });

    res.status(201).json(todo);
  } catch (error: any) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Failed to create todo', error: error.message });
  }
});

// PATCH /api/user-todos/:id - Update todo
router.patch('/:id', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const todoId = req.params.id;
    const updates = req.body;

    const todo = await userTodosStorage.updateTodo(todoId, userId, updates);
    res.json(todo);
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Failed to update todo', error: error.message });
  }
});

// DELETE /api/user-todos/:id - Delete todo
router.delete('/:id', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const todoId = req.params.id;

    await userTodosStorage.deleteTodo(todoId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Failed to delete todo', error: error.message });
  }
});

// POST /api/user-todos/reorder - Reorder todos
router.post('/reorder', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const { todoIds } = req.body;

    if (!Array.isArray(todoIds)) {
      return res.status(400).json({ message: 'todoIds must be an array' });
    }

    await userTodosStorage.reorderTodos(userId, todoIds);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering todos:', error);
    res.status(500).json({ message: 'Failed to reorder todos', error: error.message });
  }
});

export default router;
```

**Register route in `server/index.ts` or `server/routes/index.ts`**:
```typescript
import userTodosRouter from './routes/user-todos';
app.use('/api/user-todos', userTodosRouter);
```

---

## 🎨 Frontend Implementation

### 1. TypeScript Types
**File**: `client/src/types/todos.ts` (new)

```typescript
export interface UserTodo {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  is_completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  position?: number;
}
```

### 2. React Hooks
**File**: `client/src/hooks/useUserTodos.ts` (new)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { UserTodo, CreateTodoInput, UpdateTodoInput } from '../types/todos';

// Get all todos
export function useUserTodos(filters?: { completed?: boolean; priority?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.completed !== undefined) {
    queryParams.append('completed', filters.completed.toString());
  }
  if (filters?.priority) {
    queryParams.append('priority', filters.priority);
  }

  const queryString = queryParams.toString();
  const url = `/api/user-todos${queryString ? `?${queryString}` : ''}`;

  return useQuery<UserTodo[]>({
    queryKey: ['user-todos', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Get single todo
export function useUserTodo(todoId: string) {
  return useQuery<UserTodo>({
    queryKey: ['user-todos', todoId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-todos/${todoId}`);
      return await response.json();
    },
    enabled: !!todoId,
  });
}

// Create todo
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const response = await apiRequest('POST', '/api/user-todos', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-todos'] });
    },
  });
}

// Update todo
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTodoInput }) => {
      const response = await apiRequest('PATCH', `/api/user-todos/${id}`, updates);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-todos'] });
      queryClient.invalidateQueries({ queryKey: ['user-todos', variables.id] });
    },
  });
}

// Delete todo
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/user-todos/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-todos'] });
    },
  });
}

// Toggle todo completion
export function useToggleTodo() {
  const updateTodo = useUpdateTodo();

  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      return updateTodo.mutateAsync({ id, updates: { is_completed } });
    },
  });
}

// Reorder todos
export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoIds: string[]) => {
      const response = await apiRequest('POST', '/api/user-todos/reorder', { todoIds });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-todos'] });
    },
  });
}
```

### 3. Components

#### A. TodoList Component
**File**: `client/src/components/todos/TodoList.tsx` (new)

```typescript
import React from 'react';
import { useUserTodos } from '../../hooks/useUserTodos';
import { useToggleTodo, useDeleteTodo } from '../../hooks/useUserTodos';
import { CheckSquare, Square, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/button';

export function TodoList() {
  const { data: todos = [], isLoading } = useUserTodos();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  const incompleteTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Incomplete Todos */}
      <div className="space-y-2">
        {incompleteTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
            onDelete={() => deleteTodo.mutate(todo.id)}
          />
        ))}
      </div>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Completed</h4>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
              onDelete={() => deleteTodo.mutate(todo.id)}
            />
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No todos yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: {
  todo: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg card-neu-pressed ${
      todo.is_completed ? 'opacity-60' : ''
    }`} style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <button
        onClick={onToggle}
        className="flex-shrink-0"
        aria-label={todo.is_completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.is_completed ? (
          <CheckSquare className="h-5 w-5 text-status-success" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${todo.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-1">{todo.description}</p>
        )}
        {todo.due_date && (
          <p className="text-xs text-muted-foreground mt-1">
            Due: {new Date(todo.due_date).toLocaleDateString()}
          </p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Delete todo"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
```

#### B. TodoForm Component
**File**: `client/src/components/todos/TodoForm.tsx` (new)

```typescript
import React, { useState } from 'react';
import { useCreateTodo } from '../../hooks/useUserTodos';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus } from 'lucide-react';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isOpen, setIsOpen] = useState(false);
  const createTodo = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTodo.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Todo
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <Input
        placeholder="Todo title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm">Add</Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
            setDescription('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

#### C. Update TaskManagementWidget
**File**: `client/src/components/dashboard/TaskManagementWidget.tsx` (update)

Replace the mock data with the TodoList component:

```typescript
import React from "react";
import Widget from "./Widget";
import { TodoList } from "../todos/TodoList";
import { TodoForm } from "../todos/TodoForm";

export default function TaskManagementWidget({ className, shadow }: TaskManagementWidgetProps) {
  return (
    <Widget
      title="TASKS"
      size="medium"
      className={className}
      shadow={shadow}
      titleStyle={{ fontSize: '42px' }}
    >
      <div className="space-y-4" style={{ padding: '8px', margin: '-4px' }}>
        <TodoForm />
        <TodoList />
      </div>
    </Widget>
  );
}
```

---

## 📝 Migration File

**File**: `migrations/XXXX_create_user_todos_table.sql`

```sql
-- ============================================================================
-- PERSONAL TODO LIST
-- Migration: XXXX_create_user_todos_table.sql
-- Description: Creates table for personal user todos
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_todos (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id_completed ON user_todos(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id_due_date ON user_todos(user_id, due_date);

-- RLS Policies (if using Supabase RLS)
ALTER TABLE user_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos"
  ON user_todos FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own todos"
  ON user_todos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own todos"
  ON user_todos FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own todos"
  ON user_todos FOR DELETE
  USING (auth.uid()::text = user_id);
```

---

## ✅ Implementation Checklist

### Backend
- [ ] Create migration file
- [ ] Run migration
- [ ] Create `user-todos-storage.ts`
- [ ] Create `routes/user-todos.ts`
- [ ] Register route in server
- [ ] Test API endpoints

### Frontend
- [ ] Create `types/todos.ts`
- [ ] Create `hooks/useUserTodos.ts`
- [ ] Create `components/todos/TodoList.tsx`
- [ ] Create `components/todos/TodoForm.tsx`
- [ ] Update `TaskManagementWidget.tsx`
- [ ] Test UI components

### Testing
- [ ] Test creating todos
- [ ] Test completing todos
- [ ] Test deleting todos
- [ ] Test editing todos
- [ ] Test filtering (if implemented)
- [ ] Verify todos are user-specific

---

## 🎨 UI Enhancements (Optional)

### Future Enhancements
- Drag-and-drop reordering
- Due date picker
- Priority color coding
- Search/filter todos
- Todo categories/tags
- Archive completed todos
- Keyboard shortcuts
- Bulk actions

---

## 📊 Estimated Time

- **Backend**: 2-3 hours
- **Frontend**: 3-4 hours
- **Testing**: 1-2 hours
- **Total**: ~6-9 hours

---

## 🔐 Security Notes

1. **User Isolation**: All queries filter by `user_id` to ensure users only see their own todos
2. **RLS Policies**: Database-level security (if using Supabase RLS)
3. **API Validation**: Server validates `user_id` from auth token
4. **No Cross-User Access**: No way for users to access others' todos



