import express from "express";
import {
    placeOrder, viewOrders, viewOrderDetails,
    cancelOrder, getAllOrders, softDeleteOrder, bulkSoftDeleteOrder, hardDeleteOrder,
    getOrderById, updateOrderById, searchOrderById
} from "../controllers/orderController.js";
import { authMiddelware } from "../middlewares/auth.js";

const router = express.Router();


// User Routes
router.post("/place-order", authMiddelware, placeOrder);
router.get("/view-orders", authMiddelware, viewOrders);
router.get("/orderdetails/:orderId", authMiddelware, viewOrderDetails);
router.post("/cancel-order/:orderId", authMiddelware, cancelOrder);

// Admin Routes
router.get("/all-orders", getAllOrders);
router.post("/bulk-soft-delete", bulkSoftDeleteOrder);
router.get("/soft-delete/:orderId", softDeleteOrder);
router.get("/hard-delete/:orderId", hardDeleteOrder);

// Generic Routes (Must be last)
router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrderById);
router.get("/search/:orderId", searchOrderById);


export default router;

