import { Request, Response, NextFunction } from 'express';
import { HttpError, InternalServerError } from '../errors';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        name: err.name,
      },
    });
  }
  if (err instanceof ZodError) {
    res.status(400).json(err.issues);
  }
  // For unhandled errors
  const internalError = new InternalServerError();
  res.status(internalError.statusCode).json({
    error: {
      message: internalError.message,
      name: internalError.name,
    },
  });
}
