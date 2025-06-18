import { Router } from "express";
import authRouter from "./auth";
import folderRouter from "./folder";
import noteRouter from "./note";

export const router = Router();

router.get("/health", (req, res) => {
	res.status(200).json({ message: "Server is running" });
});
router.use("/auth", authRouter);
router.use("/notes", noteRouter);
router.use("/folders", folderRouter);
