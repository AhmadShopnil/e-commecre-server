import express from "express";
import {
    getCombos,
    createCombo,
    getComboById,
    updateCombo,
    deleteCombo
} from "../controllers/comboController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", getCombos);
router.get("/:id", getComboById);

router.post(
    "/",
    adminAuth,
    upload.single("featuredImage"),
    createCombo
);

router.put(
    "/:id",
    adminAuth,
    upload.single("featuredImage"),
    updateCombo
);

router.delete("/:id", adminAuth, deleteCombo);

export default router;
