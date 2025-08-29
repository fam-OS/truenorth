-- CreateTable
CREATE TABLE "public"."CeoGoal" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CeoGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CeoGoal_organizationId_idx" ON "public"."CeoGoal"("organizationId");

-- AddForeignKey
ALTER TABLE "public"."CeoGoal" ADD CONSTRAINT "CeoGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
