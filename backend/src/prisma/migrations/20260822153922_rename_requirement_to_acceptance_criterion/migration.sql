/*
  Warnings:

  - You are about to drop the `requirements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "requirements" DROP CONSTRAINT "requirements_id_fkey";

-- DropForeignKey
ALTER TABLE "requirements" DROP CONSTRAINT "requirements_user_story_id_fkey";

-- DropTable
DROP TABLE "requirements";

-- CreateTable
CREATE TABLE "acceptance_criteria" (
    "id" CHAR(26) NOT NULL,
    "user_story_id" CHAR(26) NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "acceptance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acceptance_criteria_user_story_id_idx" ON "acceptance_criteria"("user_story_id");

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_id_fkey" FOREIGN KEY ("id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_user_story_id_fkey" FOREIGN KEY ("user_story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
