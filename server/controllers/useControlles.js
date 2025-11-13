

/*---------------------------------------------
        1) to get all the users in the server
----------------------------------------------- */

export const getallusers=async (req,res) => {

    res.status(200).json({
        sucess:true,
        message:"to get all the users "
    })
}

