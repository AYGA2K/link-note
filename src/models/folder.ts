import mongoose, { Document, Model, Schema, Types } from 'mongoose';

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
      ref: 'User',
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
      ref: 'Folder',
      default: null, // null indicates it's a root folder
    },
    childrenFolders: [{
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: [],
    }],
    notes: [{
      type: Schema.Types.ObjectId,
      ref: 'Note',
      default: [],
    }],
    tags: {
      type: [String],
      default: [],
    },
    isRoot: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Folder: Model<IFolder> = mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
