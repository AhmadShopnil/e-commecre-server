import { connectToDatabase } from "../config/db.js";
import { ObjectId } from "mongodb";

// @desc    Checkout / Create Order
// @route   POST /api/checkout
export const processCheckout = async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, items } = req.body;

        // Validation
        if (!customerName || !customerEmail || !items || items.length === 0) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate minimum 3 items requirement
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < 3) {
            return res.status(400).json({ error: "Minimum order quantity is 3 items. Currently: " + totalItems });
        }

        const { db } = await connectToDatabase();

        // Check stock availability for each variant
        for (const item of items) {
            if (!ObjectId.isValid(item.productId)) {
                return res.status(400).json({ error: `Invalid product ID: ${item.productId}` });
            }

            const product = await db.collection("products").findOne({
                _id: new ObjectId(item.productId),
            });

            if (!product) {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }

            // Find variant and check stock
            const variant = product.variants?.find(
                (v) => v.design === item.design && v.color === item.color && v.size === item.size,
            );

            if (!variant) {
                return res.status(404).json({
                    error: `Variant not found for product ${product.name} (Design: ${item.design}, Color: ${item.color}, Size: ${item.size})`,
                });
            }

            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name} - ${item.color} ${item.size}. Available: ${variant.stock}, Requested: ${item.quantity}`,
                });
            }
        }

        // Calculate total price
        let totalPrice = 0;
        for (const item of items) {
            totalPrice += item.price * item.quantity;
        }

        // Create order
        const orderNumber = `ORD-${Date.now()}`;
        const orderResult = await db.collection("orders").insertOne({
            orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            items: items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                design: item.design,
                color: item.color,
                size: item.size,
            })),
            totalPrice,
            totalItems,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Deduct stock from each variant
        for (const item of items) {
            const updateResult = await db.collection("products").updateOne(
                {
                    _id: new ObjectId(item.productId),
                    "variants.design": item.design,
                    "variants.color": item.color,
                    "variants.size": item.size,
                },
                {
                    $inc: { "variants.$.stock": -item.quantity },
                },
            );

            if (updateResult.modifiedCount === 0) {
                // Rollback order if stock update fails? Ideally use transaction but simplified here
                console.error("Stock update failed for", item.productId);
                // In production, would use transaction or handle rollback better
            }
        }

        // Record daily sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await db.collection("daily_sales").updateOne(
            { date: today },
            {
                $inc: {
                    totalRevenue: totalPrice,
                    totalOrders: 1,
                    totalItems: totalItems,
                },
            },
            { upsert: true },
        );

        res.status(201).json({
            success: true,
            orderNumber,
            orderId: orderResult.insertedId,
            totalPrice,
            totalItems,
        });

    } catch (error) {
        console.error("POST /api/checkout error:", error);
        res.status(500).json({ error: "Failed to create order: " + error.message });
    }
};
