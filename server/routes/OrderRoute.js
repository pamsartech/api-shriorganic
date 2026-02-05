import express from "express";
import {
    placeOrder, viewOrders, viewOrderDetails,
    cancelOrder, getAllOrders, softDeleteOrder, bulkSoftDeleteOrder, hardDeleteOrder,
    getOrderById, updateOrderById, searchOrderById, verifyPayment
} from "../controllers/orderController.js";
import { authMiddelware } from "../middlewares/auth.js";

const router = express.Router();




// User Routes
router.post("/place-order", authMiddelware, placeOrder);
// verify
router.post("/verify-payment", authMiddelware, verifyPayment);
router.get("/", authMiddelware, viewOrders);
router.get("/orderdetails/:orderId", authMiddelware, viewOrderDetails);
router.post("/cancel-order/:orderId", authMiddelware, cancelOrder);

// Generic Routes (Must be last)
router.get("/search/:orderId", authMiddelware, searchOrderById);
router.get("/:orderId", authMiddelware, getOrderById);
router.put("/:orderId", authMiddelware, updateOrderById);


export default router;
