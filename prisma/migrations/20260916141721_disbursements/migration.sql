-- CreateEnum
CREATE TYPE "DisbursementStage" AS ENUM ('fund_transfer', 'onward');

-- CreateTable
CREATE TABLE "disbursements" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stage" "DisbursementStage" NOT NULL,
    "date_ad" TIMESTAMP(3) NOT NULL,
    "date_bs" TEXT NOT NULL,
    "payer_ne" TEXT NOT NULL,
    "payer_en" TEXT NOT NULL,
    "recipient_ne" TEXT NOT NULL,
    "recipient_en" TEXT NOT NULL,
    "recipient_kind" TEXT NOT NULL,
    "recipient_count" INTEGER,
    "amount_npr" DECIMAL(18,2) NOT NULL,
    "purpose_ne" TEXT NOT NULL,
    "purpose_en" TEXT NOT NULL,
    "source_ne" TEXT NOT NULL,
    "source_en" TEXT NOT NULL,
    "as_of" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disbursements_disasterId_status_date_ad_idx" ON "disbursements"("disasterId", "status", "date_ad");

-- CreateIndex
CREATE UNIQUE INDEX "disbursements_disasterId_slug_key" ON "disbursements"("disasterId", "slug");

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
