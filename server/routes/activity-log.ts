import express from "express";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { getActivityLog } from "../services/activityLogService";

const router = express.Router();

console.log('🔍 [ACTIVITY LOG ROUTES] Activity log routes module loaded');

/**
 * GET /api/activity-log
 * Get activity log entries for the authenticated user
 * Query parameters:
 * - limit: number of entries to return (default: 50)
 * - offset: number of entries to skip (default: 0)
 * - activityType: filter by activity type
 * - sourceType: filter by source type
 * - mentionsOnly: if true, only return activities where user was mentioned
 * - startDate: filter activities after this date (ISO string)
 * - endDate: filter activities before this date (ISO string)
 */
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [ACTIVITY LOG] GET /api/activity-log endpoint called');
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      limit,
      offset,
      activityType,
      sourceType,
      mentionsOnly,
      startDate,
      endDate,
    } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      activityType: activityType as string | undefined,
      sourceType: sourceType as string | undefined,
      mentionsOnly: mentionsOnly === 'true',
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userRole: req.user.role,
      corporateClientId: req.user.corporateClientId,
      primaryProgramId: req.user.primaryProgramId,
      authorizedPrograms: req.user.authorizedPrograms || [],
    };

    const activities = await getActivityLog(req.user.userId, options);

    // Add caching headers for better performance (60 seconds cache)
    res.set('Cache-Control', 'private, max-age=60');
    res.set('ETag', `"${Date.now()}-${activities.length}"`);
    
    res.json(activities);
  } catch (error: any) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({ 
      message: "Failed to fetch activity log",
      error: error.message 
    });
  }
});

/**
 * GET /api/activity-log/mentions
 * Get activity log entries where the authenticated user was mentioned
 * Same query parameters as GET /api/activity-log
 */
router.get("/mentions", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      limit,
      offset,
      activityType,
      sourceType,
      startDate,
      endDate,
    } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      activityType: activityType as string | undefined,
      sourceType: sourceType as string | undefined,
      mentionsOnly: true, // Always true for mentions endpoint
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userRole: req.user.role,
      corporateClientId: req.user.corporateClientId,
      primaryProgramId: req.user.primaryProgramId,
      authorizedPrograms: req.user.authorizedPrograms || [],
    };

    const activities = await getActivityLog(req.user.userId, options);

    // Add caching headers for better performance (60 seconds cache)
    res.set('Cache-Control', 'private, max-age=60');
    res.set('ETag', `"${Date.now()}-${activities.length}"`);
    
    res.json(activities);
  } catch (error: any) {
    console.error("Error fetching mentioned activities:", error);
    res.status(500).json({ 
      message: "Failed to fetch mentioned activities",
      error: error.message 
    });
  }
});

export default router;



