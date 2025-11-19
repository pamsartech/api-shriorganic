import { User } from "../models/userModel.js";
import bcrypt, { hash } from 'bcrypt';
import jwt from "jsonwebtoken";



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
        else{
            const payload={
                _id:user[0]._id,
                Email:user[0].Email,
            }
            const token=jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.cookie('token',token,{
                httpOnly: true, // not accessible via JavaScript
                secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
                sameSite: 'strict',
                maxAge: 7*24*60 * 60 * 1000 // 7 days
            }).status(200).json({
                success: true,
                message: "sigin successful",
                token:token
            });
        }
    } catch (error) {        
        res.status(400).json({
            success:false,
            message:"signin failed",
            error:error
        })
    }
}



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
    const salt=Number(process.env.saltRounds);
    const encryptedpassword=await bcrypt.hash(Password,salt);

    const userdata = {
        FirstName: FirstName,
        LastName: LastName,
        PhoneNumber: PhoneNumber,
        Email: Email,
        Password: encryptedpassword
    }

    if(existingUser){
        res.status(401).json({
            success:false,
            message:"user already exists with email or number !"
        })
    }
    else{
        const newUser=new User(
            userdata
        )
        await newUser.save();
    }
    res.status(200).json({
        success: true,
        message: "sign-up sucessfull !",
    })
} catch (error) {
    res.status(400).json({
        success:false,
        message:"error",
        error:error
    })
}
}


export const dashBoard=async (req,res) => {

    const user=req.user;

    const userdetials=await User.find({_id:user._id}).select("-Password");
    try {

        res.status(200).json({
            success:true,
            data:userdetials
        })
    } catch (error) {
        res.status(400).json({
            success:false,
            data:error
        })
    }
}



export const signout=async (req,res) => {
    
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