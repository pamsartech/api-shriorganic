import express from "express";
import {
    loginShiprocket,
    createShiprocketOrder,
    trackShipment,
    getAllShipments
} from "../controllers/shipRocket.js";
import { authMiddelware, adminAuthMiddelware } from "../middlewares/auth.js";

const router = express.Router();

// Admin login to Shiprocket (to get and store the token)
router.post("/login", adminAuthMiddelware, loginShiprocket);

// Order/Shipment operations
router.post("/create-order", adminAuthMiddelware, createShiprocketOrder);
router.get("/track/:shipmentId", authMiddelware, trackShipment);
router.get("/shipments", adminAuthMiddelware, getAllShipments);

export default router;
