import express from "express";
import {
    getDashboardStats,
    getSalesTrend,
    getCategoryRevenue,
    getPendingActions,
    getLatestActivities
} from "../controllers/DashBoardControllers.js";
import { adminAuthMiddelware } from "../middlewares/auth.js";

const router = express.Router();

// All routes are admin only
router.use(adminAuthMiddelware);

router.get("/stats", getDashboardStats);
router.get("/sales-trend", getSalesTrend);
router.get("/category-revenue", getCategoryRevenue);
router.get("/pending-actions", getPendingActions);
router.get("/activities", getLatestActivities);

export default router;
