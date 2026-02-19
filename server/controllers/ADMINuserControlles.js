import { User } from "../models/userModel.js";
import Order from "../models/OrderModel.js";
import redisClient from "../config/redisClient.js";


// To Get The all the users in admin side
export const getusers = async (req, res) => {
    try {

        // const cacheKey = `users:${req.admin.id}`;
        // const cachedUsers = await redisClient.get(cacheKey);
        // if (cachedUsers) {
        //     return res.status(200).json({
        //         success: true,
        //         message: "List of all the users details",
        //         data: JSON.parse(cachedUsers)
        //     });
        // }

        const allUsers = await User.find({ is_deleted: false }).select("-Password").lean();

        // Aggregate order stats per user
        const orderStats = await Order.aggregate([
            { $match: { is_deleted: false, paymentstatus: "Paid" } },
            {
                $group: {
                    _id: "$user",
                    totalOrders: { $sum: 1 },
                    totalSpend: { $sum: "$totalPrice" }
                }
            }
        ]);

        // Build a quick lookup map: userId -> { totalOrders, totalSpend }
        const statsMap = {};
        for (const stat of orderStats) {
            statsMap[String(stat._id)] = {
                totalOrders: stat.totalOrders,
                totalSpend: stat.totalSpend
            };
        }

        // Merge stats into each user
        const enrichedUsers = allUsers.map(user => ({
            ...user,
            totalOrders: statsMap[String(user._id)]?.totalOrders || 0,
            totalSpend: statsMap[String(user._id)]?.totalSpend || 0
        }));



        await redisClient.setEx(cacheKey, 3600, JSON.stringify(enrichedUsers));
        res.status(200).json({
            success: true,
            message: "List of all the users details",
            data: enrichedUsers
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error,
            message: "failed to fetch the users !!"
        });
    }

}


// To get the user details by the user id
export const getUserById = async (req, res) => {

    try {
        const { userId } = req.params;

        const cacheKey = `user:${userId}`;
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
            return res.status(200).json({
                success: true,
                message: "User details",
                data: JSON.parse(cachedUser)
            })
        }

        const userDetails = await User.findOne({ _id: userId }).select("-Password");

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(userDetails));

        if (!userDetails) {

            res.status(404).json({
                success: false,
                message: " User Not Found !"
            })

        } else {
            res.status(200).json({
                success: true,
                message: "user details",
                data: userDetails
            })
        }
    } catch (error) {

        console.log("user Fetch Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }

}

// to update the user details
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email, role }, { new: true });

        // Invalidate caches
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`users:${req.admin.id}`);

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        })
    } catch (error) {

        console.log("user update Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}

// to delete the user details
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedUser = await User.findByIdAndDelete(userId);

        // Invalidate caches
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`users:${req.admin.id}`);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: deletedUser
        })
    } catch (error) {

        console.log("user delete Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}

// to soft delete the user details
export const softDeleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const softDeletedUser = await User.findByIdAndUpdate(userId, { is_deleted: true }, { new: true });

        // Invalidate caches
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`users:${req.admin.id}`);

        res.status(200).json({
            success: true,
            message: "User soft deleted successfully",
            data: softDeletedUser
        })
    } catch (error) {

        console.log("user soft delete Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}

// to bulk soft delete the user details

export const bulkDeleteUser = async (req, res) => {
    try {
        const { UserIds } = req.body;

        // Changed to soft delete (update is_deleted to true)
        const bulkAction = await User.updateMany(
            { _id: { $in: UserIds } },
            { is_deleted: true }
        );

        // Invalidate caches
        if (UserIds && UserIds.length > 0) {
            for (const id of UserIds) {
                await redisClient.del(`user:${id}`);
            }
        }
        await redisClient.del(`users:${req.admin.id}`);

        res.status(200).json({
            success: true,
            message: "Users bulk soft deleted successfully",
            data: bulkAction
        })
    } catch (error) {

        console.log("user bulk soft delete Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}

// to make the user active and inactive
// to make the user active and inactive
export const makeUserActive = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user to get current status
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Toggle the status
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isActive: !user.isActive },
            { new: true }
        );

        // Invalidate caches
        const cacheKeyUser = `user:${userId}`;
        const cacheKeyList = `users:${req.admin.id}`;

        await redisClient.del(cacheKeyUser);
        await redisClient.del(cacheKeyList);

        res.status(200).json({
            success: true,
            message: updatedUser.isActive ? "User Blocked successfully" : "User Unblocked successfully",
            data: updatedUser
        });

    } catch (error) {

        console.log("user status toggle Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error.message || error
        });
    }
}