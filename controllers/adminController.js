import { connectToDatabase } from "../config/db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// @desc    Admin Login
// @route   POST /api/admin/login
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });

            res.cookie("admin_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: "/",
            });

            return res.json({ success: true, message: "Login successful", token });
        }

        return res.status(401).json({ error: "Invalid username or password" });
    } catch (error) {
        console.error("Login API error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

// @desc    Check Admin Status
// @route   GET /api/admin/check
export const checkAdmin = (req, res) => {
    // If it reaches here, middleware passed (if used), but this is usually public endpoint in Next.js example?
    // In Next.js it acts as "am I logged in?".
    // We can check cookie here.
    const token = req.cookies.admin_token;
    if (!token) return res.json({ authenticated: false });

    try {
        jwt.verify(token, JWT_SECRET);
        return res.json({ authenticated: true });
    } catch (e) {
        return res.json({ authenticated: false });
    }
};

// @desc    Logout Admin
// @route   DELETE /api/admin/logout
export const logoutAdmin = (req, res) => {
    res.clearCookie("admin_token", { path: "/" });
    res.json({ success: true, message: "Logged out" });
};

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
export const getStats = async (req, res) => {
    const { filter = "all", month, year } = req.query;

    try {
        const { db } = await connectToDatabase();

        // 1. Build Date Query
        let dateQuery = {};
        const now = new Date();

        if (filter === "today") {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateQuery = { createdAt: { $gte: start } };
        } else if (filter === "yesterday") {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            dateQuery = { createdAt: { $gte: start, $lte: end } };
        } else if (filter === "30d") {
            const start = new Date();
            start.setDate(now.getDate() - 30);
            dateQuery = { createdAt: { $gte: start } };
        } else if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            dateQuery = { createdAt: { $gte: start, $lte: end } };
        }

        // 2. Total Products Count
        const totalProducts = await db.collection("products").countDocuments();

        // 3. Orders Stats
        const orderStats = await db.collection("orders").aggregate([
            { $match: dateQuery },
            {
                $facet: {
                    totals: [
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ],
                    pending: [
                        { $match: { status: { $regex: /pending/i } } },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ],
                    deliveredItems: [
                        { $match: { status: { $regex: /delivered|complete/i } } },
                        {
                            $project: {
                                mergedItems: {
                                    $concatArrays: [
                                        { $ifNull: ["$items", []] },
                                        { $ifNull: ["$products", []] }
                                    ]
                                },
                                orderPrice: { $ifNull: ["$totalPrice", "$offerPrice", "$price", 0] }
                            }
                        },
                        {
                            $addFields: {
                                mergedItems: {
                                    $cond: [
                                        { $gt: [{ $size: "$mergedItems" }, 0] },
                                        "$mergedItems",
                                        [{ isOrderFallback: true }]
                                    ]
                                }
                            }
                        },
                        { $unwind: "$mergedItems" },
                        {
                            $addFields: {
                                "mergedItems.productIdObj": {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ["$mergedItems.productId", null] },
                                                { $eq: [{ $type: "$mergedItems.productId" }, "string"] },
                                                { $ne: ["$mergedItems.productId", ""] }
                                            ]
                                        },
                                        { $toObjectId: "$mergedItems.productId" },
                                        "$mergedItems.productId"
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "products",
                                localField: "mergedItems.productIdObj",
                                foreignField: "_id",
                                as: "productData"
                            }
                        },
                        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: {
                                        $multiply: [
                                            { $ifNull: ["$mergedItems.price", "$orderPrice", 0] },
                                            { $ifNull: ["$mergedItems.quantity", 1] }
                                        ]
                                    }
                                },
                                totalPurchasePrice: {
                                    $sum: {
                                        $multiply: [
                                            { $ifNull: ["$productData.purchasePrice", "$mergedItems.purchasePrice", 0] },
                                            { $ifNull: ["$mergedItems.quantity", 1] }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalRevenue: 1,
                                profit: { $subtract: ["$totalRevenue", "$totalPurchasePrice"] }
                            }
                        }
                    ],
                    deliveredOrders: [
                        { $match: { status: { $regex: /delivered|complete/i } } },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ],
                    statusDistribution: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    sourceDistribution: [
                        { $group: { _id: "$orderSource", count: { $sum: 1 } } }
                    ]
                }
            }
        ]).toArray();

        const facetResults = orderStats[0];
        const totalOrders = facetResults.totals[0]?.count || 0;
        const pendingOrders = facetResults.pending[0]?.count || 0;
        const deliveredData = facetResults.deliveredItems[0] || { totalRevenue: 0, profit: 0 };
        const deliveredOrdersCount = facetResults.deliveredOrders[0]?.count || 0;

        // 4. Low Stock Items
        const lowStockCount = await db.collection("products").countDocuments({
            "variants.stock": { $lt: 10 }
        });

        res.json({
            totalProducts,
            totalOrders,
            totalRevenue: deliveredData.totalRevenue,
            profit: deliveredData.profit,
            pendingOrders,
            deliveredOrders: deliveredOrdersCount,
            lowStockItems: lowStockCount,
            statusDistribution: facetResults.statusDistribution || [],
            sourceDistribution: facetResults.sourceDistribution || []
        });
    } catch (error) {
        console.error("GET /api/admin/stats error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
