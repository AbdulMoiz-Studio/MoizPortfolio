/**
 * Media & Image Processing Manager (media.js)
 * Implements:
 * - Multer file upload validation (MIME, extension, size)
 * - Sharp WebP conversion and responsive optimization
 * - In-place image replacement (keeps URL slot intact)
 * - Dimension extraction and Media Library registry management
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const db = require('../data/db');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const TMP_UPLOADS_DIR = path.join('/tmp', 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {}
try {
  if (!fs.existsSync(TMP_UPLOADS_DIR)) {
    fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
  }
} catch (e) {}

// Memory storage for immediate Sharp processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, and SVG images are permitted.'), false);
  }
};

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter
});

/**
 * Process uploaded buffer and save to /uploads
 */
async function processAndSaveImage(buffer, originalName, mimetype, customSlot = '') {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const timestamp = Date.now();

  let finalFilename = '';
  let finalUrl = '';
  let width = 0;
  let height = 0;
  let format = '';

  let activeUploadsDir = UPLOADS_DIR;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    activeUploadsDir = TMP_UPLOADS_DIR;
    try {
      if (!fs.existsSync(TMP_UPLOADS_DIR)) {
        fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
      }
    } catch (e) {}
  }

  if (mimetype === 'image/svg+xml') {
    finalFilename = `${baseName}-${timestamp}.svg`;
    const targetPath = path.join(activeUploadsDir, finalFilename);
    try {
      fs.writeFileSync(targetPath, buffer);
    } catch (e) {
      const tmpPath = path.join(TMP_UPLOADS_DIR, finalFilename);
      fs.writeFileSync(tmpPath, buffer);
    }
    finalUrl = `/uploads/${finalFilename}`;
    format = 'svg';
  } else {
    // Convert to optimized WebP
    finalFilename = `${baseName}-${timestamp}.webp`;
    let targetPath = path.join(activeUploadsDir, finalFilename);

    const image = sharp(buffer);
    const metadata = await image.metadata();
    width = metadata.width || 0;
    height = metadata.height || 0;

    try {
      await image.webp({ quality: 85 }).toFile(targetPath);
    } catch (writeErr) {
      targetPath = path.join(TMP_UPLOADS_DIR, finalFilename);
      await sharp(buffer).webp({ quality: 85 }).toFile(targetPath);
    }

    finalUrl = `/uploads/${finalFilename}`;
    format = 'webp';
  }

  // Register in Media Library in DB
  const content = db.readContent();
  const mediaItem = {
    id: 'media-' + Math.random().toString(36).substring(2, 9),
    url: finalUrl,
    title: originalName,
    alt: originalName,
    slot: customSlot || 'Media Library',
    format,
    width,
    height,
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString()
  };

  content.media.unshift(mediaItem);
  await db.saveContent(content);

  return mediaItem;
}

/**
 * Replace an existing file in place so all references update instantly
 */
async function replaceExistingImage(existingUrl, buffer, mimetype) {
  let relativePath = existingUrl.replace(/^\//, '');
  const targetPath = path.resolve(__dirname, '..', relativePath);

  if (fs.existsSync(targetPath)) {
    try {
      if (targetPath.endsWith('.svg') || mimetype === 'image/svg+xml') {
        fs.writeFileSync(targetPath, buffer);
      } else {
        await sharp(buffer).toFile(targetPath);
      }
    } catch (e) {
      console.warn('[Media Replace Warning]', e.message);
    }
  } else {
    // If not on disk, save to uploads
    return processAndSaveImage(buffer, path.basename(existingUrl), mimetype);
  }

  return { url: existingUrl, replaced: true };
}

module.exports = {
  uploadMiddleware,
  processAndSaveImage,
  replaceExistingImage,
  UPLOADS_DIR
};
