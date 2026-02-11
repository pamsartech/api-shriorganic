import express from "express";
import { adminAuthMiddelware } from "../middlewares/auth.js";
import { getAllOrders, bulkSoftDeleteOrder, softDeleteOrder, hardDeleteOrder, searchOrderById, getOrderById, updateOrderById } from "../controllers/orderController.js";

const router = express.Router();


router.get("/", adminAuthMiddelware, getAllOrders);
router.post("/bulk-soft-delete", adminAuthMiddelware, bulkSoftDeleteOrder);
router.delete("/soft-delete/:orderId", adminAuthMiddelware, softDeleteOrder);
router.delete("/hard-delete/:orderId", adminAuthMiddelware, hardDeleteOrder);
router.get("/search/:orderId", adminAuthMiddelware, searchOrderById);
router.get("/:orderId", adminAuthMiddelware, getOrderById);
router.put("/:orderId", adminAuthMiddelware, updateOrderById);

export default router;