/*
  Warnings:

  - You are about to drop the column `form_type_id` on the `form_fields` table. All the data in the column will be lost.
  - You are about to drop the column `form_type_id` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the `form_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `form_id` to the `form_fields` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "form_fields" DROP CONSTRAINT "form_fields_form_type_id_fkey";

-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_form_type_id_fkey";

-- DropIndex
DROP INDEX "form_fields_form_type_id_idx";

-- DropIndex
DROP INDEX "forms_form_type_id_idx";

-- AlterTable
ALTER TABLE "form_fields" DROP COLUMN "form_type_id",
ADD COLUMN     "form_id" CHAR(26) NOT NULL;

-- AlterTable
ALTER TABLE "forms" DROP COLUMN "form_type_id",
ADD COLUMN     "form_template_id" CHAR(26);

-- DropTable
DROP TABLE "form_types";

-- CreateTable
CREATE TABLE "form_templates" (
    "id" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_template_fields" (
    "id" CHAR(26) NOT NULL,
    "form_template_id" CHAR(26) NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "FormFieldType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_template_fields_form_template_id_idx" ON "form_template_fields"("form_template_id");

-- CreateIndex
CREATE INDEX "form_fields_form_id_idx" ON "form_fields"("form_id");

-- CreateIndex
CREATE INDEX "forms_form_template_id_idx" ON "forms"("form_template_id");

-- AddForeignKey
ALTER TABLE "form_template_fields" ADD CONSTRAINT "form_template_fields_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
