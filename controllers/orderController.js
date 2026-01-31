import { connectToDatabase } from "../config/db.js";
import { ObjectId } from "mongodb";

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const { status, limit = "50", skip = "0" } = req.query;

        let query = { productType: { $ne: "combo" } };
        if (status) {
            query.status = status;
        }

        const orders = await db.collection("orders")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .toArray();

        const total = await db.collection("orders").countDocuments(query);

        res.json({ orders, total });
    } catch (error) {
        console.error("GET /api/orders error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    try {
        const body = req.body;

        if (!body.customerName || !body.address || !body.note || !body.phone || !body.items || body.items.length === 0) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { db } = await connectToDatabase();

        // Check and update stock for each item
        const bulkUpdates = [];
        for (const item of body.items) {
            // Logic from Next.js app: productId and sku checks
            const product = await db.collection("products").findOne({ _id: new ObjectId(item.productId) });
            if (!product) return res.status(404).json({ error: `Product not found: ${item.name}` });

            const variantIndex = product.variants.findIndex(v => v.sku === item.sku);
            if (variantIndex === -1) return res.status(404).json({ error: `Variant not found: ${item.sku}` });

            const variant = product.variants[variantIndex];
            // Note: Assuming stock is managed in variants. Simple product stock fallback logic might be needed if no variants.
            // But adhering to the source code:
            if (variant.stock < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${item.name} (${item.sku})` });
            }

            bulkUpdates.push({
                updateOne: {
                    filter: { _id: product._id, "variants.sku": item.sku },
                    update: { $inc: { "variants.$.stock": -item.quantity } },
                },
            });
        }

        if (bulkUpdates.length > 0) {
            await db.collection("products").bulkWrite(bulkUpdates);
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;

        const result = await db.collection("orders").insertOne({
            ...body,
            orderNumber,
            status: body.status || "pending",
            paymentStatus: body.paymentStatus || "unpaid",
            orderSource: body.orderSource || "website",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Update daily sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await db.collection("daily_sales").updateOne(
            { date: today },
            {
                $inc: {
                    totalRevenue: body.totalPrice,
                    totalOrders: 1,
                    totalItems: body.items.reduce((sum, item) => sum + item.quantity, 0),
                },
            },
            { upsert: true },
        );

        res.status(201).json({ _id: result.insertedId, orderNumber, ...body });
    } catch (error) {
        console.error("POST /api/orders error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};
