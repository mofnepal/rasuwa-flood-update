-- AlterTable
ALTER TABLE "foreign_assistance" ADD COLUMN     "aid_list_note" JSONB,
ADD COLUMN     "amount_text" TEXT,
ADD COLUMN     "detail_en" TEXT,
ADD COLUMN     "detail_ne" TEXT,
ADD COLUMN     "fund_register_ref" TEXT,
ADD COLUMN     "in_fund" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "report_status" TEXT,
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "stated_to_fund" BOOLEAN;
