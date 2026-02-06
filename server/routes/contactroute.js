import express from "express";
import { contactus } from "../controllers/contactControllers.js";

const router = express.Router();

router.post("/", contactus);

export default router;