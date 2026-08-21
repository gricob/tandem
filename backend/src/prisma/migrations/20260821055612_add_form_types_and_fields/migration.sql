-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('text', 'textarea', 'number', 'boolean', 'select', 'multi_select', 'date');

-- CreateTable
CREATE TABLE "form_types" (
    "id" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" CHAR(26) NOT NULL,
    "form_type_id" CHAR(26) NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "FormFieldType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_fields_form_type_id_idx" ON "form_fields"("form_type_id");

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_type_id_fkey" FOREIGN KEY ("form_type_id") REFERENCES "form_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
