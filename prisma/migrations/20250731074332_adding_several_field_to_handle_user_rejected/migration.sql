-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "resubmit_allowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resubmitted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "co_profiles" ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mitra_profiles" ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;
