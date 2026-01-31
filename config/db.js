import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

// Load env vars from root of the project if not in backend also.
// Assuming backend is one level deep.
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // Load from local .env if exists, overriding or adding

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("kids_shop");

    cachedClient = client;
    cachedDb = db;

    // Create indexes (Idempotent)
    await db.collection("products").createIndex({ category: 1 });
    await db.collection("products").createIndex({ name: "text" });
    await db.collection("orders").createIndex({ createdAt: -1 });
    await db.collection("orders").createIndex({ status: 1 });
    await db.collection("daily_sales").createIndex({ date: -1 });
    await db.collection("sliders").createIndex({ location: 1 }, { unique: true });

    console.log("Connected to MongoDB");
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
