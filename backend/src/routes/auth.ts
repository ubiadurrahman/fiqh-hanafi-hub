import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, HttpError } from "../errors";
import { signToken } from "../middleware/auth";
import { authLimiter, loginLimiter } from "../middleware/rateLimit";

const router = Router();
router.use(authLimiter);

const BCRYPT_COST = 12;
// Used to keep response time similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

const email = z.string().trim().toLowerCase().email("Enter a valid email").max(254);
const name = z.string().trim().min(2, "Enter your full name").max(80);

const registerSchema = z.object({ name, email, password });

const scholarSchema = registerSchema.extend({
  qualification: z.string().trim().min(3).max(150),
  specialization: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .refine(
      (v) => [
        "Hanafi Fiqh",
        "Hadith",
        "Tafsir",
        "Tafseer",
        "Quran Recitation (Tajweed)",
        "Aqeedah",
        "Arabic Language",
      ].includes(v),
      "Select a valid specialization from the list",
    ),
  institution: z.string().trim().min(2).max(150),
  experienceYears: z.coerce.number().int().min(0).max(80),
  city: z
    .preprocess((v) => (v === "" ? undefined : v), z.string().trim().min(2).max(80).optional().nullish()),
  bio: z.string().trim().min(50, "Write at least 50 characters").max(1000),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});

const publicUser = (u: { id: string; name: string; email: string; role: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (exists) throw new HttpError(409, "An account with this email already exists");

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, BCRYPT_COST),
        role: "USER",
      },
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.post(
  "/register-scholar",
  asyncHandler(async (req, res) => {
    const data = scholarSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (exists) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);
    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, passwordHash, role: "SCHOLAR" },
      });
      return tx.scholarProfile.create({
        data: {
          userId: user.id,
          qualification: data.qualification,
          specialization: data.specialization,
          institution: data.institution,
          experienceYears: data.experienceYears,
          city: data.city ?? null,
          bio: data.bio,
          status: "PENDING",
        },
      });
    });
    res.status(201).json({
      message: "Application submitted. An administrator will review it, and you can sign in once it is approved.",
      scholarId: profile.id,
    });
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const ip = req.ip ?? null;
    const userAgent = (req.headers["user-agent"] ?? "").toString().slice(0, 300) || null;

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { scholarProfile: { select: { id: true, status: true } } },
    });

    const ok = await bcrypt.compare(data.password, user?.passwordHash ?? DUMMY_HASH);
    const profile = user?.scholarProfile ?? null;

    const record = (success: boolean, reason?: string) =>
      user && profile
        ? prisma.loginAttempt.create({
            data: {
              email: data.email,
              success,
              reason: reason ?? null,
              ip,
              userAgent,
              userId: user.id,
              scholarProfileId: profile.id,
            },
          })
        : Promise.resolve();

    if (!user || !ok) {
      await record(false, "Wrong password");
      throw new HttpError(401, "Incorrect email or password");
    }

    if (user.role === "SCHOLAR" && profile && profile.status !== "APPROVED") {
      await record(false, `Application ${profile.status.toLowerCase()}`);
      throw new HttpError(
        403,
        profile.status === "PENDING"
          ? "Your scholar application is still pending review."
          : "Your scholar application was not approved. Please contact the administrators.",
      );
    }

    await record(true);
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

export default router;
