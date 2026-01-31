import express from "express";
import { getProducts, createProduct, getProductById } from "../controllers/productController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post(
    "/",
    adminAuth,
    upload.fields([{ name: "featuredImage", maxCount: 1 }, { name: "images", maxCount: 10 }]),
    createProduct
);

export default router;
