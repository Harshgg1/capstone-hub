import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const response: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message,
  };

  if (config.nodeEnv === 'development' && !(err instanceof AppError && err.isOperational)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
