import { Request, Response } from 'express';
import { BadRequestError, NotFoundError } from '../errors';
import Note from '../models/note';

export async function getAllNotes(req: Request, res: Response) {
  const notes = await Note.find();
  res.status(200).json(notes);
};

export async function getNoteById(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    throw new BadRequestError('Invalid request');
  }
  const note = await Note.findById(id);
  if (!note) {
    throw new NotFoundError('Note not found');
  }
  res.status(200).json(note);
};

export async function createNote(req: Request, res: Response) {
  const { title, content, tags, linksTo, folderId } = req.body;
  const note = await new Note({
    title,
    content,
    tags,
    linksTo,
    folderId,
  }).save();
  res.status(201).json(note);
};

export async function updateNote(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError('Invalid request');
  }
  const { title, content, tags, linksTo, folderId } = req.body;
  const note = await Note.findByIdAndUpdate(id, {
    title,
    content,
    tags,
    linksTo,
    folderId,
  }, { new: true });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  res.status(200).json(note);
};

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError('Invalid request');
  }
  const note = await Note.findByIdAndDelete(id);

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  res.status(200).json(note);
};
