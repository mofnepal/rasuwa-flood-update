-- CreateTable
CREATE TABLE "action_plans" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'action_plan',
    "date_ad" TIMESTAMP(3) NOT NULL,
    "date_bs" TEXT NOT NULL,
    "issuer_ne" TEXT NOT NULL,
    "issuer_en" TEXT NOT NULL,
    "title_ne" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "summary_ne" TEXT NOT NULL,
    "summary_en" TEXT NOT NULL,
    "data" JSONB NOT NULL,
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

    CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_plans_disasterId_status_date_ad_idx" ON "action_plans"("disasterId", "status", "date_ad");

-- CreateIndex
CREATE UNIQUE INDEX "action_plans_disasterId_slug_key" ON "action_plans"("disasterId", "slug");

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
