import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config";
import { prisma } from "../db";
import { HttpError } from "../errors";

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: { id: string; role: Role }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: "HS256",
  } as jwt.SignOptions);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new HttpError(401, "Authentication required");
    }
    const token = header.slice(7).trim();
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    } catch {
      throw new HttpError(401, "Your session has expired. Please sign in again.");
    }
    if (!payload.sub) throw new HttpError(401, "Invalid token");

    // Always take the role from the database so revoked/changed roles apply immediately.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (!user) throw new HttpError(401, "Account no longer exists");

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "You do not have permission to do this"));
    next();
  };
