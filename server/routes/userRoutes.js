import express from "express";
import { getUserById, getusers, updateUser, deleteUser, softDeleteUser, makeUserActive, bulkDeleteUser } from "../controllers/useControlles.js"


const router = express.Router();

router.get("/", getusers);
router.get("/:userId", getUserById);
router.put("/:userId", updateUser);


//has to move to admin side
router.delete("/:userId", deleteUser);
router.delete("/soft/:userId", softDeleteUser);
router.put("/active/:userId", makeUserActive);
router.delete("/bulk", bulkDeleteUser);

export default router;

