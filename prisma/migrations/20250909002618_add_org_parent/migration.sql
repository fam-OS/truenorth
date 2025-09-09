-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Organization_parentId_idx" ON "public"."Organization"("parentId");

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
