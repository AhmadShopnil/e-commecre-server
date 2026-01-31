import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const adminAuth = (req, res, next) => {
    // Check cookie or header
    const token = req.cookies.admin_token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
