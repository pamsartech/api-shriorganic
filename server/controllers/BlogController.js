import Blog from "../models/BlogsModel.js";
import cloudinary from "../utils/cloudinary.js";
import redisClient from "../config/redisClient.js";

// Create a new blog
export const createBlog = async (req, res) => {
    try {
        const { title, description, type, category } = req.body;
        let createdBy = null;
        if (req.user) {
            const userId = req.user._id || req.user.id;
            if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                createdBy = userId;
            }
        }

        let image = req.body.image;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "blogs",
            });
            image = result.secure_url;
        }

        const newBlog = new Blog({
            title,
            description,
            image,
            type,
            category,
            createdBy
        });

        const savedBlog = await newBlog.save();

        // Invalidate caches
        await redisClient.del("all_blogs");
        await redisClient.del("all_admin_blogs");

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: savedBlog
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to create blog",
            error: error.message
        });
    }
};

// Get all blogs (not deleted)
export const getAllBlogs = async (req, res) => {
    try {
        const cachedBlogs = await redisClient.get("all_blogs");
        if (cachedBlogs) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                message: "Blogs fetched successfully (cached)",
                blogs: JSON.parse(cachedBlogs)
            });
        }

        const blogs = await Blog.find({ is_deleted: false }).populate("createdBy", "name email");

        await redisClient.set("all_blogs", JSON.stringify(blogs), {
            EX: 3600 // Cache for 1 hour
        });

        res.status(200).json({
            success: true,
            fromCache: false,
            message: "Blogs fetched successfully",
            blogs: blogs
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch blogs",
            error: error.message
        });
    }
};

// Get a single blog by ID
export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;

        const cachedBlog = await redisClient.get(`blog_${id}`);
        if (cachedBlog) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                message: "Blog fetched successfully (cached)",
                blog: JSON.parse(cachedBlog)
            });
        }

        const blog = await Blog.findById(id).populate("createdBy", "name email");

        if (!blog || blog.is_deleted) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        await redisClient.set(`blog_${id}`, JSON.stringify(blog), {
            EX: 3600 // Cache for 1 hour
        });

        res.status(200).json({
            success: true,
            fromCache: false,
            message: "Blog fetched successfully",
            blog: blog
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch blog",
            error: error.message
        });
    }
};

// Update a blog
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const requestData = { ...req.body, ...req.query };
        const { title, description, type, category } = requestData;

        let image = requestData.image;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "blogs",
            });
            image = result.secure_url;
        }

        const updateData = {
            title,
            description,
            type,
            category,
        };

        // Only add image if it exists (either new upload or new url provided)
        if (image) {
            updateData.image = image;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedBlog || updatedBlog.is_deleted) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        // Invalidate caches
        await redisClient.del("all_blogs");
        await redisClient.del("all_admin_blogs");
        await redisClient.del(`blog_${id}`);

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog: updatedBlog
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to update blog",
            error: error.message
        });
    }
};

// Soft delete a blog
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBlog = await Blog.findByIdAndUpdate(id, { is_deleted: true }, { new: true });

        if (!deletedBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        // Invalidate caches
        await redisClient.del("all_blogs");
        await redisClient.del("all_admin_blogs");
        await redisClient.del(`blog_${id}`);

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to delete blog",
            error: error.message
        });
    }
};

// Hard delete a blog (Admin only potentially)
export const hardDeleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBlog = await Blog.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        // Invalidate caches
        await redisClient.del("all_blogs");
        await redisClient.del("all_admin_blogs");
        await redisClient.del(`blog_${id}`);

        res.status(200).json({
            success: true,
            message: "Blog permanently deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to permanently delete blog",
            error: error.message
        });
    }
};


// to get all the admin side blogs
export const getAllAdminBlogs = async (req, res) => {
    try {
        const cachedBlogs = await redisClient.get("all_admin_blogs");
        if (cachedBlogs) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                message: "Blogs fetched successfully (cached)",
                blogs: JSON.parse(cachedBlogs)
            });
        }

        const blogs = await Blog.find().populate("createdBy", "name email");

        await redisClient.set("all_admin_blogs", JSON.stringify(blogs), {
            EX: 3600 // Cache for 1 hour
        });

        res.status(200).json({
            success: true,
            fromCache: false,
            message: "Blogs fetched successfully",
            blogs: blogs
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch blogs",
            error: error.message
        });
    }
};