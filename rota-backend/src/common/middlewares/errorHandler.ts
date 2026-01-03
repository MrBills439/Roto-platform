import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors/ApiError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR"
      },
      details: err.flatten()
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code
      },
      details: err.details
    });
  }

  return res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    }
  });
};
