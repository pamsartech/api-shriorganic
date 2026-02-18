import express from "express";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    fetchAllPayments,
    getPaymentDetails,
    refundPayment
} from "../controllers/razorpayController.js";
import { authMiddelware, adminAuthMiddelware } from "../middlewares/auth.js";

const router = express.Router();

// User routes
// router.post("/order", authMiddelware, createRazorpayOrder);
router.post("/verify", authMiddelware, verifyRazorpayPayment);

// Admin routes
router.get("/payments", adminAuthMiddelware, fetchAllPayments);
router.get("/payments/:paymentId", adminAuthMiddelware, getPaymentDetails);
router.post("/payments/:paymentId/refund", adminAuthMiddelware, refundPayment);

export default router;
