import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {

  // Handle HttpError
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        name: err.name,
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        name: 'ValidationError',
        issues: err.issues,
      },
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId format)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: {
        message: `Invalid value for ${err.path}: ${err.value}`,
        name: 'CastError',
        path: err.path,
        value: err.value,
      },
    });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json(err);
    return;
  }

  res.status(500).json(err);

}
