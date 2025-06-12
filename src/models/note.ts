import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface INote extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  linksTo?: Types.ObjectId[];
  folderId: Types.ObjectId;
}

const NoteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      required: true,
      type: [String],
      default: [],
    },
    linksTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Note',
      },
    ],
    folderId: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: 'Folder',
    },
  },
  { timestamps: true }
);

const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);

export default Note;
