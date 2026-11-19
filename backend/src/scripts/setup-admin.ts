import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Creates (or promotes) the first administrator using credentials from environment
// variables. No credentials are hard-coded in the source.
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Site Administrator";

  if (!email) throw new Error("Set ADMIN_EMAIL in .env");
  const strong = pass.length >= 12 && /[a-z]/.test(pass) && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  if (!strong) throw new Error("ADMIN_PASSWORD must be 12+ chars with upper, lower and a number");

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(pass, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash, name },
      create: { email, name, passwordHash, role: "ADMIN" },
    });
    console.log(`Administrator ready: ${user.email}. Now remove ADMIN_PASSWORD from .env.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
