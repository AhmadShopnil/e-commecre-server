import express from "express";
import { getMenus, createMenu, updateMenu, deleteMenu } from "../controllers/menuController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getMenus);
router.post("/", adminAuth, createMenu);
router.put("/", adminAuth, updateMenu);
router.delete("/", adminAuth, deleteMenu);

export default router;
