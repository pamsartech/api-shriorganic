import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlistController.js";
import { authMiddelware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add", authMiddelware, addToWishlist);
router.delete("/remove/:productId", authMiddelware, removeFromWishlist);
router.get("/", authMiddelware, getWishlist);

export default router;
