import { connectToDatabase } from "../config/db.js";

// @desc    Get combo orders (This seems to be same as getOrders but maybe filtered? Original code same as orders)
// @route   GET /api/comboorder
export const getComboOrders = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const { status, limit = "50", skip = "0" } = req.query;

        let query = {}; // Note: Original code had empty query for base, overwritten by status. Did not filter by type "combo".
        // Use logic from original file:
        // const { searchParams } = new URL(request.url)
        // const status = searchParams.get("status")
        // ...
        // let query = {}
        // if (status) query = { status }

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
        console.error("GET /api/comboorder error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

// @desc    Create combo order
// @route   POST /api/comboorder
export const createComboOrder = async (req, res) => {
    try {
        const body = req.body;

        if (!body.customerName || !body.address || !body.note || !body.phone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { db } = await connectToDatabase();

        // Note: Logic in original file commented out bulkUpdates for stock!
        // So we skip stock update for combos as per source.

        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;

        const result = await db.collection("orders").insertOne({
            ...body,
            orderNumber,
            status: body.status || "pending",
            productType: body.productType || "combo",
            paymentStatus: body.paymentStatus || "unpaid",
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
        console.error("POST /api/comboorder error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};
