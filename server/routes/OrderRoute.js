import express from "express";
import { placeOrder, viewOrders, viewOrderDetails, cancelOrder } from "../controllers/orderController.js";
import { authMiddelware } from "../middlewares/auth.js";

const router=express.Router();


router.post("/place-order",authMiddelware, placeOrder);
router.get("/view-orders",authMiddelware, viewOrders);
router.get("/orderdetails/:orderId",authMiddelware, viewOrderDetails);
router.post("/cancel-order/:orderId",authMiddelware, cancelOrder);

export default router;

