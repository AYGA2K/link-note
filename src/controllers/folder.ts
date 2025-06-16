import type { Request, Response } from "express";
import { NotFoundError } from "../errors";
import Folder from "../models/folder";

export async function getAllFolders(req: Request, res: Response) {
	const folders = await Folder.find();
	res.status(200).json(folders);
}

export async function getFolderById(req: Request, res: Response) {
	const { id } = req.params;
	const folder = await Folder.findById(id);
	if (!folder) {
		throw new NotFoundError("Folder not found");
	}
	res.status(200).json(folder);
}

export async function createFolder(req: Request, res: Response) {
	const { userId, name, description, parentFolderId, tags, isRoot } = req.body;

	const folder = await new Folder({
		userId,
		name,
		description,
		parentFolderId: parentFolderId || null,
		tags: tags || [],
		isRoot: isRoot || false,
		childrenFolders: [],
		notes: [],
	}).save();

	// Update parent folder's children if this isn't a root folder
	if (parentFolderId) {
		await Folder.findByIdAndUpdate(parentFolderId, {
			$push: { childrenFolders: folder._id },
		});
	}

	res.status(201).json(folder);
}

export async function updateFolder(req: Request, res: Response) {
	const { id } = req.params;
	const { name, description, tags } = req.body;

	const folder = await Folder.findByIdAndUpdate(
		id,
		{ name, description, tags },
		{ new: true },
	);

	if (!folder) {
		throw new NotFoundError("Folder not found");
	}

	res.status(200).json(folder);
}

export async function moveFolder(req: Request, res: Response) {
	const { id, newParentId } = req.body;

	// Get current folder
	const folder = await Folder.findById(id);
	if (!folder) {
		throw new NotFoundError("Folder not found");
	}

	// Remove from old parent's children
	if (folder.parentFolderId) {
		await Folder.findByIdAndUpdate(folder.parentFolderId, {
			$pull: { childrenFolders: id },
		});
	}

	// Add to new parent's children
	if (newParentId) {
		await Folder.findByIdAndUpdate(newParentId, {
			$push: { childrenFolders: id },
		});
	}

	// Update folder's parent reference
	const updatedFolder = await Folder.findByIdAndUpdate(
		id,
		{ parentFolderId: newParentId || null, isRoot: !newParentId },
		{ new: true },
	);

	res.status(200).json(updatedFolder);
}

export async function deleteFolder(req: Request, res: Response) {
	const { id } = req.params;

	// Get folder and its children
	const folder = await Folder.findById(id);
	if (!folder) {
		throw new NotFoundError("Folder not found");
	}

	// Recursively delete children folders
	if (folder.childrenFolders.length > 0) {
		await Folder.deleteMany({ _id: { $in: folder.childrenFolders } });
	}

	// Remove from parent's children
	if (folder.parentFolderId) {
		await Folder.findByIdAndUpdate(folder.parentFolderId, {
			$pull: { childrenFolders: id },
		});
	}

	// Delete the folder
	await Folder.findByIdAndDelete(id);

	res
		.status(200)
		.json({ message: "Folder and its contents deleted successfully" });
}
