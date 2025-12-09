import express from "express";
import { authMiddelware } from "../middlewares/auth.js";
import { addproducttocart, getcart, removeproduct } from "../controllers/CartController.js";


const router=express.Router();

router.post("/add",authMiddelware,addproducttocart);
router.get("/",authMiddelware,getcart);
router.post("/remove",authMiddelware,removeproduct)

export default router;