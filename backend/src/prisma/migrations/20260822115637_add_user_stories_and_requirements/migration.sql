-- CreateTable
CREATE TABLE "user_stories" (
    "id" CHAR(26) NOT NULL,
    "deliverable_id" CHAR(26) NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "user_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" CHAR(26) NOT NULL,
    "user_story_id" CHAR(26) NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_stories_deliverable_id_idx" ON "user_stories"("deliverable_id");

-- CreateIndex
CREATE INDEX "requirements_user_story_id_idx" ON "requirements"("user_story_id");

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_id_fkey" FOREIGN KEY ("id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_id_fkey" FOREIGN KEY ("id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_user_story_id_fkey" FOREIGN KEY ("user_story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
