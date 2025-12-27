-- Drop deprecated logo and heroImage columns from Organization table
-- Data has already been migrated to logoData and bannerData fields
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "logo";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "heroImage";

-- Drop deprecated logo and heroImage columns from Club table
-- Data has already been migrated to logoData and bannerData fields
ALTER TABLE "Club" DROP COLUMN IF EXISTS "logo";
ALTER TABLE "Club" DROP COLUMN IF EXISTS "heroImage";
