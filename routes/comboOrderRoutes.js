import express from "express";
import { getComboOrders, createComboOrder } from "../controllers/comboOrderController.js";

const router = express.Router();

router.get("/", getComboOrders);
router.post("/", createComboOrder);

export default router;
