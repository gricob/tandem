-- Dev-only data reset: existing deliverables (and the forms backing their user
-- stories/acceptance criteria) are disposable test data. workstream_id and
-- order_index are NOT NULL below, so there is nothing sensible to backfill them
-- with; clearing the table avoids a broken migration on non-empty data.
DELETE FROM "forms" WHERE "id" IN (SELECT "id" FROM "acceptance_criteria");
DELETE FROM "forms" WHERE "id" IN (SELECT "id" FROM "user_stories");
DELETE FROM "deliverables";

-- CreateTable
CREATE TABLE "workstreams" (
    "id" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workstreams_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "deliverables" ADD COLUMN     "order_index" INTEGER NOT NULL,
ADD COLUMN     "workstream_id" CHAR(26) NOT NULL;

-- CreateIndex
CREATE INDEX "deliverables_workstream_id_idx" ON "deliverables"("workstream_id");

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_workstream_id_fkey" FOREIGN KEY ("workstream_id") REFERENCES "workstreams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
