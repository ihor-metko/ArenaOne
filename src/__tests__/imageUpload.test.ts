/**
 * @jest-environment node
 */
import { validateImageFile, generateUniqueFilename, getMimeTypeFromFilename } from '@/lib/imageUpload';

describe('imageUpload utilities', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file exceeding max size', () => {
      // Create a file larger than 10MB
      const largeContent = new ArrayBuffer(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should accept file under max size', () => {
      // Create a file smaller than 10MB
      const smallContent = new ArrayBuffer(5 * 1024 * 1024);
      const file = new File([smallContent], 'small.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate filename with jpg extension for image/jpeg', () => {
      const filename = generateUniqueFilename('image/jpeg');
      expect(filename).toMatch(/^[a-f0-9-]+\.jpg$/);
    });

    it('should generate filename with png extension for image/png', () => {
      const filename = generateUniqueFilename('image/png');
      expect(filename).toMatch(/^[a-f0-9-]+\.png$/);
    });

    it('should generate filename with webp extension for image/webp', () => {
      const filename = generateUniqueFilename('image/webp');
      expect(filename).toMatch(/^[a-f0-9-]+\.webp$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = generateUniqueFilename('image/jpeg');
      const filename2 = generateUniqueFilename('image/jpeg');
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('getMimeTypeFromFilename', () => {
    it('should return image/jpeg for .jpg extension', () => {
      expect(getMimeTypeFromFilename('test.jpg')).toBe('image/jpeg');
    });

    it('should return image/jpeg for .jpeg extension', () => {
      expect(getMimeTypeFromFilename('test.jpeg')).toBe('image/jpeg');
    });

    it('should return image/png for .png extension', () => {
      expect(getMimeTypeFromFilename('test.png')).toBe('image/png');
    });

    it('should return image/webp for .webp extension', () => {
      expect(getMimeTypeFromFilename('test.webp')).toBe('image/webp');
    });

    it('should return application/octet-stream for unknown extension', () => {
      expect(getMimeTypeFromFilename('test.txt')).toBe('application/octet-stream');
    });

    it('should handle case-insensitive extensions', () => {
      expect(getMimeTypeFromFilename('test.JPG')).toBe('image/jpeg');
      expect(getMimeTypeFromFilename('test.PNG')).toBe('image/png');
    });
  });
});
