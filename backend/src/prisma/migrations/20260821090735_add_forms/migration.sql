-- CreateTable
CREATE TABLE "forms" (
    "id" CHAR(26) NOT NULL,
    "form_type_id" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forms_form_type_id_idx" ON "forms"("form_type_id");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_form_type_id_fkey" FOREIGN KEY ("form_type_id") REFERENCES "form_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
