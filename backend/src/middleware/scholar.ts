import { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";

// Use after requireAuth. Allows only scholars whose application is APPROVED right now.
export async function requireApprovedScholar(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (req.user.role !== "SCHOLAR") throw new HttpError(403, "Only verified scholars can do this");
    const profile = await prisma.scholarProfile.findUnique({
      where: { userId: req.user.id },
      select: { status: true },
    });
    if (!profile || profile.status !== "APPROVED") {
      throw new HttpError(403, "Your scholar account is not approved");
    }
    next();
  } catch (err) {
    next(err);
  }
}
