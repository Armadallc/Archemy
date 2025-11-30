import express from "express";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { 
  getDiscussions, 
  getDiscussionMessages, 
  createDiscussion, 
  sendDiscussionMessage, 
  cleanupDuplicateDiscussions,
  togglePinDiscussion,
  toggleMuteDiscussion,
  deleteDiscussionForUser,
  markDiscussionAsRead,
  toggleMessageReaction,
  deleteMessage
} from "../services/discussionsService";

const router = express.Router();

console.log('🔍 [DISCUSSIONS ROUTES] Discussions routes module loaded');

/**
 * GET /api/discussions
 * Get all discussions for the authenticated user
 * Query parameters:
 * - type: filter by discussion type ('personal' | 'group')
 */
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [DISCUSSIONS] GET /api/discussions endpoint called');
    console.log('🔍 [DISCUSSIONS] User:', req.user?.userId, 'Role:', req.user?.role);
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { type } = req.query;

    const discussions = await getDiscussions(req.user.userId, {
      type: type as 'personal' | 'group' | undefined,
      userRole: req.user.role,
      corporateClientId: req.user.corporateClientId || null,
      primaryProgramId: req.user.primaryProgramId || null,
      authorizedPrograms: (req.user as any).authorizedPrograms || [],
    });

    console.log('🔍 [DISCUSSIONS] Returning discussions:', discussions.length);

    // Add caching headers (10 seconds - discussions change frequently)
    res.set('Cache-Control', 'private, max-age=10');
    res.set('ETag', `"${Date.now()}-${discussions.length}"`);
    
    res.json(discussions);
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error fetching discussions:", error);
    console.error("❌ [DISCUSSIONS] Error stack:", error.stack);
    console.error("❌ [DISCUSSIONS] Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: "Failed to fetch discussions",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/discussions/:id
 * Delete (archive) a discussion for the current user
 * NOTE: This must come before GET /:id and /:id/messages routes to ensure proper matching
 */
router.delete("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [DISCUSSIONS] DELETE /api/discussions/:id endpoint called');
    console.log('🔍 [DISCUSSIONS] Discussion ID:', req.params.id);
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    console.log('🔍 [DISCUSSIONS] Deleting discussion for user:', req.user.userId);

    await deleteDiscussionForUser(id, req.user.userId);
    console.log('✅ [DISCUSSIONS] Discussion deleted successfully');
    res.status(200).json({ message: "Discussion deleted" });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error deleting discussion:", error);
    console.error("❌ [DISCUSSIONS] Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to delete discussion",
      error: error.message 
    });
  }
});

/**
 * GET /api/discussions/:id
 * Get a single discussion by ID
 */
router.get("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const discussions = await getDiscussions(req.user.userId, {
      userRole: req.user.role,
      corporateClientId: req.user.corporateClientId || null,
      primaryProgramId: req.user.primaryProgramId || null,
      authorizedPrograms: (req.user as any).authorizedPrograms || [],
    });

    const discussion = discussions.find(d => d.id === id);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.json(discussion);
  } catch (error: any) {
    console.error("Error fetching discussion:", error);
    res.status(500).json({ 
      message: "Failed to fetch discussion",
      error: error.message 
    });
  }
});

/**
 * POST /api/discussions
 * Create a new discussion (or return existing one if participants match)
 */
router.post("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [DISCUSSIONS] POST /api/discussions endpoint called');
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      discussion_type,
      title,
      participant_user_ids,
      corporate_client_id,
      program_id,
      is_open,
      tagged_user_ids,
      tagged_roles,
    } = req.body;

    if (!participant_user_ids || !Array.isArray(participant_user_ids) || participant_user_ids.length === 0) {
      return res.status(400).json({ message: "At least one participant is required" });
    }

    const discussion = await createDiscussion(req.user.userId, {
      discussion_type,
      title,
      participant_user_ids,
      corporate_client_id: corporate_client_id || req.user.corporateClientId || null,
      program_id: program_id || req.user.primaryProgramId || null,
      is_open,
      tagged_user_ids,
      tagged_roles,
    });

    // Return 200 if reusing existing, 201 if created new
    const isNew = !discussion.created_at || 
      new Date(discussion.created_at).getTime() > Date.now() - 5000; // Created within last 5 seconds
    
    res.status(isNew ? 201 : 200).json(discussion);
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error creating discussion:", error);
    res.status(500).json({ 
      message: "Failed to create discussion",
      error: error.message 
    });
  }
});

/**
 * GET /api/discussions/:id/messages
 * Get messages for a discussion
 * Query parameters:
 * - limit: number of messages to return (default: 50)
 * - offset: number of messages to skip (default: 0)
 */
router.get("/:id/messages", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [DISCUSSIONS] GET /api/discussions/:id/messages endpoint called');
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { limit, offset } = req.query;

    console.log('🔍 [DISCUSSIONS] Fetching messages for discussion:', id, 'user:', req.user.userId, 'limit:', limit, 'offset:', offset);

    const messages = await getDiscussionMessages(id, req.user.userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    console.log('✅ [DISCUSSIONS] Successfully fetched', messages.length, 'messages');

    // Add caching headers (5 seconds - messages change frequently)
    res.set('Cache-Control', 'private, max-age=5');
    res.set('ETag', `"${Date.now()}-${messages.length}"`);
    
    res.json(messages);
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error fetching discussion messages:", error);
    console.error("❌ [DISCUSSIONS] Error stack:", error.stack);
    console.error("❌ [DISCUSSIONS] Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: "Failed to fetch discussion messages",
      error: error.message 
    });
  }
});

/**
 * POST /api/discussions/:id/messages
 * Send a message in a discussion
 */
router.post("/:id/messages", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [DISCUSSIONS] POST /api/discussions/:id/messages endpoint called');
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { content, parent_message_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Normalize parent_message_id: convert empty string, undefined, or invalid values to null
    const normalizedParentMessageId = parent_message_id && 
      typeof parent_message_id === 'string' && 
      parent_message_id.trim() !== '' 
      ? parent_message_id.trim() 
      : null;

    console.log('🔍 [DISCUSSIONS] Sending message with parent_message_id:', normalizedParentMessageId);

    const message = await sendDiscussionMessage(id, req.user.userId, content.trim(), normalizedParentMessageId);

    res.status(201).json(message);
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error sending message:", error);
    res.status(500).json({ 
      message: "Failed to send message",
      error: error.message 
    });
  }
});

/**
 * POST /api/discussions/cleanup-duplicates
 * Clean up duplicate discussions by merging them
 */
router.post("/cleanup-duplicates", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🧹 [DISCUSSIONS] POST /api/discussions/cleanup-duplicates endpoint called');
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await cleanupDuplicateDiscussions(req.user.userId);

    res.status(200).json({
      message: "Cleanup completed",
      ...result,
    });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error cleaning up duplicates:", error);
    res.status(500).json({ 
      message: "Failed to cleanup duplicates",
      error: error.message 
    });
  }
});

/**
 * PATCH /api/discussions/:id/pin
 * Pin or unpin a discussion for the current user
 */
router.patch("/:id/pin", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { pinned } = req.body;

    if (typeof pinned !== 'boolean') {
      return res.status(400).json({ message: "pinned must be a boolean" });
    }

    await togglePinDiscussion(id, req.user.userId, pinned);
    res.status(200).json({ message: pinned ? "Discussion pinned" : "Discussion unpinned" });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error toggling pin:", error);
    res.status(500).json({ 
      message: "Failed to toggle pin",
      error: error.message 
    });
  }
});

/**
 * PATCH /api/discussions/:id/mute
 * Mute or unmute a discussion for the current user
 */
router.patch("/:id/mute", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { muted } = req.body;

    if (typeof muted !== 'boolean') {
      return res.status(400).json({ message: "muted must be a boolean" });
    }

    await toggleMuteDiscussion(id, req.user.userId, muted);
    res.status(200).json({ message: muted ? "Discussion muted" : "Discussion unmuted" });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error toggling mute:", error);
    res.status(500).json({ 
      message: "Failed to toggle mute",
      error: error.message 
    });
  }
});

/**
 * PATCH /api/discussions/:id/read
 * Mark a discussion as read for the current user
 */
router.patch("/:id/read", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { message_id } = req.body;

    if (!message_id) {
      return res.status(400).json({ message: "message_id is required" });
    }

    await markDiscussionAsRead(id, req.user.userId, message_id);
    res.status(200).json({ message: "Discussion marked as read" });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error marking as read:", error);
    res.status(500).json({ 
      message: "Failed to mark as read",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/discussions/:id/messages/:messageId
 * Delete a message (soft delete)
 * Only the message author can delete their own messages
 */
router.delete("/:id/messages/:messageId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { messageId } = req.params;

    await deleteMessage(messageId, req.user.userId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error deleting message:", error);
    if (error.message === 'Message not found' || error.message === 'Message is already deleted') {
      return res.status(404).json({ 
        message: error.message,
        error: error.message 
      });
    }
    if (error.message === 'You can only delete your own messages') {
      return res.status(403).json({ 
        message: error.message,
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: "Failed to delete message",
      error: error.message 
    });
  }
});

/**
 * POST /api/discussions/:id/messages/:messageId/reactions
 * Add or remove a reaction to a message
 */
router.post("/:id/messages/:messageId/reactions", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "emoji is required" });
    }

    const message = await toggleMessageReaction(messageId, req.user.userId, emoji);
    res.status(200).json(message);
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS] Error toggling reaction:", error);
    res.status(500).json({ 
      message: "Failed to toggle reaction",
      error: error.message 
    });
  }
});

export default router;

