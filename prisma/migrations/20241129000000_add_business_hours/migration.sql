-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "fridayClose" INTEGER,
ADD COLUMN     "fridayOpen" INTEGER,
ADD COLUMN     "mondayClose" INTEGER,
ADD COLUMN     "mondayOpen" INTEGER,
ADD COLUMN     "saturdayClose" INTEGER,
ADD COLUMN     "saturdayOpen" INTEGER,
ADD COLUMN     "sundayClose" INTEGER,
ADD COLUMN     "sundayOpen" INTEGER,
ADD COLUMN     "thursdayClose" INTEGER,
ADD COLUMN     "thursdayOpen" INTEGER,
ADD COLUMN     "tuesdayClose" INTEGER,
ADD COLUMN     "tuesdayOpen" INTEGER,
ADD COLUMN     "wednesdayClose" INTEGER,
ADD COLUMN     "wednesdayOpen" INTEGER;

-- AlterTable
ALTER TABLE "Court" ADD COLUMN     "courtCloseTime" INTEGER,
ADD COLUMN     "courtOpenTime" INTEGER;

-- CreateTable
CREATE TABLE "ClubSpecialHours" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "openTime" INTEGER NOT NULL,
    "closeTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubSpecialHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubSpecialHours_clubId_date_key" ON "ClubSpecialHours"("clubId", "date");

-- AddForeignKey
ALTER TABLE "ClubSpecialHours" ADD CONSTRAINT "ClubSpecialHours_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
