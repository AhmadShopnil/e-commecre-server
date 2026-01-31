import express from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", adminAuth, upload.single("file"), uploadFile);

export default router;
