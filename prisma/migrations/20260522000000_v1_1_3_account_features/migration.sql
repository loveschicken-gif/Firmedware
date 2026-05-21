-- AlterEnum: add SHAREPOINT to DocumentProvider
ALTER TYPE "DocumentProvider" ADD VALUE IF NOT EXISTS 'SHAREPOINT' AFTER 'ONEDRIVE';

-- AlterTable FirmSettings
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "enableEntityNotes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "enableComments" BOOLEAN NOT NULL DEFAULT false;
