import express from "express";
import { getSliders, createSlider } from "../controllers/sliderController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getSliders);
router.post("/", adminAuth, createSlider);

export default router;
