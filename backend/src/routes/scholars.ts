import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";

const router = Router();

const select = {
  id: true,
  qualification: true,
  specialization: true,
  institution: true,
  experienceYears: true,
  city: true,
  bio: true,
  createdAt: true,
  user: { select: { name: true } }, // email intentionally not exposed publicly
} as const;

type Row = {
  id: string;
  qualification: string;
  specialization: string;
  institution: string;
  experienceYears: number;
  city: string | null;
  bio: string;
  createdAt: Date;
  user: { name: string };
};

const toDto = (r: Row) => ({
  id: r.id,
  name: r.user.name,
  qualification: r.qualification,
  specialization: r.specialization,
  institution: r.institution,
  experienceYears: r.experienceYears,
  city: r.city,
  bio: r.bio,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q } = z.object({ q: z.string().trim().max(80).optional() }).parse(req.query);
    const rows = await prisma.scholarProfile.findMany({
      where: {
        status: "APPROVED",
        ...(q
          ? {
              OR: [
                { user: { name: { contains: q, mode: "insensitive" } } },
                { specialization: { contains: q, mode: "insensitive" } },
                { institution: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select,
      orderBy: { user: { name: "asc" } },
      take: 100,
    });
    res.json({ scholars: rows.map(toDto) });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.scholarProfile.findFirst({
      where: { id: req.params.id, status: "APPROVED" },
      select,
    });
    if (!row) throw new HttpError(404, "Scholar not found");
    res.json({ scholar: toDto(row) });
  }),
);

export default router;
