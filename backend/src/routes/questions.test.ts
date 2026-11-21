import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PrismaClient, QuestionStatus, Role } from "@prisma/client";
import express from "express";
import { prisma } from "../db";
import questionRoutes from "./questions";
import { signToken } from "../middleware/auth";
import { errorHandler } from "../errors";
import bcrypt from "bcryptjs";
import request from "supertest";

const prismaClient = new PrismaClient();

const TEST_ADMIN_EMAIL = "status-test-admin@example.com";
const TEST_ADMIN_PASSWORD = "StrongAdminPass123";
const TEST_SCHOLAR_EMAIL = "status-test-scholar@example.com";
const TEST_SCHOLAR_PASSWORD = "StrongScholarPass123";
const TEST_USER_EMAIL = "status-test-user@example.com";
const TEST_USER_PASSWORD = "StrongUserPass123";

let adminToken = "";
let scholarToken = "";
let userToken = "";
let testQuestionId = "";

async function createTestUsers() {
  const hash = (p: string) => bcrypt.hash(p, 12);

  let admin = await prismaClient.user.findUnique({ where: { email: TEST_ADMIN_EMAIL } });
  if (!admin) {
    admin = await prismaClient.user.create({
      data: {
        email: TEST_ADMIN_EMAIL,
        name: "Status Test Admin",
        passwordHash: await hash(TEST_ADMIN_PASSWORD),
        role: Role.ADMIN,
      },
    });
  } else {
    await prismaClient.user.update({
      where: { id: admin.id },
      data: { role: Role.ADMIN, passwordHash: await hash(TEST_ADMIN_PASSWORD) },
    });
  }

  let scholar = await prismaClient.user.findUnique({ where: { email: TEST_SCHOLAR_EMAIL } });
  if (!scholar) {
    scholar = await prismaClient.user.create({
      data: {
        email: TEST_SCHOLAR_EMAIL,
        name: "Status Test Scholar",
        passwordHash: await hash(TEST_SCHOLAR_PASSWORD),
        role: Role.SCHOLAR,
        scholarProfile: {
          create: {
            qualification: "Test Qualification",
            specialization: "Hanafi Fiqh",
            institution: "Test Institution",
            experienceYears: 5,
            bio: "Test bio for status testing.",
            status: "APPROVED",
          },
        },
      },
    });
  } else {
    await prismaClient.user.update({
      where: { id: scholar.id },
      data: { role: Role.SCHOLAR, passwordHash: await hash(TEST_SCHOLAR_PASSWORD) },
    });
    await prismaClient.scholarProfile.upsert({
      where: { userId: scholar.id },
      update: { status: "APPROVED" },
      create: {
        userId: scholar.id,
        qualification: "Test Qualification",
        specialization: "Hanafi Fiqh",
        institution: "Test Institution",
        experienceYears: 5,
        bio: "Test bio for status testing.",
        status: "APPROVED",
      },
    });
  }

  let user = await prismaClient.user.findUnique({ where: { email: TEST_USER_EMAIL } });
  if (!user) {
    user = await prismaClient.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: "Status Test User",
        passwordHash: await hash(TEST_USER_PASSWORD),
        role: Role.USER,
      },
    });
  } else {
    await prismaClient.user.update({
      where: { id: user.id },
      data: { role: Role.USER, passwordHash: await hash(TEST_USER_PASSWORD) },
    });
  }
}

function generateToken(user: { id: string; role: Role }) {
  return signToken(user);
}

async function createTestQuestion(askedById: string, status: QuestionStatus = "SUBMITTED") {
  const q = await prismaClient.question.create({
    data: {
      title: "Test question for status workflow",
      body: "This is a test question body to verify status transitions.",
      originalBody: "This is a test question body to verify status transitions.",
      status,
      askedById,
    },
  });
  return q.id;
}

const app = express();
app.use(express.json());
app.use("/api/questions", questionRoutes);
app.use(errorHandler);

describe("PATCH /api/questions/:id/status", () => {
  beforeAll(async () => {
    await createTestUsers();

    const adminUser = await prismaClient.user.findUnique({ where: { email: TEST_ADMIN_EMAIL } });
    const scholarUser = await prismaClient.user.findUnique({ where: { email: TEST_SCHOLAR_EMAIL } });
    const regularUser = await prismaClient.user.findUnique({ where: { email: TEST_USER_EMAIL } });

    adminToken = generateToken({ id: adminUser!.id, role: adminUser!.role });
    scholarToken = generateToken({ id: scholarUser!.id, role: scholarUser!.role });
    userToken = generateToken({ id: regularUser!.id, role: regularUser!.role });
  });

  afterAll(async () => {
    await prismaClient.question.deleteMany({
      where: { title: "Test question for status workflow" },
    });
    await prismaClient.user.deleteMany({
      where: {
        email: { in: [TEST_ADMIN_EMAIL, TEST_SCHOLAR_EMAIL, TEST_USER_EMAIL] },
      },
    });
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    const user = await prismaClient.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    testQuestionId = await createTestQuestion(user!.id, "SUBMITTED");
  });

  afterEach(async () => {
    await prismaClient.question.deleteMany({
      where: { id: testQuestionId },
    });
  });

  it("should reject invalid status values", async () => {
    const res = await request(app)
      .patch(`/api/questions/${testQuestionId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INVALID_STATUS" });
    expect(res.status).toBe(400);
  });

  it("should successfully update status when Admin provides valid token", async () => {
    const res = await request(app)
      .patch(`/api/questions/${testQuestionId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "UNDER_REVIEW" });
    expect(res.status).toBe(200);
    expect(res.body.question.status).toBe("UNDER_REVIEW");
  });

  it("should successfully update status when Scholar provides valid token", async () => {
    const res = await request(app)
      .patch(`/api/questions/${testQuestionId}/status`)
      .set("Authorization", `Bearer ${scholarToken}`)
      .send({ status: "ANSWERED" });
    expect(res.status).toBe(200);
    expect(res.body.question.status).toBe("ANSWERED");
  });

  it("should throw 403 for regular users", async () => {
    const res = await request(app)
      .patch(`/api/questions/${testQuestionId}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "ANSWERED" });
    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent question", async () => {
    const res = await request(app)
      .patch("/api/questions/nonexistent-id/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ANSWERED" });
    expect(res.status).toBe(404);
  });

  it("should allow transitioning through all status values", async () => {
    const statuses: QuestionStatus[] = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "ANSWERED",
      "NEEDS_CLARIFICATION",
      "SUBMITTED",
    ];

    for (const status of statuses) {
      const res = await request(app)
        .patch(`/api/questions/${testQuestionId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.question.status).toBe(status);
    }
  });
});
describe("POST /api/questions (with translation)", () => {
  let postUserToken = "";

  beforeAll(async () => {
    await createTestUsers();

    const adminUser = await prismaClient.user.findUnique({ where: { email: TEST_ADMIN_EMAIL } });
    const scholarUser = await prismaClient.user.findUnique({ where: { email: TEST_SCHOLAR_EMAIL } });
    const regularUser = await prismaClient.user.findUnique({ where: { email: TEST_USER_EMAIL } });

    adminToken = generateToken({ id: adminUser!.id, role: adminUser!.role });
    scholarToken = generateToken({ id: scholarUser!.id, role: scholarUser!.role });
    userToken = generateToken({ id: regularUser!.id, role: regularUser!.role });
    postUserToken = userToken;
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({
      where: {
        email: { in: [TEST_ADMIN_EMAIL, TEST_SCHOLAR_EMAIL, TEST_USER_EMAIL] },
      },
    });
    await prismaClient.$disconnect();
  });

  afterEach(async () => {
    await prismaClient.question.deleteMany({});
  });

  it("should save originalBody and translated body for English input", async () => {
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${postUserToken}`)
      .send({
        title: "What is the ruling on prayer?",
        body: "What is the ruling on missing a prayer intentionally?",
      });
    expect(res.status).toBe(201);
    expect(res.body.question.originalBody).toBe("What is the ruling on missing a prayer intentionally?");
    expect(res.body.question.body).toBeDefined();
    expect(res.body.question.detectedLanguage).toBeDefined();
  });

  it("should reject body shorter than 10 characters", async () => {
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${postUserToken}`)
      .send({
        title: "Short question",
        body: "short",
      });
    expect(res.status).toBe(400);
  });

  it("should reject missing body", async () => {
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${postUserToken}`)
      .send({
        title: "Missing body question",
      });
    expect(res.status).toBe(400);
  });

  it("should require authentication", async () => {
    const res = await request(app)
      .post("/api/questions")
      .send({
        title: "Unauthenticated question",
        body: "This question has no auth token.",
      });
    expect(res.status).toBe(401);
  });
});