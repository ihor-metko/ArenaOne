# Image Upload Configuration

## Overview

This document describes the image upload and storage configuration for ArenaOne. All uploaded images are stored on the server's volume storage (both in development and production), ensuring consistent behavior across environments.

## Environment Variables

### Required Variables

#### `IMAGE_UPLOAD_PATH`
- **Description**: The absolute path on the server where uploaded images will be stored
- **Required**: Yes
- **Example (Development)**: `/app/storage/images`
- **Example (Production)**: `/app/storage/images`
- **Note**: This path should point to a persistent volume in your Docker setup

#### `NEXT_PUBLIC_ASSETS_BASE_URL`
- **Description**: The base URL used to construct absolute URLs for uploaded assets. This is used by the frontend to display images correctly.
- **Required**: Optional (defaults to empty string for relative URLs)
- **Example (Development)**: `http://localhost:3000` or empty
- **Example (Production)**: `https://yourdomain.com`
- **Note**: Include the protocol (http/https) but no trailing slash

## Storage Structure

Images are stored using the following directory structure:

```
{IMAGE_UPLOAD_PATH}/
├── organizations/
│   └── {organizationId}/
│       ├── {timestamp}-{random}.jpg
│       └── {timestamp}-{random}.png
├── clubs/
│   └── {clubId}/
│       ├── {timestamp}-{random}.jpg
│       └── {timestamp}-{random}.png
├── users/
│   └── {userId}/
│       └── {timestamp}-{random}.jpg
└── bookings/
    └── {bookingId}/
        └── {timestamp}-{random}.jpg
```

## URL Generation

When an image is uploaded, the API returns an absolute URL constructed as:

```
{NEXT_PUBLIC_ASSETS_BASE_URL}/api/images/{entity}/{entityId}/{filename}
```

For example:
- Development: `http://localhost:3000/api/images/organizations/abc-123/1234567890-abc123.jpg`
- Production: `https://yourdomain.com/api/images/clubs/def-456/1234567890-def456.png`

If `NEXT_PUBLIC_ASSETS_BASE_URL` is not set, relative URLs are generated:
- `/api/images/organizations/abc-123/1234567890-abc123.jpg`

## File Validation

The upload system validates:

1. **File Type**: Only these MIME types are allowed:
   - `image/jpeg`
   - `image/jpg`
   - `image/png`
   - `image/gif`
   - `image/webp`
   - `image/svg+xml`

2. **File Size**: Maximum 5MB per file

3. **File Content**: Must not be empty

## Supported Entities

Images can be uploaded for the following entity types:

- `organizations` - Organization logos and hero images
- `clubs` - Club logos and hero images
- `users` - User avatars
- `bookings` - Booking-related images

## API Endpoints

### Upload Endpoints

- `POST /api/images/organizations/{id}/upload`
- `POST /api/images/clubs/{id}/upload`
- `POST /api/images/users/{id}/upload`
- `POST /api/images/bookings/{id}/upload`

### Serving Endpoint

- `GET /api/images/{entity}/{entityId}/{filename}` - Serves the uploaded image

## Security Features

1. **Entity Validation**: Only allowed entity types can be accessed
2. **UUID Validation**: Entity IDs must be valid UUIDs
3. **Filename Sanitization**: Prevents directory traversal attacks
4. **Path Verification**: Ensures files are served only from the designated storage directory
5. **Authorization**: Upload endpoints check user permissions

## Docker Setup

Ensure your `docker-compose.yml` includes a volume mount for image storage:

```yaml
services:
  app:
    volumes:
      - ./storage/images:/app/storage/images
    environment:
      - IMAGE_UPLOAD_PATH=/app/storage/images
      - NEXT_PUBLIC_ASSETS_BASE_URL=http://localhost:3000
```

For production, use a persistent volume:

```yaml
services:
  app:
    volumes:
      - image_storage:/app/storage/images
    environment:
      - IMAGE_UPLOAD_PATH=/app/storage/images
      - NEXT_PUBLIC_ASSETS_BASE_URL=https://yourdomain.com

volumes:
  image_storage:
```

## Migration Notes

### Previous Implementation

Previously, the system used separate environment variables:
- `IMAGE_UPLOAD_PATH_DEV` - for development
- `IMAGE_UPLOAD_PATH_PROD` - for production

### Current Implementation

Now uses a single `IMAGE_UPLOAD_PATH` variable for both environments, ensuring consistent behavior.

### URL Generation Changes

Previously, URLs were generated as relative paths:
```
/api/images/{entity}/{entityId}/{filename}
```

Now, if `NEXT_PUBLIC_ASSETS_BASE_URL` is set, absolute URLs are generated:
```
{NEXT_PUBLIC_ASSETS_BASE_URL}/api/images/{entity}/{entityId}/{filename}
```

This allows proper image loading across different deployment scenarios (CDN, subdomains, etc.).

## Testing

The test suite validates:
- Entity type validation
- Entity ID (UUID) validation  
- Filename sanitization and security
- File serving with correct MIME types
- Cache headers for optimal performance
- Error handling

Run tests with:
```bash
npm test
```

## Troubleshooting

### Images not uploading
- Check that `IMAGE_UPLOAD_PATH` is set and points to a writable directory
- Verify the directory exists and has correct permissions
- Check Docker volume mounts in `docker-compose.yml`

### Images not displaying
- Verify `NEXT_PUBLIC_ASSETS_BASE_URL` is set correctly for your environment
- Check browser console for CORS or network errors
- Ensure the serving endpoint `/api/images/...` is accessible

### Permission errors
- Ensure the application has write permissions to `IMAGE_UPLOAD_PATH`
- In Docker, check volume mount permissions
