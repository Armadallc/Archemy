/**
 * Hook for managing kanban cards and columns
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { KanbanCard, KanbanColumn } from './useKanbanBoard';

/**
 * Create a new kanban card
 */
export function useCreateKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      board_id: string;
      column_id: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
      assigned_to?: string;
      task_id?: string;
    }) => {
      const response = await apiRequest('POST', '/api/kanban/cards', data);
      return response.json() as Promise<KanbanCard>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', variables.board_id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

/**
 * Update a kanban card
 */
export function useUpdateKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, data }: { cardId: string; data: Partial<KanbanCard> }) => {
      const response = await apiRequest('PATCH', `/api/kanban/cards/${cardId}`, data);
      return response.json() as Promise<KanbanCard>;
    },
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', card.board_id] });
    },
  });
}

/**
 * Move a kanban card to a different column and/or position
 */
export function useMoveKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, column_id, position }: { cardId: string; column_id: string; position?: number }) => {
      const response = await apiRequest('PATCH', `/api/kanban/cards/${cardId}/move`, { column_id, position });
      return response.json() as Promise<KanbanCard>;
    },
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', card.board_id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

/**
 * Delete a kanban card
 */
export function useDeleteKanbanCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, boardId }: { cardId: string; boardId: string }) => {
      await apiRequest('DELETE', `/api/kanban/cards/${cardId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', variables.boardId] });
    },
  });
}

/**
 * Create a new kanban column
 */
export function useCreateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: { name: string; position?: number; color?: string } }) => {
      const response = await apiRequest('POST', `/api/kanban/boards/${boardId}/columns`, data);
      return response.json() as Promise<KanbanColumn>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

/**
 * Update a kanban column
 */
export function useUpdateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, data }: { columnId: string; data: Partial<KanbanColumn> }) => {
      const response = await apiRequest('PATCH', `/api/kanban/columns/${columnId}`, data);
      return response.json() as Promise<KanbanColumn>;
    },
    onSuccess: (column) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', column.board_id] });
    },
  });
}

/**
 * Delete a kanban column
 */
export function useDeleteKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, boardId }: { columnId: string; boardId: string }) => {
      await apiRequest('DELETE', `/api/kanban/columns/${columnId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'boards', variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

