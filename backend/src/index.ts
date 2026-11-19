import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config";
import { prisma } from "./db";
import { errorHandler, notFound } from "./errors";
import { apiLimiter } from "./middleware/rateLimit";
import { UPLOAD_DIR } from "./uploads";
import authRoutes from "./routes/auth";
import scholarRoutes from "./routes/scholars";
import adminRoutes from "./routes/admin";
import questionRoutes from "./routes/questions";
import postRoutes from "./routes/posts";
import articleRoutes from "./routes/articles";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / tools without an Origin header, and whitelisted browser origins.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "100kb" })); // articles can be long; still bounded
app.use("/api", apiLimiter);

// Uploaded photos: static, no directory listing, never sniffed or executed as anything but an image.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: "deny",
    maxAge: "7d",
    immutable: true,
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // allow the frontend origin to display them
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    },
  }),
);

app.get("/api", (_req, res) => {
  res.json({ name: "Fiqh-e-Hanafi Hub API", version: "1.0.0" });
});
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "database unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/scholars", scholarRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/articles", articleRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
