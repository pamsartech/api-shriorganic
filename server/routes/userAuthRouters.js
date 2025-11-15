import  express  from "express";
import { dashBoard, signin, signout, signup } from "../controllers/user_authController.js";
import { authMiddelware } from "../middlewares/auth.js";


const router=express.Router();


router.post("/signin",signin);
router.post("/signup",signup);
router.get("/dashboard",authMiddelware,dashBoard);
router.post("/signout",authMiddelware,signout);
export default router;


