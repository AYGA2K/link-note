import mongoose from "mongoose";

export const connectDB = async () => {
	const MONGO_URI = process.env.MONGO_URI;
	try {
		if (!MONGO_URI) {
			throw new Error("❌ MongoDB connection error: MONGO_URI not set");
		}
		await mongoose.connect(MONGO_URI);
		console.log("✅ MongoDB connected");
	} catch (err) {
		console.error("❌ MongoDB connection error:", err);
		process.exit(1);
	}
};
