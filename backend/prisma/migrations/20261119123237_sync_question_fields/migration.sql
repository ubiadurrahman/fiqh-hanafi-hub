CREATE TYPE "QuestionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ANSWERED', 'NEEDS_CLARIFICATION');

ALTER TABLE "Question"
  ADD COLUMN "originalBody" TEXT,
  ADD COLUMN "detectedLanguage" TEXT,
  ADD COLUMN "status" "QuestionStatus" NOT NULL DEFAULT 'SUBMITTED';

UPDATE "Question"
SET "originalBody" = "body"
WHERE "originalBody" IS NULL;

ALTER TABLE "Question"
  ALTER COLUMN "originalBody" SET NOT NULL;

CREATE INDEX "Question_status_idx" ON "Question"("status");
