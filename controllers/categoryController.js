import { connectToDatabase } from "../config/db.js";
import { ObjectId } from "mongodb";

// @desc    Get all categories (hierarchical)
// @route   GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const categories = await db.collection("categories").find({}).sort({ order: 1 }).toArray();

        // Build hierarchical structure
        const categoryMap = {};
        const rootCategories = [];

        categories.forEach(cat => {
            categoryMap[cat._id.toString()] = { ...cat, children: [] };
        });

        categories.forEach(cat => {
            if (cat.parentId && categoryMap[cat.parentId]) {
                categoryMap[cat.parentId].children.push(categoryMap[cat._id.toString()]);
            } else {
                rootCategories.push(categoryMap[cat._id.toString()]);
            }
        });

        res.json(rootCategories);
    } catch (error) {
        console.error("GET /api/categories error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};

// @desc    Get flat categories
// @route   GET /api/categories/flat
export const getFlatCategories = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const categories = await db.collection("categories")
            .find({ isActive: true })
            .sort({ order: 1 })
            .toArray();

        // Build a map for easy lookup
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat._id.toString()] = cat;
        });

        // Function to get full path
        const getPath = (cat) => {
            const path = [];
            let current = cat;
            while (current) {
                path.unshift(current.name);
                current = current.parentId ? categoryMap[current.parentId] : null;
            }
            return path.join(" > ");
        };

        // Return flat list with full path for display
        const flatCategories = categories.map(cat => ({
            ...cat,
            _id: cat._id.toString(),
            fullName: getPath(cat)
        }));

        res.json(flatCategories);
    } catch (error) {
        console.error("GET /api/categories/flat error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};

// @desc    Create category
// @route   POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const body = req.body;

        if (!body.name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const { db } = await connectToDatabase();

        // Generate slug from name
        const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        const result = await db.collection("categories").insertOne({
            name: body.name,
            slug,
            description: body.description || "",
            image: body.image || "",
            parentId: body.parentId || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
            order: body.order || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ _id: result.insertedId, ...body, slug });
    } catch (error) {
        console.error("POST /api/categories error:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const { db } = await connectToDatabase();

        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        if (body.name && !body.slug) {
            updateData.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        }

        if (body._id) delete body._id; // Ensure _id isn't one of the updated fields

        const result = await db
            .collection("categories")
            .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ message: "Category updated" });
    } catch (error) {
        console.error("PUT /api/categories/:id error:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { db } = await connectToDatabase();

        const result = await db.collection("categories").deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ message: "Category deleted" });
    } catch (error) {
        console.error("DELETE /api/categories/:id error:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
};
