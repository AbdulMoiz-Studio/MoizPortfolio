/**
 * Database Module (db.js)
 * High-reliability atomic JSON store with automatic rolling snapshots (up to 20).
 * Thread-safe read/writes with mutex lock.
 */

const fs = require('fs');
const path = require('path');
const { seed } = require('./seed');

const DATA_DIR = path.resolve(__dirname);
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Serverless fallback paths in /tmp
const TMP_DATA_DIR = path.join('/tmp', 'moiz-cms');
const TMP_DATA_FILE = path.join(TMP_DATA_DIR, 'content.json');
const TMP_BACKUPS_DIR = path.join(TMP_DATA_DIR, 'backups');

const MAX_SNAPSHOTS = 20;

let isWriting = false;
const queue = [];

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  } catch (e) {}

  // Also ensure /tmp directories if needed
  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TMP_BACKUPS_DIR)) {
      fs.mkdirSync(TMP_BACKUPS_DIR, { recursive: true });
    }
  } catch (e) {}
}

// Initial check & auto-seed if content.json does not exist
function initDB() {
  ensureDirectories();
  if (!fs.existsSync(DATA_FILE) && !fs.existsSync(TMP_DATA_FILE)) {
    try {
      console.log('[DB] content.json not found. Running seed...');
      require('./seed').seed();
    } catch (e) {
      console.warn('[DB Seed Warning]', e.message);
    }
  }
}

// Read whole content safely (supports local and serverless /tmp)
function readContent() {
  initDB();
  try {
    // 1. Check if newer updated content exists in serverless /tmp
    if (fs.existsSync(TMP_DATA_FILE)) {
      const raw = fs.readFileSync(TMP_DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
    // 2. Read bundled data file
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
    // 3. Fallback to seed content
    return require('./seed').seed();
  } catch (err) {
    console.error('[DB Read Error]', err);
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {}
    throw new Error('Failed to read database content: ' + err.message);
  }
}

// Rotate snapshots, keeping only the newest MAX_SNAPSHOTS
function rotateSnapshots(dir) {
  try {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(dir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length >= MAX_SNAPSHOTS) {
      const toDelete = files.slice(MAX_SNAPSHOTS - 1);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(path.join(dir, file.name));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('[DB Snapshot Rotation Warning]', e.message);
  }
}

// Create a snapshot backup before writing
function createSnapshot(sourceFile, targetDir) {
  try {
    if (!fs.existsSync(sourceFile)) return null;
    rotateSnapshots(targetDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = path.join(targetDir, `snapshot-${timestamp}.json`);
    fs.copyFileSync(sourceFile, snapshotFile);
    return `snapshot-${timestamp}.json`;
  } catch (err) {
    console.warn('[DB Snapshot Warning]', err.message);
    return null;
  }
}

// Atomic file write with automatic fallback to /tmp on serverless environments
function atomicWrite(data) {
  return new Promise((resolve, reject) => {
    const execute = () => {
      isWriting = true;
      try {
        ensureDirectories();
        const jsonStr = JSON.stringify(data, null, 2);

        // Try primary storage first (works on VPS, local, and writable disks)
        let written = false;
        try {
          createSnapshot(DATA_FILE, BACKUPS_DIR);
          const tempFile = path.join(DATA_DIR, `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.json`);
          fs.writeFileSync(tempFile, jsonStr, 'utf8');
          fs.renameSync(tempFile, DATA_FILE);
          written = true;
        } catch (localWriteErr) {
          // If filesystem is read-only (e.g. Vercel serverless), write to /tmp
          if (localWriteErr.code === 'EROFS' || localWriteErr.code === 'EACCES' || process.env.VERCEL) {
            try {
              if (!fs.existsSync(TMP_DATA_DIR)) {
                fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
              }
              createSnapshot(TMP_DATA_FILE, TMP_BACKUPS_DIR);
              const tmpTemp = path.join(TMP_DATA_DIR, `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.json`);
              fs.writeFileSync(tmpTemp, jsonStr, 'utf8');
              fs.renameSync(tmpTemp, TMP_DATA_FILE);
              written = true;
            } catch (tmpErr) {
              throw tmpErr;
            }
          } else {
            throw localWriteErr;
          }
        }

        isWriting = false;
        resolve(data);
      } catch (err) {
        isWriting = false;
        reject(err);
      } finally {
        if (queue.length > 0) {
          const next = queue.shift();
          next();
        }
      }
    };

    if (isWriting) {
      queue.push(execute);
    } else {
      execute();
    }
  });
}

// High-level API
async function saveContent(newData) {
  return atomicWrite(newData);
}

// Restore a snapshot by filename (checks both primary and /tmp backup folders)
async function restoreBackup(snapshotName) {
  const safeName = path.basename(snapshotName);
  let targetFile = path.join(BACKUPS_DIR, safeName);
  if (!fs.existsSync(targetFile)) {
    targetFile = path.join(TMP_BACKUPS_DIR, safeName);
  }
  if (!fs.existsSync(targetFile)) {
    throw new Error('Snapshot file not found: ' + safeName);
  }
  const content = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  await atomicWrite(content);
  return content;
}

// List all snapshots with metadata from primary and /tmp directories
function listBackups() {
  ensureDirectories();
  const allFiles = [];

  const scanDir = (dir) => {
    try {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'));
      for (const f of files) {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);
        allFiles.push({
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          timeAgo: Math.round((Date.now() - stats.mtime.getTime()) / 1000)
        });
      }
    } catch (e) {}
  };

  scanDir(BACKUPS_DIR);
  scanDir(TMP_BACKUPS_DIR);

  return allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  readContent,
  saveContent,
  restoreBackup,
  listBackups,
  createSnapshot
};
