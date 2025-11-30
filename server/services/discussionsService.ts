import { supabase } from '../minimal-supabase';
import { findMentionedUsers } from '../utils/mentionParser';

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
  author?: {
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  parentMessage?: DiscussionMessage | null; // For replies
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
  participants?: Array<{
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  }>;
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
  otherParticipant?: {
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  is_pinned?: boolean; // User-specific
  is_muted?: boolean; // User-specific
}

/**
 * Get all discussions for a user
 */
export async function getDiscussions(
  userId: string,
  options: {
    type?: 'personal' | 'group';
    userRole: string;
    corporateClientId: string | null;
    primaryProgramId: string | null;
    authorizedPrograms: string[];
  }
): Promise<Discussion[]> {
  const { type, userRole, corporateClientId, primaryProgramId, authorizedPrograms } = options;

  // First, get all discussion IDs where the user is a participant (and hasn't left)
  console.log('🔍 [DISCUSSIONS SERVICE] Fetching discussions for user:', userId);
  const { data: participantData, error: participantError } = await supabase
    .from('discussion_participants')
    .select('discussion_id')
    .eq('user_id', userId)
    .is('left_at', null); // Only get discussions where user hasn't left

  if (participantError) {
    console.error('❌ [DISCUSSIONS SERVICE] Error fetching discussion participants:', participantError);
    console.error('❌ [DISCUSSIONS SERVICE] Error details:', JSON.stringify(participantError, null, 2));
    throw participantError;
  }

  console.log('🔍 [DISCUSSIONS SERVICE] Found participants:', participantData?.length || 0);
  console.log('🔍 [DISCUSSIONS SERVICE] Participant data:', JSON.stringify(participantData?.slice(0, 3), null, 2));

  // Also check for discussions where user has sent messages (in case they're not in participants table)
  let discussionIdsFromMessages: string[] = [];
  if (!participantData || participantData.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No participants found. Checking for discussions with user messages...');
    const { data: messagesData, error: messagesError } = await supabase
      .from('discussion_messages')
      .select('discussion_id')
      .eq('created_by', userId)
      .is('deleted_at', null);

    if (!messagesError && messagesData && messagesData.length > 0) {
      discussionIdsFromMessages = [...new Set(messagesData.map((m: any) => m.discussion_id).filter(Boolean))];
      console.log('🔍 [DISCUSSIONS SERVICE] Found discussions from messages:', discussionIdsFromMessages.length);
    }
  }

  const participantDiscussionIds = participantData ? participantData.map((p: any) => p.discussion_id).filter(Boolean) : [];
  const discussionIds = [...new Set([...participantDiscussionIds, ...discussionIdsFromMessages])];
  
  console.log('🔍 [DISCUSSIONS SERVICE] Discussion IDs to fetch:', discussionIds);
  console.log('🔍 [DISCUSSIONS SERVICE] - From participants:', participantDiscussionIds.length);
  console.log('🔍 [DISCUSSIONS SERVICE] - From messages:', discussionIdsFromMessages.length);

  if (discussionIds.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No valid discussion IDs found.');
    return [];
  }

  // Get discussions
  let discussionsQuery = supabase
    .from('discussions')
    .select('*')
    .in('id', discussionIds)
    .is('archived_at', null);

  if (type) {
    discussionsQuery = discussionsQuery.eq('discussion_type', type);
  }

  // Role-based filtering (only apply if not super_admin)
  if (userRole !== 'super_admin') {
    if (userRole === 'corporate_admin' && corporateClientId) {
      discussionsQuery = discussionsQuery.eq('corporate_client_id', corporateClientId);
    } else if ((userRole === 'program_admin' || userRole === 'program_user') && primaryProgramId && authorizedPrograms.length > 0) {
      discussionsQuery = discussionsQuery.in('program_id', authorizedPrograms);
    }
  }

  // Order by last_message_at (nulls last), then by created_at
  // Note: Supabase doesn't support multiple order() calls, so we'll sort in memory if needed
  discussionsQuery = discussionsQuery.order('last_message_at', { ascending: false, nullsFirst: false });

  const { data: discussionsData, error: discussionsError } = await discussionsQuery;

  if (discussionsError) {
    console.error('❌ [DISCUSSIONS SERVICE] Error fetching discussions:', discussionsError);
    console.error('❌ [DISCUSSIONS SERVICE] Error details:', JSON.stringify(discussionsError, null, 2));
    throw discussionsError;
  }

  console.log('🔍 [DISCUSSIONS SERVICE] Found discussions:', discussionsData?.length || 0);
  if (discussionsData && discussionsData.length > 0) {
    console.log('🔍 [DISCUSSIONS SERVICE] Sample discussion:', JSON.stringify(discussionsData[0], null, 2));
  }

  if (!discussionsData || discussionsData.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No discussions found after filtering.');
    console.log('ℹ️ [DISCUSSIONS SERVICE] User role:', userRole);
    console.log('ℹ️ [DISCUSSIONS SERVICE] Corporate client ID:', corporateClientId);
    console.log('ℹ️ [DISCUSSIONS SERVICE] Primary program ID:', primaryProgramId);
    console.log('ℹ️ [DISCUSSIONS SERVICE] Authorized programs:', authorizedPrograms);
    return [];
  }

  // Sort discussions: first by last_message_at (nulls last), then by created_at
  const sortedDiscussions = [...(discussionsData || [])].sort((a, b) => {
    // If both have last_message_at, sort by that
    if (a.last_message_at && b.last_message_at) {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    }
    // If only one has last_message_at, it comes first
    if (a.last_message_at && !b.last_message_at) return -1;
    if (!a.last_message_at && b.last_message_at) return 1;
    // If neither has last_message_at, sort by created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const discussionsMap = new Map<string, any>();
  sortedDiscussions.forEach((disc: any) => {
    discussionsMap.set(disc.id, disc);
  });

  // Get all participants for these discussions (including pinned/muted status)
  // Only get active participants (left_at is null)
  console.log('🔍 [DISCUSSIONS SERVICE] Fetching participants for discussions:', discussionIds);
  
  // Try to fetch with is_pinned and is_muted columns first
  let allParticipants: any[] | null = null;
  let participantsError: any = null;
  
  const { data: participantsWithFlags, error: errorWithFlags } = await supabase
    .from('discussion_participants')
    .select('discussion_id, user_id, joined_at, last_read_message_id, last_read_at, is_pinned, is_muted')
    .in('discussion_id', discussionIds)
    .is('left_at', null); // Only get active participants

  // If is_pinned/is_muted columns don't exist, try without them
  if (errorWithFlags && errorWithFlags.code === '42703' && 
      (errorWithFlags.message?.includes('is_pinned') || errorWithFlags.message?.includes('is_muted'))) {
    console.log('⚠️ [DISCUSSIONS SERVICE] is_pinned/is_muted columns do not exist, fetching without them');
    const { data: participantsWithoutFlags, error: errorWithoutFlags } = await supabase
      .from('discussion_participants')
      .select('discussion_id, user_id, joined_at, last_read_message_id, last_read_at')
      .in('discussion_id', discussionIds)
      .is('left_at', null);
    
    allParticipants = participantsWithoutFlags;
    participantsError = errorWithoutFlags;
    // Add default values for is_pinned and is_muted
    if (allParticipants) {
      allParticipants = allParticipants.map((p: any) => ({ ...p, is_pinned: false, is_muted: false }));
    }
  } else {
    allParticipants = participantsWithFlags;
    participantsError = errorWithFlags;
  }

  if (participantsError) {
    console.error('❌ [DISCUSSIONS SERVICE] Error fetching discussion participants:', participantsError);
    console.error('❌ [DISCUSSIONS SERVICE] Error details:', JSON.stringify(participantsError, null, 2));
  } else {
    console.log('🔍 [DISCUSSIONS SERVICE] Found participants:', allParticipants?.length || 0);
  }

  // Fetch user details separately (more reliable than foreign key relationships)
  const participantUserIds = new Set<string>();
  if (allParticipants) {
    allParticipants.forEach((p: any) => {
      if (p.user_id) participantUserIds.add(p.user_id);
    });
  }

  const userDetailsMap = new Map<string, any>();
  if (participantUserIds.size > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
      .in('user_id', Array.from(participantUserIds));

    if (usersError) {
      console.error('❌ [DISCUSSIONS SERVICE] Error fetching user details:', usersError);
    } else if (users) {
      users.forEach((user: any) => {
        userDetailsMap.set(user.user_id, user);
      });
      console.log('🔍 [DISCUSSIONS SERVICE] Fetched user details for', users.length, 'users');
    }
  }

  // Get last messages for discussions
  console.log('🔍 [DISCUSSIONS SERVICE] Fetching last messages for discussions:', discussionIds);
  const { data: lastMessages, error: messagesError } = await supabase
    .from('discussion_messages')
    .select('id, discussion_id, content, created_by, created_at, updated_at')
    .in('discussion_id', discussionIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (messagesError) {
    console.error('❌ [DISCUSSIONS SERVICE] Error fetching last messages:', messagesError);
    console.error('❌ [DISCUSSIONS SERVICE] Error details:', JSON.stringify(messagesError, null, 2));
  } else {
    console.log('🔍 [DISCUSSIONS SERVICE] Found last messages:', lastMessages?.length || 0);
  }

  // Fetch message author details separately
  const messageAuthorIds = new Set<string>();
  if (lastMessages) {
    lastMessages.forEach((msg: any) => {
      if (msg.created_by) messageAuthorIds.add(msg.created_by);
    });
  }

  const messageAuthorMap = new Map<string, any>();
  if (messageAuthorIds.size > 0) {
    const { data: messageAuthors, error: authorsError } = await supabase
      .from('users')
      .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
      .in('user_id', Array.from(messageAuthorIds));

    if (authorsError) {
      console.error('❌ [DISCUSSIONS SERVICE] Error fetching message authors:', authorsError);
    } else if (messageAuthors) {
      messageAuthors.forEach((user: any) => {
        messageAuthorMap.set(user.user_id, user);
      });
    }
  }

  // Organize participants and messages by discussion
  const participantsByDiscussion = new Map<string, any[]>();
  const messagesByDiscussion = new Map<string, any>();

  if (allParticipants) {
    allParticipants.forEach((p: any) => {
      const discussionId = p.discussion_id;
      if (!participantsByDiscussion.has(discussionId)) {
        participantsByDiscussion.set(discussionId, []);
      }
      const userDetails = userDetailsMap.get(p.user_id);
      if (userDetails) {
        participantsByDiscussion.get(discussionId)!.push({
          ...userDetails,
          joined_at: p.joined_at,
          last_read_message_id: p.last_read_message_id,
          last_read_at: p.last_read_at,
          is_pinned: p.is_pinned || false,
          is_muted: p.is_muted || false,
        });
      }
    });
  }

  if (lastMessages) {
    // Get the most recent message per discussion
    const messageMap = new Map<string, any>();
    lastMessages.forEach((msg: any) => {
      const discussionId = msg.discussion_id;
      if (!messageMap.has(discussionId)) {
        messageMap.set(discussionId, msg);
      }
    });
    messageMap.forEach((msg, discussionId) => {
      messagesByDiscussion.set(discussionId, {
        id: msg.id,
        discussion_id: msg.discussion_id,
        content: msg.content,
        created_by: msg.created_by,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        author: messageAuthorMap.get(msg.created_by) || null,
      });
    });
  }

  // Build final discussions array
  const discussions: Discussion[] = Array.from(discussionsMap.values()).map((disc: any) => {
    const participants = participantsByDiscussion.get(disc.id) || [];
    const lastMessage = messagesByDiscussion.get(disc.id) || null;

    // For personal chats, find the other participant
    let otherParticipant = null;
    if (disc.discussion_type === 'personal' && participants.length > 0) {
      otherParticipant = participants.find((p: any) => p.user_id !== userId) || null;
    }

    // Get user-specific pinned/muted status
    const userParticipant = allParticipants?.find(
      (p: any) => p.discussion_id === disc.id && p.user_id === userId
    );

    return {
      ...disc,
      participants,
      participantDetails: participants.map((p: any) => ({
        user_id: p.user_id,
        role: p.role,
        joined_at: p.joined_at,
        last_read_message_id: p.last_read_message_id,
        last_read_at: p.last_read_at,
        is_pinned: p.is_pinned || false,
        is_muted: p.is_muted || false,
      })),
      lastMessage,
      otherParticipant,
      is_pinned: userParticipant?.is_pinned || false,
      is_muted: userParticipant?.is_muted || false,
    };
  });

  // CRITICAL FIX: Deduplicate discussions by participant set
  // Group discussions by sorted participant IDs (composite key)
  const discussionsByParticipantSet = new Map<string, Discussion>();
  
  discussions.forEach((discussion) => {
    // Create a composite key from sorted participant IDs
    const participantIds = (discussion.participants || [])
      .map((p: any) => p.user_id)
      .sort()
      .join(',');
    
    const existingDiscussion = discussionsByParticipantSet.get(participantIds);
    
    if (!existingDiscussion) {
      // First discussion with this participant set
      discussionsByParticipantSet.set(participantIds, discussion);
    } else {
      // Duplicate found - keep the one with the most recent message
      const existingLastMessageTime = existingDiscussion.lastMessage 
        ? new Date(existingDiscussion.lastMessage.created_at).getTime() 
        : 0;
      const currentLastMessageTime = discussion.lastMessage 
        ? new Date(discussion.lastMessage.created_at).getTime() 
        : 0;
      
      // If current discussion has a more recent message, or existing has no message, replace it
      if (currentLastMessageTime > existingLastMessageTime || 
          (existingLastMessageTime === 0 && currentLastMessageTime === 0 && 
           new Date(discussion.created_at).getTime() > new Date(existingDiscussion.created_at).getTime())) {
        console.log(`🔄 [DISCUSSIONS SERVICE] Replacing duplicate discussion ${existingDiscussion.id} with ${discussion.id} (more recent)`);
        discussionsByParticipantSet.set(participantIds, discussion);
      } else {
        console.log(`ℹ️ [DISCUSSIONS SERVICE] Keeping existing discussion ${existingDiscussion.id}, skipping duplicate ${discussion.id}`);
      }
    }
  });

  const deduplicatedDiscussions = Array.from(discussionsByParticipantSet.values());
  
  // Sort by last message time (most recent first)
  deduplicatedDiscussions.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  console.log('🔍 [DISCUSSIONS SERVICE] Returning', deduplicatedDiscussions.length, 'deduplicated discussions (from', discussions.length, 'total)');
  return deduplicatedDiscussions;
}

/**
 * Get messages for a discussion
 */
export async function getDiscussionMessages(
  discussionId: string,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<DiscussionMessage[]> {
  const { limit = 50, offset = 0 } = options;

  console.log('🔍 [DISCUSSIONS SERVICE] getDiscussionMessages called for discussion:', discussionId, 'user:', userId);

  // Verify user is a participant OR has sent messages in this discussion
  const { data: participant, error: participantError } = await supabase
    .from('discussion_participants')
    .select('discussion_id')
    .eq('discussion_id', discussionId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  // Also check if user has sent messages (in case they're not in participants table)
  let hasMessages = false;
  if (participantError || !participant) {
    console.log('🔍 [DISCUSSIONS SERVICE] User not found in participants, checking if they have messages');
    const { data: userMessages, error: messagesCheckError } = await supabase
      .from('discussion_messages')
      .select('id')
      .eq('discussion_id', discussionId)
      .eq('created_by', userId)
      .is('deleted_at', null)
      .limit(1);

    if (messagesCheckError) {
      console.error('❌ [DISCUSSIONS SERVICE] Error checking user messages:', messagesCheckError);
    } else {
      hasMessages = (userMessages && userMessages.length > 0);
      console.log('🔍 [DISCUSSIONS SERVICE] User has messages:', hasMessages);
    }
  }

  if ((participantError || !participant) && !hasMessages) {
    console.error('❌ [DISCUSSIONS SERVICE] User is not a participant and has no messages in this discussion');
    throw new Error('User is not a participant in this discussion');
  }

  // Get messages (try with reactions column, fallback without if column doesn't exist)
  let messages: any[] | null = null;
  let messagesError: any = null;
  
  // First try with reactions column
  const { data: messagesWithReactions, error: errorWithReactions } = await supabase
    .from('discussion_messages')
    .select('id, discussion_id, content, parent_message_id, created_by, read_by, reactions, created_at, updated_at, deleted_at')
    .eq('discussion_id', discussionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // If reactions column doesn't exist, try without it
  if (errorWithReactions && errorWithReactions.code === '42703' && errorWithReactions.message?.includes('reactions')) {
    console.log('⚠️ [DISCUSSIONS SERVICE] reactions column does not exist, fetching without it');
    const { data: messagesWithoutReactions, error: errorWithoutReactions } = await supabase
      .from('discussion_messages')
      .select('id, discussion_id, content, parent_message_id, created_by, read_by, created_at, updated_at, deleted_at')
      .eq('discussion_id', discussionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    messages = messagesWithoutReactions;
    messagesError = errorWithoutReactions;
    // Add empty reactions array to each message
    if (messages) {
      messages = messages.map(msg => ({ ...msg, reactions: [] }));
    }
  } else {
    messages = messagesWithReactions;
    messagesError = errorWithReactions;
  }

  if (messagesError) {
    console.error('Error fetching discussion messages:', messagesError);
    throw messagesError;
  }

  // Fetch message author details separately
  const messageAuthorIds = new Set<string>();
  if (messages) {
    messages.forEach((msg: any) => {
      if (msg.created_by) messageAuthorIds.add(msg.created_by);
    });
  }

  const messageAuthorMap = new Map<string, any>();
  if (messageAuthorIds.size > 0) {
    const { data: messageAuthors, error: authorsError } = await supabase
      .from('users')
      .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
      .in('user_id', Array.from(messageAuthorIds));

    if (!authorsError && messageAuthors) {
      messageAuthors.forEach((user: any) => {
        messageAuthorMap.set(user.user_id, user);
      });
    }
  }

  // Get parent messages for replies
  const parentMessageIds = new Set<string>();
  if (messages) {
    messages.forEach((msg: any) => {
      if (msg.parent_message_id) parentMessageIds.add(msg.parent_message_id);
    });
  }

  const parentMessageMap = new Map<string, any>();
  if (parentMessageIds.size > 0) {
    const { data: parentMessages, error: parentError } = await supabase
      .from('discussion_messages')
      .select('id, content, created_by, created_at')
      .in('id', Array.from(parentMessageIds));

    if (!parentError && parentMessages) {
      parentMessages.forEach((pm: any) => {
        const author = messageAuthorMap.get(pm.created_by);
        parentMessageMap.set(pm.id, {
          id: pm.id,
          content: pm.content,
          created_by: pm.created_by,
          created_at: pm.created_at,
          author: author || null,
        });
      });
    }
  }

  return (messages || []).map((msg: any) => ({
    id: msg.id,
    discussion_id: msg.discussion_id,
    content: msg.content,
    parent_message_id: msg.parent_message_id,
    created_by: msg.created_by,
    read_by: msg.read_by || [],
    reactions: (msg.reactions || []) as MessageReaction[],
    created_at: msg.created_at,
    updated_at: msg.updated_at,
    deleted_at: msg.deleted_at,
    author: messageAuthorMap.get(msg.created_by) || null,
    parentMessage: msg.parent_message_id ? parentMessageMap.get(msg.parent_message_id) || null : null,
  }));
}

/**
 * Find existing discussion with the same participants
 * Uses sorted participant IDs as a composite key to identify unique conversations
 * Returns the discussion with the most recent message if duplicates exist
 */
async function findExistingDiscussion(
  userId: string,
  participantIds: string[],
  discussionType: 'personal' | 'group'
): Promise<Discussion | null> {
  // Ensure the creator is included and sort for consistent comparison
  const allParticipantIds = [...new Set([userId, ...participantIds])].sort();
  
  console.log('🔍 [DISCUSSIONS SERVICE] Looking for existing discussion with participants:', allParticipantIds);
  console.log('🔍 [DISCUSSIONS SERVICE] Discussion type:', discussionType);

  // Get all discussions where the user is a participant
  const { data: userDiscussions, error: userDiscussionsError } = await supabase
    .from('discussion_participants')
    .select('discussion_id')
    .eq('user_id', userId);

  if (userDiscussionsError || !userDiscussions || userDiscussions.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No discussions found for user');
    return null;
  }

  const discussionIds = userDiscussions.map(d => d.discussion_id);

  // Get discussions with these IDs (filter by type if specified)
  let discussionsQuery = supabase
    .from('discussions')
    .select('id, discussion_type, last_message_at, created_at')
    .in('id', discussionIds)
    .is('archived_at', null);

  if (discussionType === 'personal') {
    discussionsQuery = discussionsQuery.eq('discussion_type', 'personal');
  } else if (discussionType === 'group') {
    discussionsQuery = discussionsQuery.eq('discussion_type', 'group');
  }

  const { data: candidateDiscussions, error: discussionsError } = await discussionsQuery;

  if (discussionsError || !candidateDiscussions || candidateDiscussions.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No candidate discussions found');
    return null;
  }

  // Check each discussion to see if it has the exact same participants
  const matchingDiscussions: Array<{ id: string; last_message_at: string | null; created_at: string }> = [];
  
  for (const discussion of candidateDiscussions) {
    const { data: participants, error: participantsError } = await supabase
      .from('discussion_participants')
      .select('user_id')
      .eq('discussion_id', discussion.id);

    if (!participantsError && participants) {
      const participantUserIds = participants.map(p => p.user_id).sort();
      
      // Check if participants match exactly (same set of users)
      if (
        participantUserIds.length === allParticipantIds.length &&
        participantUserIds.every((id, index) => id === allParticipantIds[index])
      ) {
        matchingDiscussions.push({
          id: discussion.id,
          last_message_at: discussion.last_message_at,
          created_at: discussion.created_at,
        });
      }
    }
  }

  if (matchingDiscussions.length === 0) {
    console.log('ℹ️ [DISCUSSIONS SERVICE] No matching discussion found');
    return null;
  }

  // If multiple matches, pick the one with the most recent message (or most recent creation if no messages)
  matchingDiscussions.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const bestMatch = matchingDiscussions[0];
  console.log(`✅ [DISCUSSIONS SERVICE] Found ${matchingDiscussions.length} matching discussion(s), using most recent:`, bestMatch.id);

  // Fetch the full discussion
  const fullDiscussion = await getDiscussions(userId, {
    userRole: 'super_admin',
    corporateClientId: null,
    primaryProgramId: null,
    authorizedPrograms: [],
  });
  
  return fullDiscussion.find(d => d.id === bestMatch.id) || null;
}

/**
 * Create a new discussion
 * First checks if a discussion with the same participants already exists
 */
export async function createDiscussion(
  userId: string,
  data: {
    discussion_type?: 'personal' | 'group';
    title?: string;
    participant_user_ids: string[];
    corporate_client_id?: string | null;
    program_id?: string | null;
    is_open?: boolean;
    tagged_user_ids?: string[];
    tagged_roles?: string[];
  }
): Promise<Discussion> {
  const {
    discussion_type = 'group',
    title,
    participant_user_ids,
    corporate_client_id,
    program_id,
    is_open = true,
    tagged_user_ids,
    tagged_roles,
  } = data;

  // Ensure the creator is included in participants
  const allParticipantIds = [...new Set([userId, ...participant_user_ids])];

  // Determine actual discussion type based on participant count
  const actualDiscussionType = allParticipantIds.length === 2 ? 'personal' : 'group';

  // Check if a discussion with the same participants already exists
  console.log('🔍 [DISCUSSIONS SERVICE] Checking for existing discussion before creating new one');
  const existingDiscussion = await findExistingDiscussion(
    userId,
    participant_user_ids,
    actualDiscussionType
  );

  if (existingDiscussion) {
    console.log('✅ [DISCUSSIONS SERVICE] Reusing existing discussion:', existingDiscussion.id);
    return existingDiscussion;
  }

  console.log('🆕 [DISCUSSIONS SERVICE] Creating new discussion');

  // Create the discussion
  const { data: discussion, error: discussionError } = await supabase
    .from('discussions')
    .insert({
      discussion_type: actualDiscussionType, // Use determined type
      title: title || null,
      created_by: userId,
      corporate_client_id: corporate_client_id || null,
      program_id: program_id || null,
      is_open,
      tagged_user_ids: tagged_user_ids || null,
      tagged_roles: tagged_roles || null,
    })
    .select()
    .single();

  if (discussionError) {
    console.error('Error creating discussion:', discussionError);
    throw discussionError;
  }

  // Add participants
  const participants = allParticipantIds.map(user_id => ({
    discussion_id: discussion.id,
    user_id,
    joined_at: new Date().toISOString(),
  }));

  const { error: participantsError } = await supabase
    .from('discussion_participants')
    .insert(participants);

  if (participantsError) {
    console.error('Error adding participants:', participantsError);
    // Try to clean up the discussion if participants failed
    await supabase.from('discussions').delete().eq('id', discussion.id);
    throw participantsError;
  }

  // Fetch the complete discussion with participants
  const fullDiscussion = await getDiscussions(userId, {
    userRole: 'super_admin', // Use super_admin to bypass filtering
    corporateClientId: null,
    primaryProgramId: null,
    authorizedPrograms: [],
  });

  return fullDiscussion.find(d => d.id === discussion.id) || discussion as any;
}

/**
 * Send a message in a discussion
 */
export async function sendDiscussionMessage(
  discussionId: string,
  userId: string,
  content: string,
  parent_message_id?: string | null
): Promise<DiscussionMessage> {
  // Verify user is a participant
  const { data: participant, error: participantError } = await supabase
    .from('discussion_participants')
    .select('discussion_id')
    .eq('discussion_id', discussionId)
    .eq('user_id', userId)
    .single();

  if (participantError || !participant) {
    throw new Error('User is not a participant in this discussion');
  }

  // Parse mentions from message content and find user IDs
  const mentionedUserIds = await findMentionedUsers(content, supabase, userId);
  console.log('🔍 [DISCUSSIONS SERVICE] Found mentioned user IDs:', mentionedUserIds);

  // If there are mentions, add them as participants
  if (mentionedUserIds.length > 0) {
    // Check which users are already participants
    const { data: existingParticipants, error: existingError } = await supabase
      .from('discussion_participants')
      .select('user_id')
      .eq('discussion_id', discussionId)
      .in('user_id', mentionedUserIds);

    if (!existingError) {
      const existingUserIds = new Set(
        (existingParticipants || []).map((p: any) => p.user_id)
      );

      // Add users who aren't already participants
      const newParticipantIds = mentionedUserIds.filter(id => !existingUserIds.has(id));

      if (newParticipantIds.length > 0) {
        console.log('🔍 [DISCUSSIONS SERVICE] Adding new participants:', newParticipantIds);
        const newParticipants = newParticipantIds.map(user_id => ({
          discussion_id: discussionId,
          user_id,
          joined_at: new Date().toISOString(),
        }));

        const { error: addParticipantsError } = await supabase
          .from('discussion_participants')
          .insert(newParticipants);

        if (addParticipantsError) {
          console.error('❌ [DISCUSSIONS SERVICE] Error adding mentioned users as participants:', addParticipantsError);
          // Don't throw - message should still be sent even if adding participants fails
        } else {
          console.log('✅ [DISCUSSIONS SERVICE] Successfully added', newParticipantIds.length, 'mentioned users as participants');
        }
      }
    }
  }

  // Create the message
  const { data: message, error: messageError } = await supabase
    .from('discussion_messages')
    .insert({
      discussion_id: discussionId,
      content,
      created_by: userId,
      parent_message_id: parent_message_id || null,
      read_by: [userId], // Mark as read by sender
      reactions: [], // Initialize empty reactions array
    })
    .select()
    .single();

  if (messageError) {
    console.error('Error creating message:', messageError);
    throw messageError;
  }

  // Update discussion's last_message_at and last_message_id
  await supabase
    .from('discussions')
    .update({
      last_message_id: message.id,
      last_message_at: message.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', discussionId);

  // Fetch user details for the author
  const { data: author, error: authorError } = await supabase
    .from('users')
    .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
    .eq('user_id', userId)
    .single();

  // Get parent message if this is a reply
  let parentMessage = null;
  if (message.parent_message_id) {
    const { data: parent, error: parentError } = await supabase
      .from('discussion_messages')
      .select('id, content, created_by, created_at')
      .eq('id', message.parent_message_id)
      .single();

    if (!parentError && parent) {
      const { data: parentAuthor } = await supabase
        .from('users')
        .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
        .eq('user_id', parent.created_by)
        .single();

      parentMessage = {
        id: parent.id,
        content: parent.content,
        created_by: parent.created_by,
        created_at: parent.created_at,
        author: parentAuthor || null,
      };
    }
  }

  return {
    id: message.id,
    discussion_id: message.discussion_id,
    content: message.content,
    parent_message_id: message.parent_message_id,
    created_by: message.created_by,
    read_by: message.read_by || [],
    reactions: (message.reactions || []) as MessageReaction[],
    created_at: message.created_at,
    updated_at: message.updated_at,
    deleted_at: message.deleted_at,
    author: author || null,
    parentMessage,
  };
}

/**
 * Clean up duplicate discussions by merging them
 * Finds all discussions with the same participant set and merges them into one
 * Keeps the discussion with the most recent message
 */
export async function cleanupDuplicateDiscussions(userId: string): Promise<{
  merged: number;
  deleted: number;
  errors: string[];
}> {
  console.log('🧹 [DISCUSSIONS SERVICE] Starting cleanup of duplicate discussions for user:', userId);
  
  const errors: string[] = [];
  let merged = 0;
  let deleted = 0;

  try {
    // Get all discussions where the user is a participant
    const { data: userDiscussions, error: userDiscussionsError } = await supabase
      .from('discussion_participants')
      .select('discussion_id')
      .eq('user_id', userId);

    if (userDiscussionsError || !userDiscussions || userDiscussions.length === 0) {
      console.log('ℹ️ [DISCUSSIONS SERVICE] No discussions found for user');
      return { merged: 0, deleted: 0, errors: [] };
    }

    const discussionIds = userDiscussions.map(d => d.discussion_id);

    // Get all discussions
    const { data: discussions, error: discussionsError } = await supabase
      .from('discussions')
      .select('id, discussion_type, last_message_at, created_at')
      .in('id', discussionIds)
      .is('archived_at', null);

    if (discussionsError || !discussions || discussions.length === 0) {
      console.log('ℹ️ [DISCUSSIONS SERVICE] No discussions to process');
      return { merged: 0, deleted: 0, errors: [] };
    }

    // Get all participants for these discussions
    const { data: allParticipants, error: participantsError } = await supabase
      .from('discussion_participants')
      .select('discussion_id, user_id')
      .in('discussion_id', discussionIds);

    if (participantsError) {
      errors.push(`Error fetching participants: ${participantsError.message}`);
      return { merged: 0, deleted: 0, errors };
    }

    // Group discussions by participant set (sorted participant IDs as key)
    const discussionsByParticipantSet = new Map<string, Array<{
      id: string;
      last_message_at: string | null;
      created_at: string;
      participants: string[];
    }>>();

    discussions.forEach((discussion) => {
      const discussionParticipants = (allParticipants || [])
        .filter(p => p.discussion_id === discussion.id)
        .map(p => p.user_id)
        .sort();
      
      const participantKey = discussionParticipants.join(',');
      
      if (!discussionsByParticipantSet.has(participantKey)) {
        discussionsByParticipantSet.set(participantKey, []);
      }
      
      discussionsByParticipantSet.get(participantKey)!.push({
        id: discussion.id,
        last_message_at: discussion.last_message_at,
        created_at: discussion.created_at,
        participants: discussionParticipants,
      });
    });

    // Process each group of duplicates
    for (const [participantKey, duplicateDiscussions] of discussionsByParticipantSet.entries()) {
      if (duplicateDiscussions.length <= 1) {
        continue; // No duplicates
      }

      console.log(`🔄 [DISCUSSIONS SERVICE] Found ${duplicateDiscussions.length} duplicate discussions for participants: ${participantKey}`);

      // Sort by last_message_at (most recent first), then by created_at
      duplicateDiscussions.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const keepDiscussion = duplicateDiscussions[0];
      const duplicateIds = duplicateDiscussions.slice(1).map(d => d.id);

      console.log(`✅ [DISCUSSIONS SERVICE] Keeping discussion ${keepDiscussion.id}, merging ${duplicateIds.length} duplicates`);

      // Move all messages from duplicates to the kept discussion
      for (const duplicateId of duplicateIds) {
        try {
          // Update messages to point to the kept discussion
          const { error: updateMessagesError } = await supabase
            .from('discussion_messages')
            .update({ discussion_id: keepDiscussion.id })
            .eq('discussion_id', duplicateId);

          if (updateMessagesError) {
            errors.push(`Error moving messages from ${duplicateId}: ${updateMessagesError.message}`);
            continue;
          }

          // Move participants (avoid duplicates)
          const { data: duplicateParticipants } = await supabase
            .from('discussion_participants')
            .select('user_id')
            .eq('discussion_id', duplicateId);

          if (duplicateParticipants) {
            // Check which participants are already in the kept discussion
            const { data: existingParticipants } = await supabase
              .from('discussion_participants')
              .select('user_id')
              .eq('discussion_id', keepDiscussion.id);

            const existingUserIds = new Set((existingParticipants || []).map(p => p.user_id));
            const newParticipants = duplicateParticipants
              .filter(p => !existingUserIds.has(p.user_id))
              .map(p => ({
                discussion_id: keepDiscussion.id,
                user_id: p.user_id,
                joined_at: new Date().toISOString(),
              }));

            if (newParticipants.length > 0) {
              await supabase
                .from('discussion_participants')
                .insert(newParticipants);
            }
          }

          // Archive the duplicate discussion
          await supabase
            .from('discussions')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', duplicateId);

          merged++;
          deleted++;
        } catch (error: any) {
          errors.push(`Error processing duplicate ${duplicateId}: ${error.message}`);
        }
      }

      // Update the kept discussion's last_message_at to the most recent
      if (keepDiscussion.last_message_at) {
        await supabase
          .from('discussions')
          .update({ 
            last_message_at: keepDiscussion.last_message_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', keepDiscussion.id);
      }
    }

    console.log(`✅ [DISCUSSIONS SERVICE] Cleanup complete: ${merged} discussions merged, ${deleted} duplicates archived`);
    return { merged, deleted, errors };
  } catch (error: any) {
    errors.push(`Fatal error during cleanup: ${error.message}`);
    return { merged, deleted, errors };
  }
}

/**
 * Pin or unpin a discussion for a user
 */
export async function togglePinDiscussion(
  discussionId: string,
  userId: string,
  pinned: boolean
): Promise<void> {
  const { error } = await supabase
    .from('discussion_participants')
    .update({ is_pinned: pinned })
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error toggling pin:', error);
    throw error;
  }
}

/**
 * Mute or unmute a discussion for a user
 */
export async function toggleMuteDiscussion(
  discussionId: string,
  userId: string,
  muted: boolean
): Promise<void> {
  const { error } = await supabase
    .from('discussion_participants')
    .update({ is_muted: muted })
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error toggling mute:', error);
    throw error;
  }
}

/**
 * Delete (archive) a discussion for a user
 * This removes the user from the discussion (soft delete)
 */
export async function deleteDiscussionForUser(
  discussionId: string,
  userId: string
): Promise<void> {
  // Set left_at timestamp to effectively remove user from discussion
  const { error } = await supabase
    .from('discussion_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting discussion for user:', error);
    throw error;
  }
}

/**
 * Mark discussion as read for a user
 */
export async function markDiscussionAsRead(
  discussionId: string,
  userId: string,
  messageId: string
): Promise<void> {
  const { error } = await supabase
    .from('discussion_participants')
    .update({
      last_read_message_id: messageId,
      last_read_at: new Date().toISOString(),
    })
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking discussion as read:', error);
    throw error;
  }
}

/**
 * Add or remove a reaction to a message
 */
export async function toggleMessageReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<DiscussionMessage> {
  // Get current message
  const { data: message, error: messageError } = await supabase
    .from('discussion_messages')
    .select('id, reactions')
    .eq('id', messageId)
    .single();

  if (messageError || !message) {
    throw new Error('Message not found');
  }

  const reactions: MessageReaction[] = (message.reactions || []) as MessageReaction[];
  
  // Check if user already reacted with this emoji
  const existingReactionIndex = reactions.findIndex(
    r => r.user_id === userId && r.emoji === emoji
  );

  let updatedReactions: MessageReaction[];
  if (existingReactionIndex >= 0) {
    // Remove reaction
    updatedReactions = reactions.filter((_, index) => index !== existingReactionIndex);
  } else {
    // Add reaction
    updatedReactions = [
      ...reactions,
      {
        emoji,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    ];
  }

  // Update message
  const { data: updatedMessage, error: updateError } = await supabase
    .from('discussion_messages')
    .update({ reactions: updatedReactions })
    .eq('id', messageId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating message reaction:', updateError);
    throw updateError;
  }

  // Fetch full message with author
  const { data: author, error: authorError } = await supabase
    .from('users')
    .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
    .eq('user_id', updatedMessage.created_by)
    .single();

  return {
    id: updatedMessage.id,
    discussion_id: updatedMessage.discussion_id,
    content: updatedMessage.content,
    parent_message_id: updatedMessage.parent_message_id,
    created_by: updatedMessage.created_by,
    read_by: updatedMessage.read_by || [],
    reactions: updatedReactions,
    created_at: updatedMessage.created_at,
    updated_at: updatedMessage.updated_at,
    deleted_at: updatedMessage.deleted_at,
    author: author || null,
  };
}

