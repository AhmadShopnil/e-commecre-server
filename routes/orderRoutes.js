import express from "express";
import { getOrders, createOrder } from "../controllers/orderController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", adminAuth, getOrders);
router.post("/", createOrder);

export default router;
