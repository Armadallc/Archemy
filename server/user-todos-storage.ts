/**
 * User Todos Storage
 * 
 * Manages personal todo list items for individual users
 */
import { supabase } from './minimal-supabase';

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
        position: 0,
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
    due_date?: string | null;
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
    // Update in batch
    for (let index = 0; index < todoIds.length; index++) {
      const { error } = await supabase
        .from('user_todos')
        .update({ position: index })
        .eq('id', todoIds[index])
        .eq('user_id', userId);
      
      if (error) throw error;
    }

    return { success: true };
  },
};

