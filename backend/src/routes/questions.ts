import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { answerLimiter, askLimiter } from "../middleware/rateLimit";

const router = Router();
const PAGE_SIZE = 10;

const include = {
  askedBy: { select: { name: true } },
  answers: {
    orderBy: { createdAt: "asc" },
    include: {
      scholar: {
        select: { name: true, scholarProfile: { select: { id: true, specialization: true } } },
      },
    },
  },
} satisfies Prisma.QuestionInclude;

type Row = Prisma.QuestionGetPayload<{ include: typeof include }>;

// Only the asker's first name is public; emails are never exposed.
const toDto = (q: Row) => ({
  id: q.id,
  title: q.title,
  body: q.body,
  createdAt: q.createdAt,
  askedBy: q.askedBy.name.split(" ")[0],
  answers: q.answers.map((a) => ({
    id: a.id,
    body: a.body,
    reference: a.reference,
    createdAt: a.createdAt,
    scholar: {
      profileId: a.scholar.scholarProfile?.id ?? null,
      name: a.scholar.name,
      specialization: a.scholar.scholarProfile?.specialization ?? null,
    },
  })),
});

const askSchema = z.object({
  title: z.string().trim().min(10, "Write at least 10 characters").max(200),
  body: z.string().trim().min(10, "Add a few details (10+ characters)").max(2000),
});

const answerSchema = z.object({
  body: z.string().trim().min(20, "Write at least 20 characters").max(5000),
  reference: z
    .string()
    .trim()
    .min(5, "A reference is required (e.g. Quran 2:43, Sahih Bukhari 1, Hidayah)")
    .max(500),
});

// Public: list questions with their answers.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, filter, page } = z
      .object({
        q: z.string().trim().max(80).optional(),
        filter: z.enum(["all", "answered", "unanswered"]).default("all"),
        page: z.coerce.number().int().min(1).max(1000).default(1),
      })
      .parse(req.query);

    const where: Prisma.QuestionWhereInput = {
      ...(filter === "answered" ? { answers: { some: {} } } : {}),
      ...(filter === "unanswered" ? { answers: { none: {} } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const rows = await prisma.question.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1, // one extra row tells us whether another page exists
    });
    res.json({ questions: rows.slice(0, PAGE_SIZE).map(toDto), hasMore: rows.length > PAGE_SIZE });
  }),
);

// Any signed-in user can ask.
router.post(
  "/",
  requireAuth,
  askLimiter,
  asyncHandler(async (req, res) => {
    const data = askSchema.parse(req.body);
    const created = await prisma.question.create({
      data: { title: data.title, body: data.body, askedById: req.user!.id },
      include,
    });
    res.status(201).json({ question: toDto(created) });
  }),
);

// Only approved scholars can answer, and every answer must carry a reference.
router.post(
  "/:id/answers",
  requireAuth,
  requireRole("SCHOLAR"),
  answerLimiter,
  asyncHandler(async (req, res) => {
    const data = answerSchema.parse(req.body);

    const profile = await prisma.scholarProfile.findUnique({
      where: { userId: req.user!.id },
      select: { status: true },
    });
    if (!profile || profile.status !== "APPROVED") {
      throw new HttpError(403, "Only approved scholars can answer questions");
    }

    const question = await prisma.question.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!question) throw new HttpError(404, "Question not found");

    await prisma.answer.create({
      data: { body: data.body, reference: data.reference, questionId: question.id, scholarId: req.user!.id },
    });
    const full = await prisma.question.findUniqueOrThrow({ where: { id: question.id }, include });
    res.status(201).json({ question: toDto(full) });
  }),
);

export default router;
