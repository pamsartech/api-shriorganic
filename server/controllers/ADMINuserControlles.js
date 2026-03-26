import { User } from "../models/userModel.js";
import Order from "../models/OrderModel.js";
import redisClient from "../config/redisClient.js";

// To Get The all the users in admin side
export const getusers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `users:${page}:${limit}`;

    // 🔹 Cache check
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 🔹 Run queries in parallel
    const [users, totalCount] = await Promise.all([
      User.find({ is_deleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-Password")
        .lean(),

      User.countDocuments({ is_deleted: false }),
    ]);

    const userIds = users.map((u) => u._id);

    // 🔹 Aggregation ONLY for paginated users
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: { $in: userIds },
          is_deleted: false,
          paymentstatus: { $in: ["paid", "success"] },
        },
      },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: "$totalPrice" },
        },
      },
    ]);

    // 🔹 Map stats
    const statsMap = Object.fromEntries(
      orderStats.map((s) => [
        String(s._id),
        { totalOrders: s.totalOrders, totalSpend: s.totalSpend },
      ])
    );

    const enrichedUsers = users.map((user) => ({
      ...user,
      totalOrders: statsMap[String(user._id)]?.totalOrders || 0,
      totalSpend: statsMap[String(user._id)]?.totalSpend || 0,
    }));

    const response = {
      success: true,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalUsers: totalCount,
      data: enrichedUsers,
    };

    // 🔹 Cache result
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};


// To get the user details by the user id
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `user:${userId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.status(200).json(JSON.parse(cached));

    const user = await User.findById(userId)
      .select("-Password")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await redisClient.setEx(cacheKey, 1800, JSON.stringify(user));

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// to update the user details
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    ).lean();

    await invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      message: "User updated",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// to delete the user details
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId).lean();

    await invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      message: "User deleted",
      data: deletedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// to soft delete the user details
export const softDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { is_deleted: true },
      { new: true }
    ).lean();

    await invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      message: "User soft deleted",
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// to bulk soft delete the user details

export const bulkDeleteUser = async (req, res) => {
  try {
    const { UserIds } = req.body;

    await User.updateMany(
      { _id: { $in: UserIds } },
      { is_deleted: true }
    );

    await Promise.all(UserIds.map((id) => invalidateUserCache(id)));

    res.status(200).json({
      success: true,
      message: "Users soft deleted",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// to make the user active and inactive
// to make the user active and inactive
export const makeUserActive = async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      [{ $set: { isActive: { $not: "$isActive" } } }],
      { new: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      message: updatedUser.isActive ? "User blocked" : "User unblocked",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
