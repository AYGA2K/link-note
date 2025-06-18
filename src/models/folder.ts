import mongoose, { type Document, type Model, Schema, Types } from "mongoose";

export interface IFolder extends Document {
	userId: Types.ObjectId;
	name: string;
	description?: string;
	parentFolderId?: Types.ObjectId | null;
	childrenFolders: Types.ObjectId[];
	notes: Types.ObjectId[];
	tags: string[];
	isRoot: boolean;
}

const FolderSchema = new Schema<IFolder>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: {
			type: String,
			required: true,
			minlength: 3,
			maxlength: 30,
		},
		description: {
			type: String,
			required: false,
		},
		parentFolderId: {
			type: Schema.Types.ObjectId,
			ref: "Folder",
			default: null, // null indicates it's a root folder
		},
		childrenFolders: [
			{
				type: Schema.Types.ObjectId,
				ref: "Folder",
				default: [],
			},
		],
		notes: [
			{
				type: Schema.Types.ObjectId,
				ref: "Note",
				default: [],
			},
		],
		tags: {
			type: [String],
			default: [],
		},
		isRoot: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

FolderSchema.pre<IFolder>("save", async function (next) {
	if (!this.isModified("parentFolderId") || !this.parentFolderId) {
		return next();
	}

	// Check direct self-reference
	if (this.id === this.parentFolderId) {
		throw new CircularReferenceError("Folder cannot be its own parent");
	}

	// Check if parent is in immediate children
	if (this.childrenFolders.some((childId) => childId.toString() === this.id)) {
		throw new CircularReferenceError("Cannot set a child folder as parent");
	}

	// Deep check for circular references
	const parentFolder = await Folder.findById(this.parentFolderId)
		.select("childrenFolders")
		.lean();

	if (parentFolder?.childrenFolders?.length) {
		await isAncestor(this.parentFolderId.toString(), this.id);
	}

	next();
});
FolderSchema.pre("findOneAndUpdate", async function (next) {
	const update = this.getUpdate() as IFolder;
	if (!update || !update.parentFolderId) return next();

	const newParentId = update.parentFolderId;
	const folderId = this.getFilter()._id;

	if (!folderId) {
		throw new Error("Folder ID is required for update");
	}

	// Convert to strings for consistent comparison
	const folderIdStr = folderId.toString();
	const newParentIdStr = newParentId.toString();

	// Get the folder being moved (if it exists)
	const folderToMove = await Folder.findById(folderId)
		.select("childrenFolders")
		.lean();

	if (folderIdStr === newParentIdStr) {
		throw new CircularReferenceError("Cannot move a folder to itself");
	}

	// Check if new parent is in immediate children
	if (
		folderToMove?.childrenFolders?.some(
			(childId) => childId.toString() === newParentIdStr,
		)
	) {
		throw new CircularReferenceError("Cannot set a child folder as parent");
	}

	// Check if new parent creates a circular reference
	if (await isAncestor(newParentIdStr, folderIdStr)) {
		throw new CircularReferenceError(
			`Circular reference detected: Folder ${folderIdStr} would become an ancestor of itself`,
		);
	}
	next();
});
async function isAncestor(
	parentId: string,
	folderId: string,
): Promise<boolean> {
	const children = await Folder.findById(parentId);
	if (children === null) {
		return false;
	}
	if (children.parentFolderId?.toString() === folderId) {
		return true;
	}
	for (const childId of children.childrenFolders) {
		if (await isAncestor(childId.toString(), folderId)) {
			return true;
		}
	}
	return false;
}

const Folder: Model<IFolder> = mongoose.model<IFolder>("Folder", FolderSchema);

export class CircularReferenceError extends Error {
	constructor(message = "Circular folder reference detected") {
		super(message);
		this.name = this.constructor.name;
	}
}
export default Folder;
