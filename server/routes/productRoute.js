import express from "express";
import {
    getallproducts, getproduct, getBestSellingProducts, getActiveProducts
} from "../controllers/productContorollers.js";


const router = express.Router();

router.get("/", getallproducts);
router.get("/best-selling-products", getBestSellingProducts);
router.get("/active-products", getActiveProducts);
router.get("/:id", getproduct);


// //has to move to admin side
// router.post("/new", upload.array("images", 10), adminAuthMiddelware, addproduct);
// router.put("/:id", adminAuthMiddelware, updateproduct);
// router.delete("/bulk-delete", adminAuthMiddelware, bulkDeleteProduct);
// router.delete("/:id", adminAuthMiddelware, deleteproduct);
// router.get("/search/:keyword", searchproduct);
// router.delete("/hard-delete/:id", adminAuthMiddelware, deleteHardDeletedProducts);
// router.get("/soft-delete/:id",adminAuthMiddelware ,softDeleteProduct);
// router.put("/change-status/:id", adminAuthMiddelware, changeProductStatus);
// router.put("/certified/:id", adminAuthMiddelware, addCertifiedProduct);


export default router;
