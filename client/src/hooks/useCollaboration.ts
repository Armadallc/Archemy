import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { Task, Comment, Note, InsertTask, InsertComment, InsertNote } from '../../../shared/schema';

// ============================================================================
// TASKS
// ============================================================================

export interface TaskWithUsers extends Task {
  assigned_user?: {
    user_id: string;
    user_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  creator?: {
    user_id: string;
    user_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

export interface TasksFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  linked_type?: string;
  linked_id?: string;
}

export function useTasks(filters?: TasksFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.priority) queryParams.append('priority', filters.priority);
  if (filters?.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
  if (filters?.linked_type) queryParams.append('linked_type', filters.linked_type);
  if (filters?.linked_id) queryParams.append('linked_id', filters.linked_id);

  const queryString = queryParams.toString();
  const url = `/api/collaboration/tasks${queryString ? `?${queryString}` : ''}`;

  return useQuery<TaskWithUsers[]>({
    queryKey: ['collaboration', 'tasks', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useTask(taskId: string) {
  return useQuery<TaskWithUsers>({
    queryKey: ['collaboration', 'tasks', taskId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/collaboration/tasks/${taskId}`);
      return await response.json();
    },
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest('POST', '/api/collaboration/tasks', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTask> }) => {
      const response = await apiRequest('PATCH', `/api/collaboration/tasks/${id}`, data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('DELETE', `/api/collaboration/tasks/${taskId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks'] });
    },
  });
}

// ============================================================================
// COMMENTS
// ============================================================================

export interface CommentWithUser extends Comment {
  creator?: {
    user_id: string;
    user_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  replies?: CommentWithUser[];
}

export interface CommentsFilters {
  source_type: string;
  source_id: string;
  parent_comment_id?: string;
}

export function useComments(filters: CommentsFilters) {
  const queryParams = new URLSearchParams({
    source_type: filters.source_type,
    source_id: filters.source_id,
  });
  if (filters.parent_comment_id) {
    queryParams.append('parent_comment_id', filters.parent_comment_id);
  }

  return useQuery<CommentWithUser[]>({
    queryKey: ['collaboration', 'comments', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/collaboration/comments?${queryParams.toString()}`);
      return await response.json();
    },
    enabled: !!filters.source_type && !!filters.source_id,
    staleTime: 30000,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertComment) => {
      const response = await apiRequest('POST', '/api/collaboration/comments', data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collaboration', 'comments'],
        exact: false,
      });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertComment> }) => {
      const response = await apiRequest('PATCH', `/api/collaboration/comments/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collaboration', 'comments'],
        exact: false,
      });
    },
  });
}

// ============================================================================
// NOTES
// ============================================================================

export interface NoteWithUser extends Note {
  creator?: {
    user_id: string;
    user_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

export interface NotesFilters {
  linked_type?: string;
  linked_id?: string;
  note_type?: string;
  is_private?: boolean;
}

export function useNotes(filters?: NotesFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.linked_type) queryParams.append('linked_type', filters.linked_type);
  if (filters?.linked_id) queryParams.append('linked_id', filters.linked_id);
  if (filters?.note_type) queryParams.append('note_type', filters.note_type);
  if (filters?.is_private !== undefined) queryParams.append('is_private', filters.is_private.toString());

  const queryString = queryParams.toString();
  const url = `/api/collaboration/notes${queryString ? `?${queryString}` : ''}`;

  return useQuery<NoteWithUser[]>({
    queryKey: ['collaboration', 'notes', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    staleTime: 30000,
  });
}

export function useNote(noteId: string) {
  return useQuery<NoteWithUser>({
    queryKey: ['collaboration', 'notes', noteId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/collaboration/notes/${noteId}`);
      return await response.json();
    },
    enabled: !!noteId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertNote) => {
      const response = await apiRequest('POST', '/api/collaboration/notes', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertNote> }) => {
      const response = await apiRequest('PATCH', `/api/collaboration/notes/${id}`, data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'notes', variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest('DELETE', `/api/collaboration/notes/${noteId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'notes'] });
    },
  });
}

