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
const MAX_SNAPSHOTS = 20;

let isWriting = false;
const queue = [];

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

// Initial check & auto-seed if content.json does not exist
function initDB() {
  ensureDirectories();
  if (!fs.existsSync(DATA_FILE)) {
    console.log('[DB] content.json not found. Running seed...');
    require('./seed').seed();
  }
}

// Read whole content safely
function readContent() {
  initDB();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB Read Error]', err);
    throw new Error('Failed to read database content: ' + err.message);
  }
}

// Rotate snapshots, keeping only the newest MAX_SNAPSHOTS
function rotateSnapshots() {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length >= MAX_SNAPSHOTS) {
      const toDelete = files.slice(MAX_SNAPSHOTS - 1);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, file.name));
        } catch (e) {
          // ignore unlink error
        }
      }
    }
  } catch (e) {
    console.error('[DB Snapshot Rotation Error]', e);
  }
}

// Create a snapshot backup before writing
function createSnapshot() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    rotateSnapshots();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = path.join(BACKUPS_DIR, `snapshot-${timestamp}.json`);
    fs.copyFileSync(DATA_FILE, snapshotFile);
    return `snapshot-${timestamp}.json`;
  } catch (err) {
    console.error('[DB Snapshot Error]', err);
    return null;
  }
}

// Atomic file write using temporary file + rename
function atomicWrite(data) {
  return new Promise((resolve, reject) => {
    const execute = () => {
      isWriting = true;
      try {
        ensureDirectories();
        createSnapshot();

        const tempFile = path.join(DATA_DIR, `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.json`);
        const jsonStr = JSON.stringify(data, null, 2);
        
        fs.writeFileSync(tempFile, jsonStr, 'utf8');
        fs.renameSync(tempFile, DATA_FILE);

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

// Restore a snapshot by filename
async function restoreBackup(snapshotName) {
  const safeName = path.basename(snapshotName);
  const targetFile = path.join(BACKUPS_DIR, safeName);
  if (!fs.existsSync(targetFile)) {
    throw new Error('Snapshot file not found: ' + safeName);
  }
  const content = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  await atomicWrite(content);
  return content;
}

// List all snapshots with metadata
function listBackups() {
  ensureDirectories();
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          timeAgo: Math.round((Date.now() - stats.mtime.getTime()) / 1000)
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return files;
  } catch (err) {
    console.error('[DB List Backups Error]', err);
    return [];
  }
}

module.exports = {
  readContent,
  saveContent,
  restoreBackup,
  listBackups,
  createSnapshot
};
