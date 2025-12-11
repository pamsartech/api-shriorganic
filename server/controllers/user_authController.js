import { User } from "../models/userModel.js";
import bcrypt, { hash } from 'bcrypt';
import jwt from "jsonwebtoken";
import { sendSigninEmail, sendRegisterEmail, sendLogoutEmail } from "../utils/sendEmail.js";
import { log } from "console";




// signin
export const signin = async (req, res) => {

    try {

        const { Email, Password } = req.body;
        const user = await User.find({ Email: Email });

        if (!user || user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found!"
            });
        }
        const hashedPassword = user[0].Password;
        const isMatch = await bcrypt.compare(Password, hashedPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password incorrect!"
            });
        }
        else {
            const payload = {
                _id: user[0]._id,
                Email: user[0].Email,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });


            res.cookie('token', token, {
                httpOnly: true, // not accessible via JavaScript
                secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            }).status(200).json({
                success: true,
                message: "sigin successful",
                token: token
            });

            // has to change it later (import the subject and cotent from the custom email folder)
            await sendSigninEmail(user[0].Email,
                "Signin Successfull",
                "You have successfully signed in");
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "signin failed",
            error: error
        })
    }
}



// signup
export const signup = async (req, res) => {

    try {
        const { FirstName, LastName, PhoneNumber, Email, Password } = req.body;
        if (!FirstName || !LastName || !PhoneNumber || !Email || !Password) {
            return res.status(400).json({
                success: false,
                message: "Required data is missing."
            });
        }
        const existingUser = await User.findOne({
            $or: [{ Email: Email.toLowerCase() }, { PhoneNumber }],
        });
        const salt = Number(process.env.saltRounds);
        const encryptedpassword = await bcrypt.hash(Password, salt);

        const userdata = {
            FirstName: FirstName,
            LastName: LastName,
            PhoneNumber: PhoneNumber,
            Email: Email,
            Password: encryptedpassword
        }

        if (existingUser) {
            res.status(401).json({
                success: false,
                message: "user already exists with email or number !"
            })
        }
        else {
            const newUser = new User(
                userdata
            )
            await newUser.save();
        }

        // has to chnage the subject and context
        await sendRegisterEmail(Email,
            "Registration Successfull",
            "You have successfully registered");
        res.status(200).json({
            success: true,
            message: "sign-up sucessfull !",
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "error",
            error: error
        })
    }
}


// dashboard
export const dashBoard = async (req, res) => {

    const user = req.user;

    const userdetials = await User.find({ _id: user._id }).select("-Password");
    try {

        res.status(200).json({
            success: true,
            data: userdetials
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            data: error
        })
    }
}



// signout
export const signout = async (req, res) => {

    await sendLogoutEmail(req.user.Email,
        "Logout Successfull",
        "You have successfully logged out");

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
}


// otp request for the login
export const requestOtp = async (req, res) => {
    try {

        const { Email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);


        const user = await User.findOne({ Email: Email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            })
        }

        user.otpHash = hashedOtp;
        user.otpExpire = Date.now() + 5 * 60 * 1000; //
        await user.save();



        await sendSigninEmail(Email,
            "Otp Verification",
            `Your Otp is ${otp}`);

        res.status(200).json({
            success: true,
            message: "OTP Sent Successfully !"
        })

    } catch (error) {
        console.log(error);

        res.status(400).json({
            success: false,
            message: error,
        })

    }
}

export const verifyOtp = async (req, res) => {
    try {
        // verify the otp and change the password which was sent by the user 
        const { email, otp, password } = req.body;
        // Handle case sensitivity usually from frontend
        const userEmail = email || req.body.Email;
        const userOtp = otp || req.body.OTP;
        const newPassword = password || req.body.Password;


        if (!userEmail || !userOtp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, and new Password are required"
            });
        }

        const user = await User.findOne({ Email: userEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            })
        }

        if (!user.otpHash) {
            return res.status(400).json({
                success: false,
                message: "OTP was not requested or has expired"
            });
        }

        if (user.otpExpire && user.otpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        const isMatch = await bcrypt.compare(userOtp.toString(), user.otpHash);
    
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "OTP incorrect (" + userOtp + ")"
            });
        }

        // OTP Verified - Change Password
        const salt = Number(process.env.saltRounds) || 10;
        const encryptedPassword = await bcrypt.hash(newPassword, salt);

        user.Password = encryptedPassword;
        user.otpHash = null;
        user.otpExpire = null;
        await user.save();

        await sendSigninEmail(userEmail, "Password Changed", "Your password has been changed successfully.");

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Error verifying OTP",
        })
    }
}   