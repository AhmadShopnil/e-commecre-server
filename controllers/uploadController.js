import { uploadToCloudinary } from "../config/cloudinary.js";

// @desc    Upload file
// @route   POST /api/upload
export const uploadFile = async (req, res) => {
    try {
        const file = req.file; // Multer puts file in req.file
        const { folder = "general" } = req.body;

        if (!file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const url = await uploadToCloudinary(file.buffer, folder);

        res.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
};
