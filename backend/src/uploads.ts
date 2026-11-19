import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { HttpError } from "./errors";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;

// Files are held in memory, checked, then written under a random name we choose.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: MAX_IMAGES, fields: 5, parts: MAX_IMAGES + 5 },
}).array("images", MAX_IMAGES);

// Identify the real file type from its first bytes. The browser-supplied type and file name are never trusted.
function detectExt(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveImages(files: Express.Multer.File[]): Promise<string[]> {
  const planned = files.map((f) => {
    const ext = detectExt(f.buffer);
    if (!ext) throw new HttpError(400, "Only JPG, PNG or WebP photos are allowed.");
    return { buffer: f.buffer, name: `${crypto.randomUUID()}.${ext}` };
  });
  // Validate everything first so a bad file never leaves a partial upload behind.
  await Promise.all(planned.map((p) => fs.promises.writeFile(path.join(UPLOAD_DIR, p.name), p.buffer, { flag: "wx" })));
  return planned.map((p) => p.name);
}

export async function removeImages(names: string[]) {
  await Promise.all(
    names.map((n) => fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(n))).catch(() => undefined)),
  );
}
