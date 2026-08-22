-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "condition" JSONB;

-- AlterTable
ALTER TABLE "form_template_fields" ADD COLUMN     "condition" JSONB;
