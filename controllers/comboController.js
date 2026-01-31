import { connectToDatabase } from "../config/db.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { ObjectId } from "mongodb";

// @desc    Get all combos
// @route   GET /api/combos
export const getCombos = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const combos = await db.collection("combos").find().toArray();
        res.json(combos);
    } catch (error) {
        console.error("GET /api/combos error:", error);
        res.status(500).json({ error: "Failed to fetch combos" });
    }
};

// @desc    Get single combo
// @route   GET /api/combos/:id
export const getComboById = async (req, res) => {
    try {
        const { id } = req.params;
        const { db } = await connectToDatabase();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid combo ID" });
        }

        const combo = await db.collection("combos").findOne({
            _id: new ObjectId(id),
        });

        if (!combo) {
            return res.status(404).json({ error: "Combo not found" });
        }
        res.json(combo);
    } catch (error) {
        console.error("GET /api/combos/:id error:", error);
        res.status(500).json({ error: "Failed to fetch combo" });
    }
};

// @desc    Create combo
// @route   POST /api/combos
export const createCombo = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            offerPrice,
            sizes,
            products
        } = req.body;

        const parsedSizes = sizes ? JSON.parse(sizes) : [];
        const parsedProducts = products ? JSON.parse(products) : [];
        const featuredImageFile = req.file ? req.file : null;

        if (!title || parsedProducts.length === 0 || parsedSizes.length === 0) {
            return res.status(400).json({ error: "Missing fields" });
        }

        let featuredImage = null;
        if (featuredImageFile) {
            featuredImage = await uploadToCloudinary(featuredImageFile.buffer, "combos/featured");
        }

        const { db } = await connectToDatabase();

        const result = await db.collection("combos").insertOne({
            title,
            description,
            price: Number(price),
            offerPrice: Number(offerPrice),
            sizes: parsedSizes,
            products: parsedProducts,
            featuredImage,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ _id: result.insertedId });
    } catch (error) {
        console.error("POST /api/combos error:", error);
        res.status(500).json({ error: "Failed to create combo" });
    }
};

// @desc    Update combo
// @route   PUT /api/combos/:id
export const updateCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            price,
            offerPrice,
            sizes,
            products,
            existingFeaturedImage
        } = req.body;

        const parsedSizes = sizes ? JSON.parse(sizes) : [];
        const parsedProducts = products ? JSON.parse(products) : [];

        const featuredImageFile = req.file;
        let featuredImage = existingFeaturedImage || null;

        if (featuredImageFile) {
            featuredImage = await uploadToCloudinary(featuredImageFile.buffer, "products/featured");
        }

        const { db } = await connectToDatabase();
        const result = await db.collection("combos").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title,
                    description,
                    price: Number(price),
                    offerPrice: Number(offerPrice),
                    sizes: parsedSizes,
                    products: parsedProducts,
                    featuredImage,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Combo not found" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("PUT /api/combos/:id error:", error);
        res.status(500).json({ error: "Failed to update combo" });
    }
};

// @desc    Delete combo
// @route   DELETE /api/combos/:id
export const deleteCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const { db } = await connectToDatabase();

        const result = await db.collection("combos").deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Combo not found" });
        }

        res.json({ message: "Combo deleted successfully" });
    } catch (error) {
        console.error("DELETE /api/combos/:id error:", error);
        res.status(500).json({ error: "Failed to delete combo" });
    }
};
