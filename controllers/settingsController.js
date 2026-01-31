import { connectToDatabase } from "../config/db.js";

// @desc    Get general settings
// @route   GET /api/settings
export const getGeneralSettings = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        let settings = await db.collection("settings").findOne({ type: "general" });

        if (!settings) {
            settings = {
                type: "general",
                storeName: "Kids Shop",
                storeEmail: "",
                storePhone: "",
                storeAddress: "",
                currency: "BDT",
                currencySymbol: "৳",
                googleTagManagerId: "",
                facebookPixelId: "",
                metaTitle: "Kids Shop - Quality Kids Clothing",
                metaDescription: "Shop for quality kids clothing with fun designs",
                lowStockThreshold: 10,
                orderPrefix: "KS",
                enableGTM: false,
                enableFBPixel: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        res.json(settings);
    } catch (error) {
        console.error("GET /api/settings error:", error);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
};

// @desc    Update general settings
// @route   PUT /api/settings
export const updateGeneralSettings = async (req, res) => {
    try {
        const body = req.body;
        const { db } = await connectToDatabase();

        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        if (updateData._id) delete updateData._id;

        const result = await db.collection("settings").updateOne(
            { type: "general" },
            { $set: updateData },
            { upsert: true }
        );

        res.json({ success: true, result });
    } catch (error) {
        console.error("PUT /api/settings error:", error);
        res.status(500).json({ error: "Failed to update settings" });
    }
};

// @desc    Get courier settings
// @route   GET /api/settings/courier
export const getCourierSettings = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        let settings = await db.collection("settings").findOne({ type: "courier" });

        if (!settings) {
            settings = {
                type: "courier",
                providers: [
                    {
                        id: "steadfast",
                        name: "Steadfast Courier",
                        apiKey: "",
                        secretKey: "",
                        isActive: true,
                        isDefault: true
                    }
                ]
            };
        }

        res.json(settings);
    } catch (error) {
        console.error("GET /api/settings/courier error:", error);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
};

// @desc    Update courier settings
// @route   PUT /api/settings/courier
export const updateCourierSettings = async (req, res) => {
    try {
        const body = req.body;
        const { db } = await connectToDatabase();

        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        if (updateData._id) delete updateData._id;

        const result = await db.collection("settings").updateOne(
            { type: "courier" },
            { $set: updateData },
            { upsert: true }
        );

        res.json({ success: true, result });
    } catch (error) {
        console.error("PUT /api/settings/courier error:", error);
        res.status(500).json({ error: "Failed to update settings" });
    }
};
