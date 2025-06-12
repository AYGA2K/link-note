import { Router } from "express";
import note from "../controllers/note";

const noteRouter = Router();

noteRouter.get("", note.getAllNotes);
noteRouter.get("/:id", note.getNoteById);
noteRouter.post("", note.createNote);
noteRouter.put("/update", note.updateNote);
noteRouter.delete("/delete", note.deleteNote);

export default noteRouter;

