-- CreateEnum
CREATE TYPE "DocumentReferenceType" AS ENUM ('EXTERNAL_URL', 'LOCAL_PATH', 'MANUAL_REFERENCE');

-- AlterTable
ALTER TABLE "DocumentLink" ADD COLUMN "referenceType" "DocumentReferenceType" NOT NULL DEFAULT 'EXTERNAL_URL';

-- Backfill local folder paths stored before reference types existed
UPDATE "DocumentLink"
SET "referenceType" = 'LOCAL_PATH'
WHERE "provider" = 'LOCAL_FOLDER'
  AND "url" NOT ILIKE 'http://%'
  AND "url" NOT ILIKE 'https://%';
