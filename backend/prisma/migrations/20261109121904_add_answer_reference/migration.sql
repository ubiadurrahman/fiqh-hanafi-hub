/*
  Warnings:

  - Added the required column `reference` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");
