/**
 * Hook for fetching and managing kanban board data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string | null;
  program_id?: string | null;
  corporate_client_id?: string | null;
  board_type: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color?: string | null;
  wip_limit?: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  cards?: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string | null;
  task_id?: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  assigned_to?: string | null;
  created_by: string;
  corporate_client_id?: string | null;
  program_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardWithColumns extends KanbanBoard {
  columns: KanbanColumn[];
}

/**
 * Fetch all boards for the current user's scope
 */
export function useKanbanBoards() {
  return useQuery<KanbanBoard[]>({
    queryKey: ['kanban', 'boards'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/kanban/boards');
        const data = await response.json();
        console.log('✅ [Kanban] Fetched boards:', data);
        return data || [];
      } catch (error) {
        console.error('❌ [Kanban] Error fetching boards:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single board with columns and cards
 */
export function useKanbanBoard(boardId: string | null) {
  return useQuery<KanbanBoardWithColumns>({
    queryKey: ['kanban', 'boards', boardId],
    queryFn: async () => {
      if (!boardId) throw new Error('Board ID is required');
      try {
        const response = await apiRequest('GET', `/api/kanban/boards/${boardId}`);
        const data = await response.json();
        console.log('✅ [Kanban] Fetched board:', boardId, data);
        return data;
      } catch (error) {
        console.error('❌ [Kanban] Error fetching board:', boardId, error);
        throw error;
      }
    },
    enabled: !!boardId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Create a new kanban board
 */
export function useCreateKanbanBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      program_id?: string;
      corporate_client_id?: string;
      board_type?: string;
    }) => {
      const response = await apiRequest('POST', '/api/kanban/boards', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards'] });
    },
  });
}

/**
 * Update a kanban board
 */
export function useUpdateKanbanBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: Partial<KanbanBoard> }) => {
      const response = await apiRequest('PATCH', `/api/kanban/boards/${boardId}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards'] });
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', variables.boardId] });
    },
  });
}

/**
 * Delete a kanban board
 */
export function useDeleteKanbanBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      await apiRequest('DELETE', `/api/kanban/boards/${boardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards'] });
    },
  });
}

