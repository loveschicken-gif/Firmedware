-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('DATA', 'AUTH', 'SECURITY', 'ADMIN', 'DOCUMENT');
CREATE TYPE "WorkflowEntityType" AS ENUM ('MATTER', 'TASK', 'DOCUMENT_LINK', 'CONTRACT');
CREATE TYPE "DocumentSensitivity" AS ENUM ('NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL', 'PRIVILEGED');

-- AlterEnum EntityType
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'FIRM_SETTINGS';

-- FirmSettings security fields
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "confidentialityNoticeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "requireDocumentPermissionConfirm" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "failedLoginLockoutThreshold" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "failedLoginLockoutMinutes" INTEGER NOT NULL DEFAULT 30;

-- User security fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastFailedLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- WorkflowStatus
CREATE TABLE IF NOT EXISTS "WorkflowStatus" (
    "id" TEXT NOT NULL,
    "entityType" "WorkflowEntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "labelTh" TEXT,
    "labelEn" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowStatus_entityType_name_key" ON "WorkflowStatus"("entityType", "name");
CREATE INDEX IF NOT EXISTS "WorkflowStatus_entityType_active_sortOrder_idx" ON "WorkflowStatus"("entityType", "active", "sortOrder");

-- Matter.statusId
ALTER TABLE "Matter" ADD COLUMN IF NOT EXISTS "statusId" TEXT;
CREATE INDEX IF NOT EXISTS "Matter_statusId_idx" ON "Matter"("statusId");
ALTER TABLE "Matter" DROP CONSTRAINT IF EXISTS "Matter_statusId_fkey";
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "WorkflowStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DocumentLink.sensitivity
ALTER TABLE "DocumentLink" ADD COLUMN IF NOT EXISTS "sensitivity" "DocumentSensitivity" NOT NULL DEFAULT 'NORMAL';

-- Task.deadlineType
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "deadlineType" TEXT;

-- ActivityLog.category
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "category" "ActivityCategory" NOT NULL DEFAULT 'DATA';
CREATE INDEX IF NOT EXISTS "ActivityLog_category_idx" ON "ActivityLog"("category");
