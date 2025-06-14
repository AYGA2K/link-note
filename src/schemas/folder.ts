import { z } from 'zod';

// Base folder schema
const folderBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentFolderId: z.string().nullable().optional(),
  tags: z.array(z.string().min(1)).optional(),
  isRoot: z.boolean().optional()
});

// Schema for creating a new folder
export const createFolderSchema = folderBaseSchema;

// Schema for updating a folder
export const updateFolderSchema = folderBaseSchema.partial().extend({
  id: z.string().min(1, "Folder ID is required")
});

// Schema for folder ID parameter
export const folderIdSchema = z.object({
  id: z.string().min(1, "Folder ID is required")
});

// Schema for moving folders (optional additional schema)
export const moveFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  newParentId: z.string().nullable()
});
