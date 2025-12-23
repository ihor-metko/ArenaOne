# Image Upload System

This document describes the server-side image upload system implemented for ArenaOne.

## Overview

The image upload system has been migrated from Supabase Storage to local filesystem storage using Docker volumes. This ensures:
- Images persist across Docker container restarts
- No external dependencies on Supabase
- Complete control over file storage and security

## Architecture

### Storage Location

Images are stored in `/app/storage/images/` which is mounted as a Docker volume (`arenaone_storage`) in the container.

### Components

1. **Upload Utility** (`src/lib/imageUpload.ts`)
   - File validation (type, size)
   - UUID-based filename generation
   - File saving to disk
   - MIME type detection

2. **Upload Endpoints**
   - `POST /api/images/organizations/[id]/upload` - Organization images
   - `POST /api/images/clubs/[id]/upload` - Club images
   - `POST /api/images/courts/[id]/upload` - Court images
   - `POST /api/images/users/[id]/upload` - User profile images

3. **Serving Endpoint**
   - `GET /api/images/[filename]` - Serves uploaded images with proper headers

## Upload Endpoints

### Organizations

**Endpoint:** `POST /api/images/organizations/[id]/upload`

**Authorization:** Organization admin or root admin

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
type: "logo" | "heroImage"
```

**Response:**
```json
{
  "success": true,
  "url": "/api/images/abc123.jpg",
  "filename": "abc123.jpg",
  "type": "logo"
}
```

### Clubs

**Endpoint:** `POST /api/images/clubs/[id]/upload`

**Authorization:** Club admin, club owner, organization admin (if club belongs to org), or root admin

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
type: "logo" | "heroImage"
```

**Response:**
```json
{
  "success": true,
  "url": "/api/images/abc123.jpg",
  "filename": "abc123.jpg",
  "type": "logo"
}
```

### Courts

**Endpoint:** `POST /api/images/courts/[id]/upload`

**Authorization:** Club admin, club owner, organization admin (if club belongs to org), or root admin

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
```

**Response:**
```json
{
  "success": true,
  "url": "/api/images/abc123.jpg",
  "filename": "abc123.jpg"
}
```

### Users

**Endpoint:** `POST /api/images/users/[id]/upload`

**Authorization:** User can only upload their own profile image, unless they are root admin

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
```

**Response:**
```json
{
  "success": true,
  "url": "/api/images/abc123.jpg",
  "filename": "abc123.jpg"
}
```

## Validation

All uploads are validated for:
- **File type:** Only `image/jpeg`, `image/jpg`, `image/png`, and `image/webp` are allowed
- **File size:** Maximum 10 MB (configurable)
- **Security:** Filenames use UUIDs to prevent directory traversal and conflicts

## Image Serving

**Endpoint:** `GET /api/images/[filename]`

**Headers:**
- `Content-Type`: Appropriate MIME type based on file extension
- `Cache-Control`: `public, max-age=31536000, immutable`

**Response:**
- 200 OK with image data
- 404 Not Found if image doesn't exist
- 400 Bad Request if filename is invalid

## Database Integration

After a successful upload, the corresponding database record is automatically updated:
- Organizations: `logo` or `heroImage` field
- Clubs: `logo` or `heroImage` field
- Courts: `imageUrl` field
- Users: `image` field

The stored value is the URL path (e.g., `/api/images/abc123.jpg`), not the filesystem path.

## Frontend Integration

Frontend components have been updated to use the new endpoints:
- `OrganizationCreationStepper` - uses `/api/images/organizations/[id]/upload`
- Organization detail page - uses `/api/images/organizations/[id]/upload`
- `ClubGalleryView` - uses `/api/images/clubs/[id]/upload` for hero/logo

## Docker Volume

The Docker volume `arenaone_storage` is defined in `docker-compose.yml`:

```yaml
volumes:
  - arenaone_storage:/app/storage
```

This ensures images persist across container restarts and updates.

## Security Considerations

1. **Authorization:** All endpoints verify user permissions before allowing uploads
2. **File validation:** Only allowed image types are accepted
3. **Filename sanitization:** UUIDs prevent directory traversal attacks
4. **Size limits:** Files are limited to prevent storage abuse
5. **MIME type checking:** Server-side verification of file content type

## Future Enhancements

Potential improvements for the image upload system:
- Image optimization/resizing on upload
- Thumbnail generation
- Support for additional image formats (SVG with sanitization)
- Image CDN integration
- Automatic cleanup of unused images
- Image compression to reduce storage
