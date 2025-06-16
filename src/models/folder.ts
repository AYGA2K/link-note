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
	if (
		this.childrenFolders.some((childId) => childId.equals(this.parentFolderId))
	) {
		throw new CircularReferenceError("Cannot set a child folder as parent");
	}

	// Deep check for circular references
	const parentFolder = await Folder.findById(this.parentFolderId)
		.select("childrenFolders")
		.lean();

	if (parentFolder?.childrenFolders?.length) {
		if (this._id instanceof Types.ObjectId)
			await checkCircularReference(this._id, parentFolder.childrenFolders);
	}

	next();
});

FolderSchema.pre("findOneAndUpdate", async function (next) {
	const update = this.getUpdate() as IFolder;
	if (!update) return next;

	if (!update.parentFolderId) return next();
	const parentFolderId = update.parentFolderId;

	const folderId = this.getFilter()._id;

	// Check direct self-reference
	if (folderId === parentFolderId) {
		throw new CircularReferenceError("Folder cannot be its own parent");
	}

	// Get current folder's children
	const currentFolder = await Folder.findById(folderId)
		.select("childrenFolders")
		.lean();

	// Check if new parent is in immediate children
	if (
		currentFolder?.childrenFolders?.some((childId) =>
			childId.equals(parentFolderId),
		)
	) {
		throw new CircularReferenceError("Cannot set a child folder as parent");
	}

	// Deep check for circular references
	const parentFolder = await Folder.findById(parentFolderId)
		.select("childrenFolders")
		.lean();

	if (parentFolder?.childrenFolders?.length) {
		await checkCircularReference(folderId, parentFolder.childrenFolders);
	}

	next();
});

async function checkCircularReference(
	forbiddenParentId: Types.ObjectId,
	childrenFolders: Types.ObjectId[],
	checkedIds = new Set<string>(),
): Promise<void> {
	console.log("we are in check");
	for (const childId of childrenFolders) {
		// Skip if already checked
		if (checkedIds.has(childId.toString())) continue;

		// Check if this child is the forbidden parent
		if (childId.equals(forbiddenParentId)) {
			throw new CircularReferenceError(
				`Circular reference detected: Folder ${forbiddenParentId} cannot be a parent of its ancestor`,
			);
		}

		// Mark as checked
		checkedIds.add(childId.toString());

		// Get the child's children
		const childFolder = await Folder.findById(childId)
			.select("childrenFolders")
			.lean();

		// Recursively check if this child has children
		if (childFolder?.childrenFolders?.length) {
			await checkCircularReference(
				forbiddenParentId,
				childFolder.childrenFolders,
				checkedIds,
			);
		}
	}
}
const Folder: Model<IFolder> = mongoose.model<IFolder>("Folder", FolderSchema);

export class CircularReferenceError extends Error {
	constructor(message = "Circular folder reference detected") {
		super(message);
		this.name = this.constructor.name;
	}
}
export default Folder;
