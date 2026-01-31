import express from "express";
import { checkCourierStatus, createCourierOrder } from "../controllers/courierController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/check-status", adminAuth, checkCourierStatus);
router.post("/create-order", adminAuth, createCourierOrder);

export default router;
