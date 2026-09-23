-- CreateTable
CREATE TABLE "revenue_snapshots" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "fiscal_year_bs" TEXT NOT NULL,
    "fiscal_year_en" TEXT NOT NULL,
    "as_of" TIMESTAMP(3) NOT NULL,
    "as_of_bs" TEXT NOT NULL,
    "as_of_en" TEXT NOT NULL,
    "target_npr" DECIMAL(18,2) NOT NULL,
    "collected_npr" DECIMAL(18,2) NOT NULL,
    "remaining_npr" DECIMAL(18,2) NOT NULL,
    "remaining_note_ne" TEXT,
    "remaining_note_en" TEXT,
    "date_note_ne" TEXT,
    "date_note_en" TEXT,
    "offices" JSONB,
    "narrative_ne" TEXT,
    "narrative_en" TEXT,
    "source_ne" TEXT NOT NULL,
    "source_en" TEXT NOT NULL,
    "originalId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_snapshots_disasterId_department_status_idx" ON "revenue_snapshots"("disasterId", "department", "status");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_snapshots_disasterId_department_as_of_key" ON "revenue_snapshots"("disasterId", "department", "as_of");

-- AddForeignKey
ALTER TABLE "revenue_snapshots" ADD CONSTRAINT "revenue_snapshots_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_snapshots" ADD CONSTRAINT "revenue_snapshots_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_snapshots" ADD CONSTRAINT "revenue_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_snapshots" ADD CONSTRAINT "revenue_snapshots_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_snapshots" ADD CONSTRAINT "revenue_snapshots_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
