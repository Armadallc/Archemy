import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { calendarSystem } from "../calendar-system";

const router = express.Router();

// ============================================================================
// CALENDAR SYSTEM ROUTES
// ============================================================================

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getProgramCalendar(programId, startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching program calendar:", error);
    res.status(500).json({ message: "Failed to fetch program calendar" });
  }
});

router.get("/corporate/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getCorporateCalendar(corporateClientId, startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching corporate calendar:", error);
    res.status(500).json({ message: "Failed to fetch corporate calendar" });
  }
});

router.get("/universal", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getUniversalCalendar(startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching universal calendar:", error);
    res.status(500).json({ message: "Failed to fetch universal calendar" });
  }
});

router.post("/optimize/ride-sharing/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { date, options } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }
    
    const optimization = await calendarSystem.optimizeRideSharing(programId, date, options);
    res.json(optimization);
  } catch (error) {
    console.error("Error optimizing ride sharing:", error);
    res.status(500).json({ message: "Failed to optimize ride sharing" });
  }
});

router.get("/capacity-forecast/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { days = 7 } = req.query;
    
    const forecast = await calendarSystem.getCapacityForecast(programId, Number(days));
    res.json(forecast);
  } catch (error) {
    console.error("Error generating capacity forecast:", error);
    res.status(500).json({ message: "Failed to generate capacity forecast" });
  }
});

export default router;










