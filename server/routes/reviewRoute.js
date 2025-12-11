import express from "express";
import { addreveiw,editreview ,deleteReview,likeReview,showReview,dislikeReview} from "../controllers/reviewControllers.js";
import { authMiddelware } from "../middlewares/auth.js";

const router=express.Router();


router.post("/add",authMiddelware,addreveiw);
router.put("/edit/:reviewId",authMiddelware,editreview);
router.delete("/delete/:reviewId",authMiddelware,deleteReview);
router.put("/like/:reviewId",likeReview);
router.get("/:reviewId",showReview);
router.put("/dislike/:reviewId",dislikeReview); 


export default router;