-- Remove legacy address fields from Club table
-- These fields are now stored in the address JSON field
ALTER TABLE "Club" DROP COLUMN "location";
ALTER TABLE "Club" DROP COLUMN "city";
ALTER TABLE "Club" DROP COLUMN "country";
ALTER TABLE "Club" DROP COLUMN "latitude";
ALTER TABLE "Club" DROP COLUMN "longitude";
