import rateLimit from "express-rate-limit";

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a few minutes and try again." },
};

export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 30 });
export const loginLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true });

export const askLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 10 });
export const answerLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 40 });

export const postLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 30 });
export const articleLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 40 });
export const likeLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 120 });
