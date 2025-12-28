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

