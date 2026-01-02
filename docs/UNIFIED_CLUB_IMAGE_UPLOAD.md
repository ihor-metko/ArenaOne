# Unified Club Image Upload Mechanism

## Overview

All club images (logo, banner/heroImage, secondLogo, and gallery) are now uploaded through a **single unified endpoint**: `/api/images/clubs/[id]/upload`.

This document describes the unified approach and replaces the previous fragmented image upload system.

## Unified Upload Endpoint

**Endpoint:** `POST /api/images/clubs/[id]/upload`

**Authentication:** Requires club admin, club owner, or root admin permissions.

### Request

#### Form Data Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | The image file to upload |
| `type` | string | Yes | Image type: `"logo"`, `"heroImage"`, `"secondLogo"`, or `"gallery"` |

#### Supported Image Types

- **`logo`** - Club logo (stored in `logoData` JSON field)
- **`heroImage`** - Hero/banner image (stored in `bannerData` JSON field)
- **`secondLogo`** - Secondary logo (stored in `metadata` JSON field)
- **`gallery`** - Gallery image (file uploaded but not stored in Club table)

### Response

```json
{
  "success": true,
  "url": "https://domain.com/uploads/clubs/{clubId}/{timestamp}-{random}.webp",
  "filename": "{timestamp}-{random}.webp",
  "type": "logo"
}
```

### Example Usage

```typescript
// Upload a logo
const formData = new FormData();
formData.append("file", logoFile);
formData.append("type", "logo");

const response = await fetch(`/api/images/clubs/${clubId}/upload`, {
  method: "POST",
  body: formData,
});

const { url, filename } = await response.json();
```

## Database Storage

### Logo and Banner

Logo and heroImage types are automatically stored in the Club table:

```typescript
// Logo upload updates logoData field
{
  "logoData": "{\"url\": \"https://...\"}"
}

// HeroImage upload updates bannerData field
{
  "bannerData": "{\"url\": \"https://...\"}"
}
```

### Second Logo

Second logo is stored in the metadata field:

```typescript
{
  "metadata": "{\"secondLogo\": \"https://...\"}"
}
```

### Gallery Images

Gallery images are **only uploaded to storage**. They are not automatically stored in the `ClubGallery` table. To save gallery images to the database, use the `/api/admin/clubs/[id]/media` endpoint.

## Managing Club Media

**Endpoint:** `PATCH /api/admin/clubs/[id]/media`

This endpoint updates logo, banner, and gallery in a single transaction.

### Request Body

```json
{
  "logoData": { "url": "https://..." },
  "bannerData": { "url": "https://..." },
  "gallery": [
    {
      "id": "existing-image-id",
      "imageUrl": "https://...",
      "imageKey": "unique-key",
      "altText": "Description",
      "sortOrder": 0
    }
  ]
}
```

### Response

```json
{
  "success": true
}
```

Note: According to the [club-update-endpoints-migration guide](./api/club-update-endpoints-migration.md), this endpoint returns only `{ success: true }`. Clients should update their local state optimistically.

## Frontend Usage Pattern

### 1. Upload Individual Images

Use `/api/images/clubs/[id]/upload` to upload files:

```typescript
const uploadFile = async (file: File, type: "logo" | "heroImage" | "gallery") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch(`/api/images/clubs/${clubId}/upload`, {
    method: "POST",
    body: formData,
  });

  const { url, filename } = await response.json();
  return { url, key: filename };
};
```

### 2. Save Gallery to Database

After uploading gallery images, save them to the database:

```typescript
const saveGallery = async (galleryImages: GalleryImage[]) => {
  const response = await fetch(`/api/admin/clubs/${clubId}/media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gallery: galleryImages.map((img, index) => ({
        imageUrl: img.imageUrl,
        imageKey: img.imageKey,
        altText: img.altText,
        sortOrder: index,
      })),
    }),
  });

  const { success } = await response.json();
  return success;
};
```

### 3. Complete Workflow Example

```typescript
// Step 1: Upload logo
const logoResult = await uploadFile(logoFile, "logo");
// Logo is automatically saved to Club.logoData

// Step 2: Upload hero image
const heroResult = await uploadFile(heroFile, "heroImage");
// Hero is automatically saved to Club.bannerData

// Step 3: Upload gallery images
const galleryUploads = await Promise.all(
  galleryFiles.map(file => uploadFile(file, "gallery"))
);

// Step 4: Save gallery to database
await saveGallery(galleryUploads.map((upload, index) => ({
  imageUrl: upload.url,
  imageKey: upload.key,
  altText: galleryFiles[index].name,
  sortOrder: index,
})));
```

## Migration from Old Endpoints

### Deprecated Endpoints

The following endpoints are **no longer used**:

- ~~`POST /api/admin/clubs/[id]/images`~~ - Use `/api/images/clubs/[id]/upload` instead
- ~~`DELETE /api/admin/clubs/[id]/images/[imageId]`~~ - Use `/api/admin/clubs/[id]/media` to update gallery

### Migration Steps

1. **Update upload calls:**
   ```typescript
   // Before
   await fetch(`/api/admin/clubs/${clubId}/images`, { ... });
   
   // After
   await fetch(`/api/images/clubs/${clubId}/upload`, { 
     body: formDataWithType  // Must include type parameter
   });
   ```

2. **Update delete operations:**
   ```typescript
   // Before
   await fetch(`/api/admin/clubs/${clubId}/images/${imageId}`, { 
     method: "DELETE" 
   });
   
   // After
   // Remove from local state and save via /media endpoint
   const updatedGallery = gallery.filter(img => img.id !== imageId);
   await fetch(`/api/admin/clubs/${clubId}/media`, {
     method: "PATCH",
     body: JSON.stringify({ gallery: updatedGallery })
   });
   ```

## Validation

### File Validation

- **Max size:** 5MB
- **Allowed types:** JPEG, PNG, GIF, WebP, SVG
- **Naming:** Automatic sanitization and unique filename generation

### Type Validation

The `type` parameter must be one of:
- `"logo"`
- `"heroImage"`
- `"secondLogo"`
- `"gallery"`

Invalid types will return a `400 Bad Request` error.

## Error Handling

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid image type | Type parameter is missing or invalid |
| 400 | No file provided | File is missing from form data |
| 400 | Invalid file | File validation failed (size, type, etc.) |
| 403 | Forbidden | User doesn't have permission to upload |
| 404 | Club not found | Club ID is invalid |
| 415 | Unsupported file type | File type is not allowed |
| 500 | Upload failed | Server error during upload |

### Example Error Response

```json
{
  "error": "Invalid image type. Must be 'logo', 'heroImage', 'secondLogo', or 'gallery'"
}
```

## Security

### Authentication

All uploads require authentication via `requireClubAdmin`:
- Root admins can upload to any club
- Organization admins can upload to clubs in their organization
- Club owners and club admins can upload to their club

### Authorization

The endpoint checks:
1. User is authenticated
2. Club exists
3. User has permission to modify the club

### File Security

- Filename sanitization to prevent directory traversal
- File type validation
- File size limits
- Virus scanning (if configured)

## Related Documentation

- [IMAGE_HANDLING.md](../IMAGE_HANDLING.md) - General image handling architecture
- [club-update-endpoints-migration.md](./api/club-update-endpoints-migration.md) - API response format changes
- [IMAGE_URL_MIGRATION.md](../IMAGE_URL_MIGRATION.md) - Migrating from old URL format

## Summary

✅ **Single endpoint for all club image uploads:** `/api/images/clubs/[id]/upload`  
✅ **Type parameter specifies image purpose:** `logo`, `heroImage`, `secondLogo`, `gallery`  
✅ **Logo and banner auto-saved to database**  
✅ **Gallery managed via `/api/admin/clubs/[id]/media` endpoint**  
✅ **Backward compatible with existing storage structure**  
✅ **Consistent error handling and validation**
