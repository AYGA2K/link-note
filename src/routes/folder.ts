import { Router } from "express";

import { validate } from '../middlewares/validate';
import {
  createFolderSchema,
  folderIdSchema,
  updateFolderSchema,
  moveFolderSchema
} from '../schemas/folder';
import { createFolder, deleteFolder, getAllFolders, getFolderById, moveFolder, updateFolder } from "../controllers/folder";
const folderRouter = Router();

folderRouter.get("", getAllFolders);
folderRouter.get("/:id", validate(folderIdSchema), getFolderById);
folderRouter.post("", createFolder);
folderRouter.put("/:id", validate(updateFolderSchema), updateFolder);
folderRouter.patch("/move", validate(moveFolderSchema), moveFolder);
folderRouter.delete("/delete", validate(folderIdSchema), deleteFolder);

export default folderRouter;
