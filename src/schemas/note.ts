import { z } from 'zod';

// Base note schema
const noteBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string().min(1)).nonempty("At least one tag is required"),
  linksTo: z.array(z.string()).optional(),
  folderId: z.string().min(1, "Folder ID is required")
});

// Schema for creating a new note
export const createNoteSchema = noteBaseSchema;

// Schema for updating a note
export const updateNoteSchema = noteBaseSchema.partial().extend({
  id: z.string().min(1, "Note ID is required")
});

// Schema for note ID parameter
export const noteIdSchema = z.object({
  id: z.string().min(1, "Note ID is required")
});
