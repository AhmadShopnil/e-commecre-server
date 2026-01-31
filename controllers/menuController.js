import { connectToDatabase } from "../config/db.js";
import { ObjectId } from "mongodb";

// @desc    Get all menus
// @route   GET /api/menus
export const getMenus = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const menus = await db.collection("menus").find({}).sort({ position: 1 }).toArray();
        res.json(menus);
    } catch (error) {
        console.error("GET /api/menus error:", error);
        res.status(500).json({ error: "Failed to fetch menus" });
    }
};

// @desc    Create menu
// @route   POST /api/menus
export const createMenu = async (req, res) => {
    try {
        const body = req.body;
        const { db } = await connectToDatabase();

        const menu = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection("menus").insertOne(menu);
        res.status(201).json({ _id: result.insertedId, ...menu });
    } catch (error) {
        console.error("POST /api/menus error:", error);
        res.status(500).json({ error: "Failed to create menu" });
    }
};

// @desc    Update menu
// @route   PUT /api/menus
export const updateMenu = async (req, res) => {
    try {
        const body = req.body;
        const { _id, ...updateData } = body;
        const { db } = await connectToDatabase();

        const result = await db.collection("menus").updateOne(
            { _id: new ObjectId(_id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );

        res.json({ success: true, result });
    } catch (error) {
        console.error("PUT /api/menus error:", error);
        res.status(500).json({ error: "Failed to update menu" });
    }
};

// @desc    Delete menu
// @route   DELETE /api/menus?id=...
export const deleteMenu = async (req, res) => {
    try {
        const { id } = req.query; // Following original code using query param
        const { db } = await connectToDatabase();
        await db.collection("menus").deleteOne({ _id: new ObjectId(id) });

        res.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/menus error:", error);
        res.status(500).json({ error: "Failed to delete menu" });
    }
};
