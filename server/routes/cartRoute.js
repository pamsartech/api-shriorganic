import express from "express";
import { authMiddelware } from "../middlewares/auth.js";
import { addproducttocart, getcart, removeproduct, addquantity, removequantity } from "../controllers/CartController.js";


const router = express.Router();

router.post("/add/:productId", authMiddelware, addproducttocart);
router.get("/", authMiddelware, getcart);
router.post("/remove/:productId", authMiddelware, removeproduct)
router.post("/addquantity/:productId", authMiddelware, addquantity)
router.post("/removequantity/:productId", authMiddelware, removequantity)
export default router;