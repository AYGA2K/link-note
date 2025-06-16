import { Router } from "express";
import {
	createNote,
	deleteNote,
	getAllNotes,
	getNoteById,
	updateNote,
} from "../controllers/note";

const noteRouter = Router();

noteRouter.get("", getAllNotes);
noteRouter.get("/:id", getNoteById);
noteRouter.post("", createNote);
noteRouter.put("/:id", updateNote);
noteRouter.delete("/:id", deleteNote);

export default noteRouter;
