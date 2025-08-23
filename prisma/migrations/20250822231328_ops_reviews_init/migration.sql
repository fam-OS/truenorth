-- CreateEnum
CREATE TYPE "public"."Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateTable
CREATE TABLE "public"."OpsReview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quarter" "public"."Quarter" NOT NULL,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsReviewItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetMetric" DOUBLE PRECISION,
    "actualMetric" DOUBLE PRECISION,
    "quarter" "public"."Quarter" NOT NULL,
    "year" INTEGER NOT NULL,
    "opsReviewId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpsReview_teamId_idx" ON "public"."OpsReview"("teamId");

-- CreateIndex
CREATE INDEX "OpsReview_ownerId_idx" ON "public"."OpsReview"("ownerId");

-- CreateIndex
CREATE INDEX "OpsReviewItem_opsReviewId_idx" ON "public"."OpsReviewItem"("opsReviewId");

-- CreateIndex
CREATE INDEX "OpsReviewItem_teamId_idx" ON "public"."OpsReviewItem"("teamId");

-- CreateIndex
CREATE INDEX "OpsReviewItem_ownerId_idx" ON "public"."OpsReviewItem"("ownerId");

-- AddForeignKey
ALTER TABLE "public"."OpsReview" ADD CONSTRAINT "OpsReview_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsReview" ADD CONSTRAINT "OpsReview_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsReviewItem" ADD CONSTRAINT "OpsReviewItem_opsReviewId_fkey" FOREIGN KEY ("opsReviewId") REFERENCES "public"."OpsReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsReviewItem" ADD CONSTRAINT "OpsReviewItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsReviewItem" ADD CONSTRAINT "OpsReviewItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
