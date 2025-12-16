-- AlterEnum
ALTER TYPE "ClubMembershipRole" ADD VALUE 'CLUB_OWNER';

-- AlterTable
ALTER TABLE "Club" ADD COLUMN "wayforpayKey" TEXT,
ADD COLUMN "liqpayKey" TEXT;
