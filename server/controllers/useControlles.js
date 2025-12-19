import { User } from "../models/userModel.js";


// To Get The all the users in admin side
export const getusers = async (req, res) => {
    try {
        const allUsers = await User.find({ is_deleted: false }).select("-Password");


        res.status(200).json({
            success: true,
            message: "List of all the users details",
            data: allUsers
        })

    } catch (error) {

        res.status(404).json({
            success: false,
            error: error,
            message: "failed to fetch the users !!"
        })
    }

}


// To get the user details by the user id
export const getUserById = async (req, res) => {

    try {
        const { userId } = req.params;

        const userDetails = await User.findOne({ _id: userId }).select("-Password");


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
// to bulk delete the user details
export const bulkDeleteUser = async (req, res) => {
    try {
        const { UserIds } = req.body;
        const bulkDeletedUser = await User.deleteMany({ _id: { $in: UserIds } });
        res.status(200).json({
            success: true,
            message: "Users bulk deleted successfully",
            data: bulkDeletedUser
        })
    } catch (error) {

        console.log("user bulk delete Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}

// to make the user active and inactive
export const makeUserActive = async (req, res) => {
    try {
        const { userId } = req.params;
        const makeUserActive = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true });
        res.status(200).json({
            success: true,
            message: "User made active successfully",
            data: makeUserActive
        })
    } catch (error) {

        console.log("user make active Error", error);

        res.status(400).json({
            success: false,
            error: "error",
            message: error
        })
    }
}