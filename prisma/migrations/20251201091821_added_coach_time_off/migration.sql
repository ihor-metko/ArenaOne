-- CreateTable
CREATE TABLE "CoachTimeOff" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachTimeOff_coachId_idx" ON "CoachTimeOff"("coachId");

-- CreateIndex
CREATE INDEX "CoachTimeOff_coachId_date_idx" ON "CoachTimeOff"("coachId", "date");

-- AddForeignKey
ALTER TABLE "CoachTimeOff" ADD CONSTRAINT "CoachTimeOff_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
