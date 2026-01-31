import { connectToDatabase } from "../config/db.js";

// @desc    Get stock
// @route   GET /api/stock
export const getStock = async (req, res) => {
    try {
        const { db } = await connectToDatabase();

        // Get all products and extract variant stocks
        const products = await db.collection("products").find({}).toArray();

        const stocks = products?.map((product) => ({
            productId: product._id,
            productName: product.name,
            variantStocks: product.variants || [],
        }));

        res.json(stocks);
    } catch (error) {
        console.error("GET /api/stock error:", error);
        res.status(500).json({ error: "Failed to fetch stock" });
    }
};
