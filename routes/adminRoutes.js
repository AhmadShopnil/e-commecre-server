import express from "express";
import { loginAdmin, logoutAdmin, checkAdmin, getStats } from "../controllers/adminController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.delete("/logout", logoutAdmin);
router.get("/check", checkAdmin);
router.get("/stats", adminAuth, getStats);

export default router;
