import { connectToDatabase } from "../config/db.js";
import { ObjectId } from "mongodb";

// @desc    Validate cart items (check stock)
// @route   POST /api/cart/validate
export const validateCart = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items in cart" });
        }

        const { db } = await connectToDatabase();
        const validation = {
            isValid: true,
            items: [],
            errors: [],
        };

        for (const item of items) {
            if (!ObjectId.isValid(item.productId)) {
                validation.isValid = false;
                validation.errors.push(`Invalid product ID: ${item.productId}`);
                continue;
            }

            const product = await db.collection("products").findOne({
                _id: new ObjectId(item.productId),
            });

            if (!product) {
                validation.isValid = false;
                validation.errors.push(`Product not found: ${item.productId}`);
                continue;
            }

            const variant = product.variants?.find(
                (v) => v.design === item.design && v.color === item.color && v.size === item.size,
            );

            if (!variant) {
                validation.isValid = false;
                validation.errors.push(`Variant not available for ${product.name}: ${item.design} - ${item.color} ${item.size}`);
                continue;
            }

            validation.items.push({
                productId: item.productId,
                productName: product.name,
                design: item.design,
                color: item.color,
                size: item.size,
                price: product.price,
                requestedQuantity: item.quantity,
                availableStock: variant.stock,
                isAvailable: variant.stock >= item.quantity,
            });

            if (variant.stock < item.quantity) {
                validation.isValid = false;
                validation.errors.push(
                    `Insufficient stock for ${product.name} - ${item.color} ${item.size}: Available ${variant.stock}, Requested ${item.quantity}`,
                );
            }
        }

        res.json(validation);
    } catch (error) {
        console.error("POST /api/cart/validate error:", error);
        res.status(500).json({ error: "Failed to validate cart" });
    }
};
