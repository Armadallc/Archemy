/**
 * React hooks for managing discussions (chat threads) and messages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

// ============================================================================
// TYPES
// ============================================================================

export interface DiscussionParticipant {
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface MessageReaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

export interface DiscussionMessage {
  id: string;
  discussion_id: string;
  content: string;
  parent_message_id?: string | null;
  created_by: string;
  read_by?: string[];
  reactions?: MessageReaction[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  author?: DiscussionParticipant;
  parentMessage?: DiscussionMessage | null;
}

export interface Discussion {
  id: string;
  title?: string | null;
  discussion_type: 'personal' | 'group';
  is_open?: boolean;
  tagged_user_ids?: string[];
  tagged_roles?: string[];
  corporate_client_id?: string | null;
  program_id?: string | null;
  created_by: string;
  last_message_id?: string | null;
  last_message_at?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  participants?: DiscussionParticipant[];
  participantDetails?: Array<{
    user_id: string;
    role: string;
    joined_at: string;
    last_read_message_id?: string | null;
    last_read_at?: string | null;
    is_pinned?: boolean;
    is_muted?: boolean;
  }>;
  lastMessage?: DiscussionMessage | null;
  otherParticipant?: DiscussionParticipant | null; // For personal chats
  is_pinned?: boolean; // User-specific
  is_muted?: boolean; // User-specific
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get all discussions for the current user
 */
export function useDiscussions(type?: 'personal' | 'group') {
  return useQuery({
    queryKey: ['discussions', type],
    queryFn: async () => {
      const url = type ? `/api/discussions?type=${type}` : '/api/discussions';
      const response = await apiRequest('GET', url);
      return response.json() as Promise<Discussion[]>;
    },
    refetchInterval: 10000, // Poll every 10 seconds for new discussions (reduced frequency to prevent loops)
    staleTime: 5000, // Consider data fresh for 5 seconds to reduce unnecessary refetches
  });
}

/**
 * Get a single discussion by ID
 */
export function useDiscussion(discussionId: string | null) {
  return useQuery({
    queryKey: ['discussions', discussionId],
    queryFn: async () => {
      if (!discussionId) return null;
      const response = await apiRequest('GET', `/api/discussions/${discussionId}`);
      return response.json() as Promise<Discussion>;
    },
    enabled: !!discussionId,
  });
}

/**
 * Get messages for a discussion
 */
export function useDiscussionMessages(discussionId: string | null, limit = 50) {
  return useQuery({
    queryKey: ['discussions', discussionId, 'messages', limit],
    queryFn: async () => {
      if (!discussionId) return [];
      const response = await apiRequest('GET', `/api/discussions/${discussionId}/messages?limit=${limit}`);
      return response.json() as Promise<DiscussionMessage[]>;
    },
    enabled: !!discussionId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages (more frequent for active chat)
    staleTime: 0, // Always consider data stale to allow refetching
  });
}

/**
 * Create a new discussion
 */
export function useCreateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      discussion_type?: 'personal' | 'group';
      title?: string;
      participant_user_ids: string[];
      corporate_client_id?: string | null;
      program_id?: string | null;
      is_open?: boolean;
      tagged_user_ids?: string[];
      tagged_roles?: string[];
    }) => {
      const response = await apiRequest('POST', '/api/discussions', data);
      return response.json() as Promise<Discussion>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

/**
 * Update a discussion
 */
export function useUpdateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, data }: { discussionId: string; data: { title?: string } }) => {
      const response = await apiRequest('PATCH', `/api/discussions/${discussionId}`, data);
      return response.json() as Promise<Discussion>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.discussionId] });
    },
  });
}

/**
 * Archive or unarchive a discussion
 */
export function useArchiveDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, archived }: { discussionId: string; archived: boolean }) => {
      const response = await apiRequest('PATCH', `/api/discussions/${discussionId}/archive`, { archived });
      return response.json() as Promise<Discussion>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

/**
 * Leave or delete a discussion
 */
export function useLeaveDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, permanent }: { discussionId: string; permanent?: boolean }) => {
      const url = permanent 
        ? `/api/discussions/${discussionId}?permanent=true`
        : `/api/discussions/${discussionId}`;
      const response = await apiRequest('DELETE', url);
      return response.json() as Promise<{ success: boolean; archived?: boolean; deleted?: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

/**
 * Send a message in a discussion
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      content,
      parent_message_id,
    }: {
      discussionId: string;
      content: string;
      parent_message_id?: string | null;
    }) => {
      const response = await apiRequest('POST', `/api/discussions/${discussionId}/messages`, {
        content,
        parent_message_id,
      });
      return response.json() as Promise<DiscussionMessage>;
    },
    onSuccess: (message, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.discussionId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

/**
 * Pin or unpin a discussion
 */
export function usePinDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, pinned }: { discussionId: string; pinned: boolean }) => {
      const response = await apiRequest('PATCH', `/api/discussions/${discussionId}/pin`, { pinned });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

/**
 * Mute or unmute a discussion
 */
export function useMuteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, muted }: { discussionId: string; muted: boolean }) => {
      const response = await apiRequest('PATCH', `/api/discussions/${discussionId}/mute`, { muted });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

/**
 * Delete a discussion (for current user only)
 */
export function useDeleteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discussionId: string) => {
      const response = await apiRequest('DELETE', `/api/discussions/${discussionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

/**
 * Mark discussion as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, messageId }: { discussionId: string; messageId: string }) => {
      const response = await apiRequest('PATCH', `/api/discussions/${discussionId}/read`, { message_id: messageId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.discussionId] });
    },
  });
}

/**
 * Toggle message reaction
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, messageId, emoji }: { discussionId: string; messageId: string; emoji: string }) => {
      const response = await apiRequest('POST', `/api/discussions/${discussionId}/messages/${messageId}/reactions`, { emoji });
      return response.json() as Promise<DiscussionMessage>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.discussionId, 'messages'] });
    },
  });
}

