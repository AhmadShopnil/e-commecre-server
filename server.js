import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { connectToDatabase } from "./config/db.js";

// Routes
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import comboOrderRoutes from "./routes/comboOrderRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import courierRoutes from "./routes/courierRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", process.env.NEXT_PUBLIC_APP_URL], // Allow frontend
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to Database
connectToDatabase();

// Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/comboorder", comboOrderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/courier", courierRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
