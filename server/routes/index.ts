import express from "express";
import authRoutes from "./auth";
import mobileRoutes from "./mobile";
import clientsRoutes from "./clients";
import tripsRoutes from "./trips";
import driversRoutes from "./drivers";
import corporateRoutes from "./corporate";
import locationsRoutes from "./locations";
import vehiclesRoutes from "./vehicles";
import calendarRoutes from "./calendar";
import notificationsRoutes from "./notifications";
import dashboardRoutes from "./dashboard";
import bulkRoutes from "./bulk";
import legacyRoutes from "./legacy";
import specialRequirementsRoutes from "./special-requirements";
import { apiLogger, errorHandler, notFoundHandler } from "./middleware";

const router = express.Router();

// ============================================================================
// MAIN ROUTES INDEX
// ============================================================================

// Apply common middleware
router.use(apiLogger);

// Mount route modules
router.use("/auth", authRoutes);
router.use("/mobile", mobileRoutes);
router.use("/clients", clientsRoutes);
router.use("/trips", tripsRoutes);
router.use("/drivers", driversRoutes);
router.use("/corporate", corporateRoutes);
router.use("/locations", locationsRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/calendar", calendarRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/bulk", bulkRoutes);
router.use("/special-requirements", specialRequirementsRoutes);

// Legacy routes for backward compatibility (mounted last to avoid conflicts)
router.use("/", legacyRoutes);

// Error handling
router.use(errorHandler);
// Note: notFoundHandler is commented out to prevent it from catching /api/files/* routes
// The catch-all handler in server/index.ts will handle unmatched routes instead
// router.use(notFoundHandler);

export default router;
