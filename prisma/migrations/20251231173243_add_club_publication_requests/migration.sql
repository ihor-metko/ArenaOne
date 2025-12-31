-- CreateEnum
CREATE TYPE "PublicationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClubPublicationRequest" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "PublicationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPublicationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubPublicationRequest_clubId_idx" ON "ClubPublicationRequest"("clubId");

-- CreateIndex
CREATE INDEX "ClubPublicationRequest_requestedById_idx" ON "ClubPublicationRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ClubPublicationRequest_status_idx" ON "ClubPublicationRequest"("status");

-- CreateIndex
CREATE INDEX "ClubPublicationRequest_createdAt_idx" ON "ClubPublicationRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "ClubPublicationRequest" ADD CONSTRAINT "ClubPublicationRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPublicationRequest" ADD CONSTRAINT "ClubPublicationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPublicationRequest" ADD CONSTRAINT "ClubPublicationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
