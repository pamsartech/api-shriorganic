import Admin from "../models/AdminModel";
import bcrypt from "bcrypt";

// to create the admin
export const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ email, password: hashedPassword });
        await newAdmin.save();
        res.status(201).json({
            success: true,
            message: "Admin created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create admin"
        });
    }
};


// to sign in the admin
export const signInAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found"
            });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }
        res.status(200).json({
            success: true,
            message: "Admin signed in successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to sign in admin"
        });
    }
};


