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

