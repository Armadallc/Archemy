import express from "express";
import authRoutes from "./auth";
import bulkRoutes from "./bulk";
import calendarRoutes from "./calendar";
import dashboardRoutes from "./dashboard";
import mobileRoutes from "./mobile";
import notificationsRoutes from "./notifications";
import vehiclesRoutes from "./vehicles";

const router = express.Router();

// Register all route modules
router.use("/auth", authRoutes);
router.use("/bulk", bulkRoutes);
router.use("/calendar", calendarRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/mobile", mobileRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/vehicles", vehiclesRoutes);

export default router;
