import { User } from "../models/userModel.js";
import bcrypt, { hash } from 'bcrypt';


/*--------------------------------
        1) user sign in page
---------------------------------*/
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
            return res.status(200).json({
                success: true,
                message: "sigin successful"
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


/*--------------------------------
       2) user sign up page
---------------------------------*/

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



