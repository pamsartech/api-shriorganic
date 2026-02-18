import { User } from "../models/userModel.js";
import { Wallet } from "../models/walletModel.js";
import bcrypt, { hash } from 'bcrypt';
import jwt from "jsonwebtoken";
import { sendSigninEmail, sendRegisterEmail, sendLogoutEmail } from "../utils/sendEmail.js";
import redisClient from "../config/redisClient.js";
import cloudinary from "../utils/cloudinary.js";

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
            // Block login if account is deactivated
            if (user[0].isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been deactivated. Please contact support."
                });
            }

            const payload = {
                _id: user[0]._id,
                Email: user[0].Email,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });


            res.status(200).json({
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
        const { FirstName, LastName, PhoneNumber, Email, Password, referralCode } = req.body;
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
            Password: encryptedpassword,
        }

        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode });
            if (referrer) {
                let referrerWallet = await Wallet.findOne({ user: referrer._id });
                if (!referrerWallet) {
                    referrerWallet = new Wallet({
                        user: referrer._id,
                        balance: 0,
                        transactions: []
                    });
                }

                referrerWallet.balance += 100;
                referrerWallet.transactions.push({
                    type: "deposit",
                    amount: 100,
                    description: "Referral Bonus",
                    referenceId: "REF_BONUS_" + Date.now(),
                    status: "completed"
                });
                await referrerWallet.save();

                if (!referrer.wallet) {
                    referrer.wallet = referrerWallet._id;
                    await referrer.save();
                }
                userdata.referredBy = referrer.referralCode;
            }
        }

        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "user already exists with email or number !"
            })
        }

        const newUser = new User(userdata);
        await newUser.save();


        let walletData = {
            user: newUser._id,
        };

        if (userdata.referredBy) {
            walletData.balance = 100;
            walletData.transactions = [{
                type: "deposit",
                amount: 100,
                description: "Referral Bonus (Welcome Gift)",
                referenceId: "WELCOME_BONUS_" + Date.now(),
                status: "completed"
            }];
        }

        const newWallet = new Wallet(walletData);

        await newWallet.save();
        newUser.wallet = newWallet._id;
        await newUser.save();

        const payload = {
            _id: newUser._id,
            Email: newUser.Email,
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({
            success: true,
            message: "sign-up sucessfull !",
            token: token
        })

        // has to chnage the subject and context
        await sendRegisterEmail(Email,
            "Registration Successfull",
            "You have successfully registered");
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
    try {
        const user = req.user;

        const cacheKey = `dashboard:${user._id}`;

        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const data = JSON.parse(cachedData);
            if (data) {
                return res.status(200).json({
                    success: true,
                    data: data,
                    source: "redis"
                });
            }
        }

        const userdetails = await User.findById(user._id)
            .select("-Password")
            .populate("wallet");

        if (userdetails) {
            await redisClient.setEx(
                cacheKey,
                200,
                JSON.stringify(userdetails)
            );
        }



        res.status(200).json({
            success: true,
            data: userdetails,
            source: "database"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};



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
            message: "OTP Sent Successfully !",
            otp: otp
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


// to share referal code
export const shareReferCode = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "share this code with your friends to get 100 each",
            data: user.referralCode || "This is test account so dont have any referaal code. Try with other account"
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Error sharing referral code",
        })
    }
}


// make an api so he can update all this details in profile 
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { FirstName, LastName, PhoneNumber, Email, street, city, state, zipcode, country } = req.body;

        if (FirstName) user.FirstName = FirstName;
        if (LastName) user.LastName = LastName;
        if (PhoneNumber) user.PhoneNumber = PhoneNumber;
        if (Email) user.Email = Email;

        // Update address fields if provided
        if (street || city || state || zipcode || country) {
            user.address = {
                street: street || user.address.street,
                city: city || user.address.city,
                state: state || user.address.state,
                zipcode: zipcode || user.address.zipcode,
                country: country || user.address.country
            };
        }


        // Handle profile picture upload
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "users",
            });
            user.profilePic = result.secure_url;
        }

        await user.save();

        // Clear the dashboard cache so updated profile is reflected immediately
        await redisClient.del(`dashboard:${userId}`);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Error updating profile",
        })
    }
}
