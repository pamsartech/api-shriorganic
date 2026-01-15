import express from "express";
import { authMiddelware } from "../middlewares/auth.js";
import { addproducttocart, getcart, removeproduct } from "../controllers/CartController.js";


const router=express.Router();

router.post("/add/:productId",authMiddelware,addproducttocart);
router.get("/",authMiddelware,getcart);
router.post("/remove/:productId",authMiddelware,removeproduct)

export default router;