-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'BILLING_RECORD';

-- AlterTable
ALTER TABLE "FirmSettings" ADD COLUMN IF NOT EXISTS "enableBilling" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "matterId" TEXT,
    "invoiceNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "externalLink" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingRecord_clientId_idx" ON "BillingRecord"("clientId");
CREATE INDEX "BillingRecord_matterId_idx" ON "BillingRecord"("matterId");
CREATE INDEX "BillingRecord_status_idx" ON "BillingRecord"("status");
CREATE INDEX "BillingRecord_dueDate_idx" ON "BillingRecord"("dueDate");
CREATE INDEX "BillingRecord_deletedAt_idx" ON "BillingRecord"("deletedAt");

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
