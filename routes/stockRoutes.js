import express from "express";
import { getStock } from "../controllers/stockController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", adminAuth, getStock);

export default router;
