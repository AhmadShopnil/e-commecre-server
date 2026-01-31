import { connectToDatabase } from "../config/db.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { ObjectId } from "mongodb";

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const { category, search, limit = "50", featured } = req.query;

        let query = {};

        if (category) {
            query.categories = { $in: [category] };
        }

        if (featured === "true") {
            query.isFeatured = true;
        }

        // Default to active products unless filtered for inactive (logic from nextjs app)
        // Actually the nextjs app had: query.isActive = { $ne: false }
        query.isActive = { $ne: false };

        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ],
            };
        }

        const products = await db.collection("products")
            .find(query)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .toArray();

        res.json(products);
    } catch (error) {
        console.error("GET /api/products error:", error);
        res.status(500).json({ error: "Failed to fetch products", originalError: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
export const createProduct = async (req, res) => {

    console.log("from poruct controller",)

    try {
        const {
            name,
            description,
            categories,
            price,
            offerPrice,
            isFeatured,
            isActive,
            designName,
            purchasePrice,
            variants,
        } = req.body;

        // Parsed fields (Multer handles multipart/form-data, but fields come as strings)
        const parsedCategories = categories ? JSON.parse(categories) : [];
        const parsedVariants = variants ? JSON.parse(variants) : [];
        const numPrice = Number(price);
        const numOfferPrice = Number(offerPrice);
        const numPurchasePrice = Number(purchasePrice);
        const boolIsFeatured = isFeatured === "true";
        const boolIsActive = isActive === "true";

        const featuredImageFile = req.files["featuredImage"] ? req.files["featuredImage"][0] : null;
        const extraImageFiles = req.files["images"] || [];

        if (!name || parsedCategories.length === 0 || !featuredImageFile || isNaN(numPrice)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log("from poruct controller", featuredImageFile)
        /* ---------- Upload images ---------- */
        const featuredImage = await uploadToCloudinary(
            featuredImageFile.buffer,
            "products/featured"
        );

        const images = [];
        for (const file of extraImageFiles) {
            const url = await uploadToCloudinary(file.buffer, "products/gallery");
            if (url) images.push(url);
        }

        /* ---------- DB ---------- */
        const { db } = await connectToDatabase();

        const result = await db.collection("products").insertOne({
            name,
            description,
            categories: parsedCategories,
            price: numPrice,
            offerPrice: numOfferPrice,
            purchasePrice: numPurchasePrice || 0,
            isFeatured: boolIsFeatured,
            isActive: boolIsActive,
            designName: designName || "",
            featuredImage,
            images,
            variants: parsedVariants,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ _id: result.insertedId });
    } catch (error) {
        console.error("POST /api/products error:", error);
        res.status(500).json({ error: "Failed on create product" });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
    try {
        const { db } = await connectToDatabase();
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        console.error("GET /api/products/:id error:", error);
        res.status(500).json({ error: "Failed to fetch product" });
    }
}
