
import express from "express";
import { adminAuthMiddelware } from "../middlewares/auth.js";

import { addproduct, updateproduct, getallproducts,getproduct, deleteproduct, searchproduct, changeProductStatus, bulkDeleteProduct, deleteHardDeletedProducts, softDeleteProduct, addCertifiedProduct } from "../controllers/productContorollers.js";

const router = express.Router();
import upload from "../middlewares/multer.js";


router.get("/", adminAuthMiddelware,getallproducts);
router.post("/new", upload.array("images", 10), adminAuthMiddelware, addproduct);
router.get("/:id", adminAuthMiddelware,getproduct);
router.put("/:id", adminAuthMiddelware, updateproduct);
router.delete("/bulk-delete", adminAuthMiddelware, bulkDeleteProduct);
router.delete("/:id", adminAuthMiddelware, deleteproduct);
router.get("/search/:keyword", adminAuthMiddelware,searchproduct);
router.delete("/hard-delete/:id", adminAuthMiddelware, deleteHardDeletedProducts);
router.get("/soft-delete/:id", adminAuthMiddelware, softDeleteProduct);
router.put("/change-status/:id", adminAuthMiddelware, changeProductStatus);
router.put("/certified/:id", adminAuthMiddelware, addCertifiedProduct);

export default router;