import { Router } from "express";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const include = { user: { select: { name: true, email: true } } } satisfies Prisma.ScholarProfileInclude;
type Row = Prisma.ScholarProfileGetPayload<{ include: typeof include }>;

const toDto = (r: Row) => ({
  id: r.id,
  name: r.user.name,
  email: r.user.email,
  qualification: r.qualification,
  specialization: r.specialization,
  institution: r.institution,
  experienceYears: r.experienceYears,
  city: r.city,
  bio: r.bio,
  status: r.status,
  rejectionReason: r.rejectionReason,
  createdAt: r.createdAt,
  reviewedAt: r.reviewedAt,
});

const statusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

async function listByStatus(status: ApplicationStatus) {
  const rows = await prisma.scholarProfile.findMany({
    where: { status },
    include,
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 200,
  });
  return rows.map(toDto);
}

router.get(
  "/scholars/pending",
  asyncHandler(async (_req, res) => {
    res.json({ scholars: await listByStatus("PENDING") });
  }),
);

router.get(
  "/scholars/stats",
  asyncHandler(async (_req, res) => {
    const groups = await prisma.scholarProfile.groupBy({ by: ["status"], _count: { _all: true } });
    const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<ApplicationStatus, number>;
    for (const g of groups) stats[g.status] = g._count._all;
    res.json({ stats });
  }),
);

router.get(
  "/scholars",
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: statusSchema.default("PENDING") }).parse(req.query);
    res.json({ scholars: await listByStatus(status) });
  }),
);

router.get(
  "/scholars/:scholarId/login-attempts",
  asyncHandler(async (req, res) => {
    const exists = await prisma.scholarProfile.findUnique({
      where: { id: req.params.scholarId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Scholar application not found");
    const attempts = await prisma.loginAttempt.findMany({
      where: { scholarProfileId: req.params.scholarId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, success: true, reason: true, ip: true, userAgent: true, createdAt: true },
    });
    res.json({ attempts });
  }),
);

router.get(
  "/scholars/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.scholarProfile.findUnique({ where: { id: req.params.id }, include });
    if (!row) throw new HttpError(404, "Scholar application not found");
    res.json({ scholar: toDto(row) });
  }),
);

router.patch(
  "/scholars/:id/approve",
  asyncHandler(async (req, res) => {
    const existing = await prisma.scholarProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Scholar application not found");
    const row = await prisma.scholarProfile.update({
      where: { id: existing.id },
      data: {
        status: "APPROVED",
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
      include,
    });
    res.json({ scholar: toDto(row) });
  }),
);

router.patch(
  "/scholars/:id/reject",
  asyncHandler(async (req, res) => {
    const { reason } = z
      .object({ reason: z.string().trim().min(5, "Give a short reason (5+ characters)").max(500) })
      .parse(req.body);
    const existing = await prisma.scholarProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Scholar application not found");
    const row = await prisma.scholarProfile.update({
      where: { id: existing.id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
      include,
    });
    res.json({ scholar: toDto(row) });
  }),
);

// Delete a scholar application (and the associated user account).
// Admins can intentionally remove any scholar — even APPROVED ones — if needed.
router.delete(
  "/scholars/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.scholarProfile.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, userId: true },
    });
    if (!existing) throw new HttpError(404, "Scholar application not found");
    await prisma.$transaction(async (tx) => {
      await tx.loginAttempt.deleteMany({ where: { scholarProfileId: existing.id } });
      await tx.scholarProfile.delete({ where: { id: existing.id } });
      await tx.user.delete({ where: { id: existing.userId } });
    });
    res.json({ message: "Scholar removed successfully" });
  }),
);

export default router;
