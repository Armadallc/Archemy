import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { notificationSystem } from "../notification-system";

const router = express.Router();

// ============================================================================
// NOTIFICATION SYSTEM ROUTES
// ============================================================================

router.get("/templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { type } = req.query;
    const templates = await notificationSystem.getTemplates(type as string);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({ message: "Failed to fetch notification templates" });
  }
});

router.post("/templates", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const template = await notificationSystem.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({ message: "Failed to create notification template" });
  }
});

router.post("/send", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const notification = await notificationSystem.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

router.post("/trip-reminder/:tripId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { tripId } = req.params;
    const { advanceMinutes = 30 } = req.body;
    const result = await notificationSystem.sendTripReminder(tripId, advanceMinutes);
    res.json(result);
  } catch (error) {
    console.error("Error sending trip reminder:", error);
    res.status(500).json({ message: "Failed to send trip reminder" });
  }
});

router.post("/driver-update/:driverId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { updateType, data } = req.body;
    const result = await notificationSystem.sendDriverUpdate(driverId, updateType, data);
    res.json(result);
  } catch (error) {
    console.error("Error sending driver update:", error);
    res.status(500).json({ message: "Failed to send driver update" });
  }
});

router.post("/system-alert", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { alertType, message, targetUsers, priority } = req.body;
    const result = await notificationSystem.sendSystemAlert(alertType, message, targetUsers, priority);
    res.json(result);
  } catch (error) {
    console.error("Error sending system alert:", error);
    res.status(500).json({ message: "Failed to send system alert" });
  }
});

router.post("/process-scheduled", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const result = await notificationSystem.processScheduledNotifications();
    res.json(result);
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
    res.status(500).json({ message: "Failed to process scheduled notifications" });
  }
});

router.get("/preferences/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});

router.patch("/preferences/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});

// Get notifications for current user
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { read, limit = 50 } = req.query;
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (read !== undefined) {
      query = query.eq('read', read === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});

// Mark notification as read
router.patch("/:id/read", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read", error: error.message });
  }
});

// Mark all notifications as read for current user
router.patch("/mark-all-read", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', req.user.userId)
      .eq('read', false)
      .select();

    if (error) throw error;
    res.json({ count: data?.length || 0, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read", error: error.message });
  }
});

// Clear all notifications for current user
router.delete("/clear-all", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', req.user.userId)
      .select();

    if (error) throw error;
    res.json({ count: data?.length || 0, message: "All notifications cleared" });
  } catch (error: any) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications", error: error.message });
  }
});

export default router;




















