const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
const TOKEN_KEY = "fh_token";

// Uploaded photos live on the API server (not under /api). When the API URL is absolute, use its origin.
const ORIGIN = /^https?:\/\//.test(BASE) ? new URL(BASE).origin : "";
export const assetUrl = (p: string) => `${ORIGIN}${p}`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = body instanceof FormData; // the browser sets the multipart boundary itself
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event("fh:unauthorized"));
    }
    throw new ApiError(res.status, data.message ?? "Request failed", data.errors);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export type Role = "USER" | "SCHOLAR" | "ADMIN";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Scholar {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  institution: string;
  experienceYears: number;
  city: string | null;
  bio: string;
}
export type AppStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface ScholarApplication extends Scholar {
  email: string;
  status: AppStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
export interface LoginAttempt {
  id: string;
  success: boolean;
  reason: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface QAAnswer {
  id: string;
  body: string;
  reference: string;
  createdAt: string;
  scholar: { profileId: string | null; name: string; specialization: string | null };
}
export type QuestionStatus = "SUBMITTED" | "UNDER_REVIEW" | "ANSWERED" | "NEEDS_CLARIFICATION";

export interface QAQuestion {
  id: string;
  title: string;
  body: string;
  originalBody: string;
  detectedLanguage: string | null;
  status: QuestionStatus;
  createdAt: string;
  askedBy: string;
  answers: QAAnswer[];
}

export interface PostAuthor {
  profileId: string | null;
  name: string;
  specialization: string | null;
}
export interface Post {
  id: string;
  body: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  images: string[];
}
export interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  minutes: number;
  author: PostAuthor;
}
export interface ArticleFull extends ArticleSummary {
  body: string;
  canEdit: boolean;
}
