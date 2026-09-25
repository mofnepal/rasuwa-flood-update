-- AlterTable
ALTER TABLE "revenue_snapshots" ADD COLUMN     "detail" JSONB,
ALTER COLUMN "remaining_npr" DROP NOT NULL;
