import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";
import { prisma } from "../db";

// Like requireAuth, but never fails: public endpoints use it to know who (if anyone) is viewing,
// e.g. to show "liked by me" or let an author see their own draft.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const payload = jwt.verify(header.slice(7).trim(), env.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
      if (payload.sub) {
        const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
        if (user) req.user = { id: user.id, role: user.role };
      }
    }
  } catch {
    /* invalid or expired token: treat as anonymous */
  }
  next();
}
