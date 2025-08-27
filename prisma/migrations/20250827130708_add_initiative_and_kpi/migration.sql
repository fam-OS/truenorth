-- CreateTable
CREATE TABLE "public"."Initiative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "valueProposition" TEXT,
    "implementationDetails" TEXT,
    "releaseDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Kpi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMetric" DOUBLE PRECISION,
    "actualMetric" DOUBLE PRECISION,
    "quarter" "public"."Quarter" NOT NULL,
    "year" INTEGER NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "initiativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Initiative_organizationId_idx" ON "public"."Initiative"("organizationId");

-- CreateIndex
CREATE INDEX "Initiative_ownerId_idx" ON "public"."Initiative"("ownerId");

-- CreateIndex
CREATE INDEX "Kpi_organizationId_idx" ON "public"."Kpi"("organizationId");

-- CreateIndex
CREATE INDEX "Kpi_teamId_idx" ON "public"."Kpi"("teamId");

-- CreateIndex
CREATE INDEX "Kpi_initiativeId_idx" ON "public"."Kpi"("initiativeId");

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kpi" ADD CONSTRAINT "Kpi_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kpi" ADD CONSTRAINT "Kpi_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kpi" ADD CONSTRAINT "Kpi_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
