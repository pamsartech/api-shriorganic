import express from "express";
import {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    hardDeleteBlog,
    getAllAdminBlogs
} from "../controllers/BlogController.js";
import { authMiddelware, adminAuthMiddelware } from "../middlewares/auth.js";

const router = express.Router();

import upload from "../middlewares/multer.js";
// ... existing imports ...

// Public Routes
router.get("/", getAllBlogs);
router.get("/admin", adminAuthMiddelware, getAllAdminBlogs); // Must be before /:id
router.get("/:id", getBlogById);
router.post("/create", authMiddelware, upload.single("image"), createBlog);
router.delete("/:id", authMiddelware, deleteBlog);
router.put("/:id", adminAuthMiddelware, upload.single("image"), updateBlog);


// Admin Only Routes
router.delete("/hard-delete/:id", adminAuthMiddelware, hardDeleteBlog);
export default router;
