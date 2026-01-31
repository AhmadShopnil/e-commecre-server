import express from "express";
import {
    getGeneralSettings,
    updateGeneralSettings,
    getCourierSettings,
    updateCourierSettings
} from "../controllers/settingsController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", adminAuth, getGeneralSettings);
router.put("/", adminAuth, updateGeneralSettings);

router.get("/courier", adminAuth, getCourierSettings);
router.put("/courier", adminAuth, updateCourierSettings);

export default router;
