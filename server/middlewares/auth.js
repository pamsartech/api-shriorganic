import  jwt  from "jsonwebtoken";



export const authMiddelware=(req,res,next)=>{

    let token;

    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'User Not authorized !' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the payload to req.user
        next();
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
}