import express from "express";
import {
    getCategories,
    getFlatCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/categoryController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/flat", getFlatCategories);
router.post("/", adminAuth, createCategory);
router.put("/:id", adminAuth, updateCategory);
router.delete("/:id", adminAuth, deleteCategory);

export default router;
