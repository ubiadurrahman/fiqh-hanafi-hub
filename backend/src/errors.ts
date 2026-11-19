import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Please correct the highlighted fields.",
      errors: err.flatten().fieldErrors,
    });
  }
  if (err instanceof MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each photo must be 5 MB or smaller."
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "You can attach up to 4 photos."
          : "The upload could not be processed.";
    return res.status(400).json({ message: msg });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof SyntaxError && "body" in (err as object)) {
    return res.status(400).json({ message: "Malformed JSON body" });
  }
  console.error(err);
  // Never leak internals to clients.
  return res.status(500).json({ message: "Something went wrong. Please try again later." });
}
