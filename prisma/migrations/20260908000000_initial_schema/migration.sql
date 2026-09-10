-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('draft', 'verified', 'published', 'archived');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('entry', 'verifier', 'publisher', 'admin');

-- CreateEnum
CREATE TYPE "ContributorType" AS ENUM ('institutional', 'individual', 'government_embassy', 'corporation', 'multilateral', 'ingo_foundation', 'diaspora', 'individual_abroad');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('cheque', 'bank_transfer', 'cash', 'card', 'qr', 'ips', 'remittance', 'online', 'other');

-- CreateEnum
CREATE TYPE "AssistanceKind" AS ENUM ('cash', 'cash_cheque', 'in_kind', 'pledge');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('NCHL', 'FONEPAY', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "SnapshotPeriod" AS ENUM ('daily', 'cumulative');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('pdf', 'jpg', 'png', 'xlsx', 'csv');

-- CreateEnum
CREATE TYPE "DecisionKind" AS ENUM ('cabinet_decision', 'mof_notice', 'mof_decision', 'cash_support', 'other');

-- CreateEnum
CREATE TYPE "Agency" AS ENUM ('NDRRMA', 'NEPAL_POLICE');

-- CreateTable
CREATE TABLE "disasters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_ne" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "event_date_ad" TIMESTAMP(3) NOT NULL,
    "event_date_bs" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disasters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "sn" INTEGER,
    "date_ad" TIMESTAMP(3) NOT NULL,
    "date_bs" TEXT NOT NULL,
    "contributor_name" TEXT NOT NULL,
    "contributor_name_ne" TEXT,
    "contributor_type" "ContributorType" NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "amount_npr" DECIMAL(18,2),
    "amount_usd" DECIMAL(18,2),
    "fx_rate" DECIMAL(18,4),
    "sector" TEXT NOT NULL DEFAULT 'other',
    "sector_auto" TEXT,
    "cheque_or_ref" TEXT,
    "receiving_office" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL,
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

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreign_assistance" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "date_ad" TIMESTAMP(3) NOT NULL,
    "date_bs" TEXT NOT NULL,
    "contributor" TEXT NOT NULL,
    "contributor_ne" TEXT,
    "country_iso2" TEXT,
    "country_ne" TEXT,
    "country_en" TEXT,
    "contributor_type" "ContributorType" NOT NULL,
    "kind" "AssistanceKind" NOT NULL,
    "channel" TEXT NOT NULL,
    "channel_ne" TEXT,
    "amount_usd" DECIMAL(18,2),
    "amount_npr_equiv" DECIMAL(18,2),
    "fx_rate" DECIMAL(18,4),
    "in_kind_description" TEXT,
    "in_kind_valuation_npr" DECIMAL(18,2),
    "purpose_ne" TEXT NOT NULL,
    "purpose_en" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "photoId" TEXT,
    "pledge_received_at" TIMESTAMP(3),
    "source" TEXT NOT NULL,
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

    CONSTRAINT "foreign_assistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_snapshots" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "network" "Network" NOT NULL,
    "period" "SnapshotPeriod" NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL,
    "period_date" TIMESTAMP(3),
    "channel_code" TEXT NOT NULL,
    "channel_label_en" TEXT NOT NULL,
    "channel_label_ne" TEXT NOT NULL,
    "txn_count" INTEGER NOT NULL,
    "amount_npr" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL,
    "as_of_label_ne" TEXT,
    "as_of_label_en" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_status_snapshots" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "as_of" TIMESTAMP(3) NOT NULL,
    "as_of_bs" TEXT NOT NULL,
    "as_of_en" TEXT NOT NULL,
    "source_ne" TEXT NOT NULL,
    "source_en" TEXT NOT NULL,
    "fx_rate" DECIMAL(18,4) NOT NULL,
    "npr_before" DECIMAL(18,2) NOT NULL,
    "npr_balance" DECIMAL(18,2) NOT NULL,
    "npr_gross" DECIMAL(18,2) NOT NULL,
    "npr_usage" DECIMAL(18,2) NOT NULL,
    "npr_usage_note_ne" TEXT,
    "npr_usage_note_en" TEXT,
    "usd_before" DECIMAL(18,2) NOT NULL,
    "usd_balance" DECIMAL(18,2) NOT NULL,
    "usd_gross" DECIMAL(18,2) NOT NULL,
    "usd_equiv_npr" DECIMAL(18,2) NOT NULL,
    "total_available_npr" DECIMAL(18,2) NOT NULL,
    "series" JSONB NOT NULL,
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

    CONSTRAINT "fund_status_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescue_reports" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "agency" "Agency" NOT NULL,
    "report_at" TIMESTAMP(3) NOT NULL,
    "report_at_bs" TEXT NOT NULL,
    "source" TEXT NOT NULL,
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

    CONSTRAINT "rescue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "DecisionKind" NOT NULL,
    "date_ad" TIMESTAMP(3),
    "date_bs" TEXT NOT NULL,
    "issuer_ne" TEXT NOT NULL,
    "issuer_en" TEXT NOT NULL,
    "title_ne" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "summary_ne" TEXT NOT NULL,
    "summary_en" TEXT NOT NULL,
    "categories" JSONB,
    "originalId" TEXT,
    "explainerId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measures" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_ne" TEXT NOT NULL,
    "category_en" TEXT NOT NULL,
    "agency_ne" TEXT NOT NULL,
    "agency_en" TEXT NOT NULL,
    "title_ne" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "who_ne" TEXT NOT NULL,
    "who_en" TEXT,
    "benefit_ne" TEXT NOT NULL,
    "benefit_en" TEXT,
    "deadline_ne" TEXT,
    "deadline_en" TEXT,
    "cabinet_text_ne" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "disasterId" TEXT,
    "group_ne" TEXT NOT NULL,
    "group_en" TEXT NOT NULL,
    "title_ne" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "name_ne" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contributionId" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'entry',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ip" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "disasters_slug_key" ON "disasters"("slug");

-- CreateIndex
CREATE INDEX "contributions_disasterId_status_date_ad_idx" ON "contributions"("disasterId", "status", "date_ad");

-- CreateIndex
CREATE INDEX "contributions_disasterId_sector_idx" ON "contributions"("disasterId", "sector");

-- CreateIndex
CREATE INDEX "foreign_assistance_disasterId_status_date_ad_idx" ON "foreign_assistance"("disasterId", "status", "date_ad");

-- CreateIndex
CREATE INDEX "channel_snapshots_disasterId_network_period_snapshot_at_idx" ON "channel_snapshots"("disasterId", "network", "period", "snapshot_at");

-- CreateIndex
CREATE UNIQUE INDEX "channel_snapshots_disasterId_network_period_snapshot_at_cha_key" ON "channel_snapshots"("disasterId", "network", "period", "snapshot_at", "channel_code");

-- CreateIndex
CREATE UNIQUE INDEX "fund_status_snapshots_disasterId_as_of_key" ON "fund_status_snapshots"("disasterId", "as_of");

-- CreateIndex
CREATE INDEX "rescue_reports_disasterId_status_report_at_idx" ON "rescue_reports"("disasterId", "status", "report_at");

-- CreateIndex
CREATE UNIQUE INDEX "rescue_reports_disasterId_agency_report_at_key" ON "rescue_reports"("disasterId", "agency", "report_at");

-- CreateIndex
CREATE INDEX "decisions_disasterId_status_date_bs_idx" ON "decisions"("disasterId", "status", "date_bs");

-- CreateIndex
CREATE UNIQUE INDEX "decisions_disasterId_slug_key" ON "decisions"("disasterId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "measures_decisionId_no_key" ON "measures"("decisionId", "no");

-- CreateIndex
CREATE INDEX "attachments_sha256_idx" ON "attachments"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "messages_handled_createdAt_idx" ON "messages"("handled", "createdAt");

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_assistance" ADD CONSTRAINT "foreign_assistance_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_assistance" ADD CONSTRAINT "foreign_assistance_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_assistance" ADD CONSTRAINT "foreign_assistance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_assistance" ADD CONSTRAINT "foreign_assistance_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_assistance" ADD CONSTRAINT "foreign_assistance_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_status_snapshots" ADD CONSTRAINT "fund_status_snapshots_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_status_snapshots" ADD CONSTRAINT "fund_status_snapshots_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_status_snapshots" ADD CONSTRAINT "fund_status_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_status_snapshots" ADD CONSTRAINT "fund_status_snapshots_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_status_snapshots" ADD CONSTRAINT "fund_status_snapshots_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_reports" ADD CONSTRAINT "rescue_reports_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_reports" ADD CONSTRAINT "rescue_reports_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_reports" ADD CONSTRAINT "rescue_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_reports" ADD CONSTRAINT "rescue_reports_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_reports" ADD CONSTRAINT "rescue_reports_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_explainerId_fkey" FOREIGN KEY ("explainerId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measures" ADD CONSTRAINT "measures_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

