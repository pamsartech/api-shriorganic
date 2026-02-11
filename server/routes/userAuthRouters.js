import express from "express";
import { dashBoard, requestOtp, verifyOtp, signin, signout, signup, shareReferCode, updateProfile } from "../controllers/user_authController.js";
import { authMiddelware } from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";


const router = express.Router();


router.post("/signin", signin);
router.post("/signup", signup);
router.get("/dashboard", authMiddelware, dashBoard);
router.post("/signout", authMiddelware, signout);
router.post("/OTP", requestOtp);
router.post("/verifyOTP", verifyOtp);
router.post("/shareReferCode", authMiddelware, shareReferCode);
router.put("/update-profile", authMiddelware, upload.single("profilePic"), updateProfile);

export default router;


