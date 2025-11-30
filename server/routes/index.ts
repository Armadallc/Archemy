import express from "express";
import authRoutes from "./auth";
import bulkRoutes from "./bulk";
import calendarRoutes from "./calendar";
import dashboardRoutes from "./dashboard";
import mobileRoutes from "./mobile";
import notificationsRoutes from "./notifications";
import vehiclesRoutes from "./vehicles";
import featureFlagsRoutes from "./feature-flags";
import permissionsRoutes from "./permissions";
import clientsRoutes from "./clients";
import driversRoutes from "./drivers";
import locationsRoutes from "./locations";
import tripsRoutes from "./trips";
import usersRoutes from "./users";
import corporateRoutes from "./corporate";
import programsRoutes from "./programs";
import clientNotificationsRoutes from "./client-notifications";
import activityLogRoutes from "./activity-log";
import discussionsRoutes from "./discussions";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { corporateClientsStorage } from "../minimal-supabase";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/bulk", bulkRoutes);
router.use("/calendar", calendarRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/mobile", mobileRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/feature-flags", featureFlagsRoutes);
router.use("/permissions", permissionsRoutes);
router.use("/clients", clientsRoutes);
router.use("/drivers", driversRoutes);
router.use("/locations", locationsRoutes);
router.use("/trips", tripsRoutes);
router.use("/users", usersRoutes);
router.use("/corporate", corporateRoutes);
router.use("/programs", programsRoutes);
router.use("/client-notifications", clientNotificationsRoutes);
router.use("/activity-log", activityLogRoutes);
router.use("/discussions", discussionsRoutes);

// Alias route for corporate-clients (frontend compatibility)
router.get("/corporate-clients", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CORPORATE_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    // Add caching headers (5 minutes - corporate clients don't change often)
    res.set('Cache-Control', 'private, max-age=300');
    res.json(corporateClients);
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    res.status(500).json({ message: "Failed to fetch corporate clients" });
  }
});

export default router;
