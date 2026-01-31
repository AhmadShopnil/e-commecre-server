import express from "express";
import { processCheckout } from "../controllers/checkoutController.js";

const router = express.Router();

router.post("/", processCheckout);

export default router;
