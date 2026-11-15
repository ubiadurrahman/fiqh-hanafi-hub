import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { requireApprovedScholar } from "../middleware/scholar";
import { likeLimiter, postLimiter } from "../middleware/rateLimit";
import { imageUpload, removeImages, saveImages } from "../uploads";

const router = Router();
const LIMIT = 10;

const include = {
  author: {
    select: { id: true, name: true, scholarProfile: { select: { id: true, specialization: true } } },
  },
  _count: { select: { likes: true } },
} satisfies Prisma.PostInclude;
type Row = Prisma.PostGetPayload<{ include: typeof include }>;

const toDto = (p: Row, viewer: { id: string; role: string } | undefined, liked: Set<string>) => ({
  id: p.id,
  body: p.body,
  images: p.images.map((n) => `/uploads/${n}`),
  createdAt: p.createdAt,
  author: {
    profileId: p.author.scholarProfile?.id ?? null,
    name: p.author.name,
    specialization: p.author.scholarProfile?.specialization ?? null,
  },
  likeCount: p._count.likes,
  likedByMe: liked.has(p.id),
  canDelete: !!viewer && (viewer.id === p.author.id || viewer.role === "ADMIN"),
});

async function likedSet(viewerId: string | undefined, ids: string[]) {
  if (!viewerId || ids.length === 0) return new Set<string>();
  const rows = await prisma.postLike.findMany({
    where: { userId: viewerId, postId: { in: ids } },
    select: { postId: true },
  });
  return new Set(rows.map((r) => r.postId));
}

// Public feed, newest first, cursor-paginated for infinite scroll.
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { cursor } = z.object({ cursor: z.string().max(40).optional() }).parse(req.query);
    const rows = await prisma.post.findMany({
      // Posts disappear from the feed if the scholar's approval is later revoked.
      where: { author: { scholarProfile: { status: "APPROVED" } } },
      include,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, LIMIT);
    const liked = await likedSet(req.user?.id, page.map((p) => p.id));
    res.json({
      items: page.map((p) => toDto(p, req.user, liked)),
      nextCursor: rows.length > LIMIT ? page[page.length - 1].id : null,
    });
  }),
);

// Only approved scholars can publish posts. Accepts multipart/form-data: "body" text + up to 4 "images".
// Authorisation runs before the upload is parsed, so anonymous requests never reach the file handling.
router.post(
  "/",
  requireAuth,
  requireApprovedScholar,
  postLimiter,
  imageUpload,
  asyncHandler(async (req, res) => {
    const { body } = z
      .object({ body: z.string().trim().max(3000, "Keep posts under 3000 characters").default("") })
      .parse(req.body ?? {});
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!body && files.length === 0) throw new HttpError(400, "Write something or attach a photo.");

    const images = await saveImages(files);
    try {
      const created = await prisma.post.create({ data: { body, images, authorId: req.user!.id }, include });
      res.status(201).json({ post: toDto(created, req.user, new Set()) });
    } catch (e) {
      await removeImages(images); // don't leave orphan files if the database write fails
      throw e;
    }
  }),
);

// Anyone signed in can like / unlike.
router.post(
  "/:id/like",
  requireAuth,
  likeLimiter,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user!.id;
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new HttpError(404, "Post not found");

    const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    let liked: boolean;
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      try {
        await prisma.postLike.create({ data: { postId, userId } });
      } catch (e) {
        // A double-tap can race; the unique index guarantees a single like.
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      }
      liked = true;
    }
    const likeCount = await prisma.postLike.count({ where: { postId } });
    res.json({ liked, likeCount });
  }),
);

// The author or an admin can delete (the photos are removed from disk too).
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { id: true, authorId: true, images: true },
    });
    if (!post) throw new HttpError(404, "Post not found");
    if (post.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "You can only delete your own posts");
    }
    await prisma.post.delete({ where: { id: post.id } });
    await removeImages(post.images);
    res.json({ ok: true });
  }),
);

export default router;
