import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { requireApprovedScholar } from "../middleware/scholar";
import { articleLimiter } from "../middleware/rateLimit";

const router = Router();
const LIMIT = 9;
const MIN_PUBLISH_CHARS = 200;

const include = {
  author: { select: { id: true, name: true, scholarProfile: { select: { id: true, specialization: true } } } },
} satisfies Prisma.ArticleInclude;
type Row = Prisma.ArticleGetPayload<{ include: typeof include }>;

const minutes = (body: string) => Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200));
const autoExcerpt = (body: string) => {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > 200 ? `${flat.slice(0, 197)}…` : flat;
};

const summary = (a: Row) => ({
  id: a.id,
  title: a.title,
  excerpt: a.excerpt,
  status: a.status,
  publishedAt: a.publishedAt,
  updatedAt: a.updatedAt,
  minutes: minutes(a.body),
  author: {
    profileId: a.author.scholarProfile?.id ?? null,
    name: a.author.name,
    specialization: a.author.scholarProfile?.specialization ?? null,
  },
});
const full = (a: Row, viewerId?: string) => ({ ...summary(a), body: a.body, canEdit: viewerId === a.author.id });

const fields = {
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(150),
  excerpt: z.string().trim().max(300).optional(),
  body: z.string().trim().min(50, "Write at least 50 characters").max(20000, "Articles are limited to 20,000 characters"),
};
const createSchema = z.object({ ...fields, publish: z.boolean().default(false) });
const updateSchema = z.object({
  title: fields.title.optional(),
  excerpt: fields.excerpt,
  body: fields.body.optional(),
  publish: z.boolean().optional(),
});

function assertPublishable(body: string) {
  if (body.trim().length < MIN_PUBLISH_CHARS) {
    throw new HttpError(400, `An article needs at least ${MIN_PUBLISH_CHARS} characters to be published. Save it as a draft for now.`);
  }
}

// Public list of published articles (cursor-paginated).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { cursor } = z.object({ cursor: z.string().max(40).optional() }).parse(req.query);
    const rows = await prisma.article.findMany({
      where: { status: "PUBLISHED", author: { scholarProfile: { status: "APPROVED" } } },
      include,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, LIMIT);
    res.json({ items: page.map(summary), nextCursor: rows.length > LIMIT ? page[page.length - 1].id : null });
  }),
);

// The signed-in scholar's own articles, including drafts. Must stay above "/:id".
router.get(
  "/mine",
  requireAuth,
  requireApprovedScholar,
  asyncHandler(async (req, res) => {
    const rows = await prisma.article.findMany({
      where: { authorId: req.user!.id },
      include,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    res.json({ items: rows.map(summary), nextCursor: null });
  }),
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const a = await prisma.article.findUnique({ where: { id: req.params.id }, include });
    // Drafts are visible only to their author; everyone else gets a plain 404.
    if (!a || (a.status !== "PUBLISHED" && a.author.id !== req.user?.id)) throw new HttpError(404, "Article not found");
    res.json({ article: full(a, req.user?.id) });
  }),
);

router.post(
  "/",
  requireAuth,
  requireApprovedScholar,
  articleLimiter,
  asyncHandler(async (req, res) => {
    const d = createSchema.parse(req.body);
    if (d.publish) assertPublishable(d.body);
    const created = await prisma.article.create({
      data: {
        title: d.title,
        body: d.body,
        excerpt: d.excerpt || autoExcerpt(d.body),
        status: d.publish ? "PUBLISHED" : "DRAFT",
        publishedAt: d.publish ? new Date() : null,
        authorId: req.user!.id,
      },
      include,
    });
    res.status(201).json({ article: full(created, req.user!.id) });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireApprovedScholar,
  articleLimiter,
  asyncHandler(async (req, res) => {
    const d = updateSchema.parse(req.body);
    const a = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!a || a.authorId !== req.user!.id) throw new HttpError(404, "Article not found");

    const body = d.body ?? a.body;
    const willPublish = d.publish ?? a.status === "PUBLISHED";
    if (willPublish) assertPublishable(body);

    const updated = await prisma.article.update({
      where: { id: a.id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.body !== undefined ? { body: d.body } : {}),
        ...(d.excerpt !== undefined || d.body !== undefined
          ? { excerpt: d.excerpt || autoExcerpt(body) }
          : {}),
        ...(d.publish !== undefined
          ? {
              status: d.publish ? "PUBLISHED" : "DRAFT",
              publishedAt: d.publish ? a.publishedAt ?? new Date() : a.publishedAt,
            }
          : {}),
      },
      include,
    });
    res.json({ article: full(updated, req.user!.id) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const a = await prisma.article.findUnique({ where: { id: req.params.id }, select: { id: true, authorId: true } });
    if (!a) throw new HttpError(404, "Article not found");
    if (a.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "You can only delete your own articles");
    }
    await prisma.article.delete({ where: { id: a.id } });
    res.json({ ok: true });
  }),
);

export default router;
