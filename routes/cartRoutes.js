import express from "express";
import { validateCart } from "../controllers/cartController.js";

const router = express.Router();

router.post("/validate", validateCart);

export default router;
