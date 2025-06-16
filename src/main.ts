import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./database/db";
import { errorHandler } from "./middlewares/errorHandler";
import { router } from "./routes";
dotenv.config();

const app = express();

app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
connectDB();

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
