-- CreateTable
CREATE TABLE "announced_support" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contributor_ne" TEXT NOT NULL,
    "contributor_en" TEXT NOT NULL,
    "contributor_kind" TEXT NOT NULL,
    "amount_npr" DECIMAL(18,2),
    "amount_text_ne" TEXT NOT NULL,
    "amount_text_en" TEXT NOT NULL,
    "approximate" BOOLEAN NOT NULL DEFAULT false,
    "announced_on" TIMESTAMP(3),
    "announced_bs" TEXT,
    "state" TEXT NOT NULL,
    "register_ref" TEXT,
    "note_ne" TEXT,
    "note_en" TEXT,
    "source_ne" TEXT NOT NULL,
    "source_en" TEXT NOT NULL,
    "source_url" TEXT,
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

    CONSTRAINT "announced_support_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announced_support_disasterId_status_idx" ON "announced_support"("disasterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "announced_support_disasterId_slug_key" ON "announced_support"("disasterId", "slug");

-- AddForeignKey
ALTER TABLE "announced_support" ADD CONSTRAINT "announced_support_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announced_support" ADD CONSTRAINT "announced_support_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announced_support" ADD CONSTRAINT "announced_support_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announced_support" ADD CONSTRAINT "announced_support_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
