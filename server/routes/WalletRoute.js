import express from "express";
import { addMoney, getWallet } from "../controllers/walletController.js";
import { authMiddelware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add-money",authMiddelware, addMoney);
router.get("/",authMiddelware, getWallet);

export default router;