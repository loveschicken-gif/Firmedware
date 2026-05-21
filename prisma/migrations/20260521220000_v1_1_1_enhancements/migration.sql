-- CreateEnum
CREATE TYPE "MatterVisibility" AS ENUM ('ASSIGNED_ONLY', 'ALL');

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'USER_GROUP';

-- CreateTable
CREATE TABLE "FirmSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "firmName" TEXT NOT NULL DEFAULT 'Firmedware',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "defaultMatterVisibility" "MatterVisibility" NOT NULL DEFAULT 'ASSIGNED_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable Client
ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable Matter
ALTER TABLE "Matter" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable DocumentLink
ALTER TABLE "DocumentLink" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable Task
ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable UserGroup
ALTER TABLE "UserGroup" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

-- AlterTable Tag
ALTER TABLE "Tag" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Client_deletedAt_idx" ON "Client"("deletedAt");
CREATE INDEX "Matter_deletedAt_idx" ON "Matter"("deletedAt");
CREATE INDEX "DocumentLink_deletedAt_idx" ON "DocumentLink"("deletedAt");
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");
CREATE INDEX "UserGroup_deletedAt_idx" ON "UserGroup"("deletedAt");
CREATE INDEX "Tag_deletedAt_idx" ON "Tag"("deletedAt");

-- AddForeignKey Client
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Matter
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey DocumentLink
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Task
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey UserGroup
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Tag
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default firm settings row
INSERT INTO "FirmSettings" ("id", "firmName", "timezone", "defaultMatterVisibility", "updatedAt")
VALUES ('default', 'Firmedware', 'Asia/Bangkok', 'ASSIGNED_ONLY', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
