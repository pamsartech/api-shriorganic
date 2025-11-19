import { User } from "../models/userModel.js";




// To Get The all the users in admin side
export const getusers=async(req,res)=>{
    try {
        const allUsers = await User.find({ is_deleted: false }).select("-Password");


        res.status(200).json({
            success:true,
            message:"List of all the users details",
            data:allUsers
        })

    } catch (error) {
        
        res.status(404).json({
            success:false,
            error:error,
            message:"failed to fetch the users !!"
        })
    }    

}


// To get the user details by the user id
export const getUserById=async (req,res) => {

    try {        
        const {userId}=req.params;
        
        const userDetails=await User.findOne({_id:userId}).select("-Password");

        
        if(!userDetails){

            res.status(404).json({
                success:false,
                message:" User Not Found !"
            })

        }else{
            res.status(200).json({
                success:true,
                message:"user details",
                data:userDetails
            })
        }
    } catch (error) {
        
        console.log("user Fetch Error",error);
        
        res.status(400).json({
            success:false,
            error:"error",
            message:error
        })
    }
    
}