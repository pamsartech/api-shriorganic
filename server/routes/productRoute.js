import express from "express";
import {
    getallproducts, getproduct, deleteBulkProducts, getBestSellingProducts, getActiveProducts, search
} from "../controllers/productContorollers.js";


const router = express.Router();

router.get("/search", search)
router.get("/", getallproducts);
router.get("/best-selling-products", getBestSellingProducts);
router.get("/active-products", getActiveProducts);
router.get("/:id", getproduct);
router.post("/bulk-delete", deleteBulkProducts)

export default router;
