import { User } from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalSellers = await User.countDocuments({ is_deleted: false }); // Using Users as Sellers for now
        const totalProducts = await Product.countDocuments({ is_deleted: false });
        const totalOrders = await Order.countDocuments({ is_deleted: false });

        // 2. Revenue (Only Paid Orders)
        const revenueData = await Order.aggregate([
            { $match: { paymentstatus: "Paid", is_deleted: false } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // 3. Revenue Trend (Simplified: compare this month vs last month or today vs yesterday)
        // For now, let's just return a mock percentage as seen in the UI
        const revenueTrend = 4.5;

        res.status(200).json({
            success: true,
            data: {
                totalSellers,
                totalProducts,
                totalOrders,
                totalRevenue,
                revenueTrend
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats",
            error: error.message
        });
    }
};

/**
 * @desc    Get Sales Trends (Last 7 Days)
 * @route   GET /api/admin/dashboard/sales-trend
 */
export const getSalesTrend = async (req, res) => {
    try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const trend = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days },
                    is_deleted: false
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$totalPrice" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: trend
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching sales trend",
            error: error.message
        });
    }
};

/**
 * @desc    Get Category Wise Revenue
 * @route   GET /api/admin/dashboard/category-revenue
 */
export const getCategoryRevenue = async (req, res) => {
    try {
        // This requires joining Orders with Products to get categories
        const categoryData = await Order.aggregate([
            { $match: { paymentstatus: "Paid", is_deleted: false } },
            { $unwind: "$cartItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "cartItems.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $addFields: {
                    itemPrice: {
                        $reduce: {
                            input: "$productDetails.sizes",
                            initialValue: 0,
                            in: {
                                $cond: [
                                    { $eq: ["$$this.size", "$cartItems.size"] },
                                    "$$this.price",
                                    "$$value"
                                ]
                            }
                        }
                    }
                }
            },
            // Fallback to first size price if size not found or mismatch
            {
                $addFields: {
                    finalItemPrice: {
                        $cond: [
                            { $gt: ["$itemPrice", 0] },
                            "$itemPrice",
                            { $arrayElemAt: ["$productDetails.sizes.price", 0] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$productDetails.category",
                    revenue: { $sum: { $multiply: ["$cartItems.quantity", "$finalItemPrice"] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // Fix: totalPrice in order is for the whole order. 
        // We should ideally use the price at the time of order if stored, 
        // but since it's not in OrderSchema cartItems, we approximate or use productDetails price.
        // Let's use order.totalPrice for now or fetch item price.

        res.status(200).json({
            success: true,
            data: categoryData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching category revenue",
            error: error.message
        });
    }
};

/**
 * @desc    Get Pending Actions
 * @route   GET /api/admin/dashboard/pending-actions
 */
export const getPendingActions = async (req, res) => {
    try {
        // Example: Users waiting for approval (isActive: false)
        const pendingSellers = await User.find({ isActive: false, is_deleted: false })
            .limit(5)
            .select("FirstName LastName Email createdAt");

        const actions = pendingSellers.map(seller => ({
            type: "Approve new seller",
            detail: `${seller.FirstName} ${seller.LastName} - pending verification`,
            priority: "High priority",
            id: seller._id
        }));

        res.status(200).json({
            success: true,
            data: actions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching pending actions",
            error: error.message
        });
    }
};

/**
 * @desc    Get Latest Activities
 */
export const getLatestActivities = async (req, res) => {
    try {
        const latestOrders = await Order.find({ is_deleted: false })
            .populate("user", "FirstName LastName")
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: latestOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching activities",
            error: error.message
        });
    }
};
