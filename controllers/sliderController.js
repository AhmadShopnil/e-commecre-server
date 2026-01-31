import { connectToDatabase } from "../config/db.js";

// @desc    Get all sliders
// @route   GET /api/sliders
export const getSliders = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const sliders = await db.collection("sliders")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json(sliders);
    } catch (error) {
        console.error("GET /api/sliders error:", error);
        res.status(500).json({ error: "Failed to fetch sliders" });
    }
};

// @desc    Create new slider
// @route   POST /api/sliders
export const createSlider = async (req, res) => {
    try {
        const { name, location, isActive, slides } = req.body;

        if (!name || !location) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { db } = await connectToDatabase();

        // Check if location already exists
        const existing = await db.collection("sliders").findOne({ location });
        if (existing) {
            return res.status(400).json({ error: "A slider with this location already exists" });
        }

        const result = await db.collection("sliders").insertOne({
            name,
            location,
            isActive: isActive ?? true,
            slides: slides ?? [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ _id: result.insertedId });
    } catch (error) {
        console.error("POST /api/sliders error:", error);
        res.status(500).json({ error: "Failed to create slider" });
    }
};
