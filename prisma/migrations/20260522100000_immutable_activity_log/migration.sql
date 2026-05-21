-- Immutable audit trail: snapshot actor, prevent user cascade delete, block UPDATE/DELETE

ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "actorName" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "actorEmail" TEXT;

UPDATE "ActivityLog" al
SET
  "actorName" = u."name",
  "actorEmail" = u."email"
FROM "User" u
WHERE al."userId" = u."id"
  AND (al."actorName" IS NULL OR al."actorEmail" IS NULL);

ALTER TABLE "ActivityLog" ALTER COLUMN "actorName" SET NOT NULL;
ALTER TABLE "ActivityLog" ALTER COLUMN "actorEmail" SET NOT NULL;

ALTER TABLE "ActivityLog" DROP CONSTRAINT IF EXISTS "ActivityLog_userId_fkey";
ALTER TABLE "ActivityLog"
  ADD CONSTRAINT "ActivityLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ActivityLog records are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_log_no_update ON "ActivityLog";
CREATE TRIGGER activity_log_no_update
  BEFORE UPDATE ON "ActivityLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_activity_log_mutation();

DROP TRIGGER IF EXISTS activity_log_no_delete ON "ActivityLog";
CREATE TRIGGER activity_log_no_delete
  BEFORE DELETE ON "ActivityLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_activity_log_mutation();
