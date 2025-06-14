import { Router } from "express";
import { validate } from '../middlewares/validate';
import { createNoteSchema, noteIdSchema, updateNoteSchema } from '../schemas/note';
import { createNote, deleteNote, getAllNotes, getNoteById, updateNote } from "../controllers/note";

const noteRouter = Router();

noteRouter.get("", getAllNotes);
noteRouter.get("/:id", validate(noteIdSchema), getNoteById);
noteRouter.post("", validate(createNoteSchema), createNote);
noteRouter.put("/:id", validate(updateNoteSchema), updateNote);
noteRouter.delete("/delete", validate(noteIdSchema), deleteNote);

export default noteRouter;

