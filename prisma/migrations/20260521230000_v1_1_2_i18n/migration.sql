-- AlterTable FirmSettings
ALTER TABLE "FirmSettings" ADD COLUMN "defaultLanguage" TEXT NOT NULL DEFAULT 'th';

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'th';
