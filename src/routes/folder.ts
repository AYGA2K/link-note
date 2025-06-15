import { Router } from "express";
import { createFolder, deleteFolder, getAllFolders, getFolderById, moveFolder, updateFolder } from "../controllers/folder";

const folderRouter = Router();

folderRouter.get("", getAllFolders);
folderRouter.get("/:id", getFolderById);
folderRouter.post("", createFolder);
folderRouter.put("/:id", updateFolder);
folderRouter.patch("/move", moveFolder);
folderRouter.delete("/:id", deleteFolder);

export default folderRouter;
