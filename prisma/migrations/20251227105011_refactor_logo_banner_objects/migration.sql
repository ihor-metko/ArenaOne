-- Migration: Refactor logo and banner fields to JSON objects
-- This migration converts logo and heroImage string fields to JSON objects
-- and migrates existing data from metadata to new structure

-- Step 1: Add new banner column for Organization
ALTER TABLE "Organization" ADD COLUMN "banner" TEXT;

-- Step 2: Migrate Organization data
-- Move heroImage to banner.url and extract bannerAlignment from metadata
UPDATE "Organization" SET 
  "banner" = CASE 
    WHEN "heroImage" IS NOT NULL THEN 
      json_build_object(
        'url', "heroImage",
        'position', COALESCE(
          NULLIF(metadata::json->>'bannerAlignment', ''),
          'center'
        )
      )::text
    ELSE NULL
  END,
  "logo" = CASE 
    WHEN "logo" IS NOT NULL THEN
      json_build_object(
        'url', "logo",
        'theme', COALESCE(metadata::json->'logoMetadata'->>'logoTheme', NULL),
        'secondUrl', COALESCE(metadata::json->'logoMetadata'->>'secondLogo', NULL),
        'secondTheme', COALESCE(metadata::json->'logoMetadata'->>'secondLogoTheme', NULL)
      )::text
    ELSE NULL
  END
WHERE "heroImage" IS NOT NULL OR "logo" IS NOT NULL;

-- Step 3: Clean up Organization metadata (remove migrated fields)
UPDATE "Organization" SET 
  "metadata" = CASE 
    WHEN "metadata" IS NOT NULL THEN
      (
        SELECT json_object_agg(key, value)::text
        FROM json_each("metadata"::json)
        WHERE key NOT IN ('bannerAlignment', 'logoMetadata')
      )
    ELSE "metadata"
  END
WHERE "metadata" IS NOT NULL;

-- Step 4: Drop old heroImage column from Organization
ALTER TABLE "Organization" DROP COLUMN "heroImage";

-- Step 5: Add new banner column for Club
ALTER TABLE "Club" ADD COLUMN "banner" TEXT;

-- Step 6: Migrate Club data
-- Move heroImage to banner.url and extract bannerAlignment from metadata
UPDATE "Club" SET 
  "banner" = CASE 
    WHEN "heroImage" IS NOT NULL THEN 
      json_build_object(
        'url', "heroImage",
        'position', COALESCE(
          NULLIF(metadata::json->>'bannerAlignment', ''),
          'center'
        )
      )::text
    ELSE NULL
  END,
  "logo" = CASE 
    WHEN "logo" IS NOT NULL THEN
      json_build_object(
        'url', "logo",
        'theme', COALESCE(metadata::json->'logoMetadata'->>'logoTheme', NULL),
        'secondUrl', COALESCE(metadata::json->'logoMetadata'->>'secondLogo', NULL),
        'secondTheme', COALESCE(metadata::json->'logoMetadata'->>'secondLogoTheme', NULL)
      )::text
    ELSE NULL
  END
WHERE "heroImage" IS NOT NULL OR "logo" IS NOT NULL;

-- Step 7: Clean up Club metadata (remove migrated fields)
UPDATE "Club" SET 
  "metadata" = CASE 
    WHEN "metadata" IS NOT NULL THEN
      (
        SELECT json_object_agg(key, value)::text
        FROM json_each("metadata"::json)
        WHERE key NOT IN ('bannerAlignment', 'logoMetadata')
      )
    ELSE "metadata"
  END
WHERE "metadata" IS NOT NULL;

-- Step 8: Drop old heroImage column from Club
ALTER TABLE "Club" DROP COLUMN "heroImage";
