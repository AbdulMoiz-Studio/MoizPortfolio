/**
 * Project Packaging Script
 * Creates a clean release ZIP bundle excluding node_modules, .git, and private .env.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_ZIP = path.join(ROOT_DIR, 'moiz-studio-portfolio-cms-release.zip');

console.log('[Packager] Preparing release bundle...');

if (fs.existsSync(OUTPUT_ZIP)) {
  fs.unlinkSync(OUTPUT_ZIP);
}

// Temporary stage folder for clean packaging
const STAGE_DIR = path.join(ROOT_DIR, '.release-stage');
if (fs.existsSync(STAGE_DIR)) {
  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGE_DIR, { recursive: true });

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.env',
  '.release-stage',
  'moiz-studio-portfolio-cms-release.zip'
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (IGNORE_PATTERNS.includes(element)) return;
    const stat = fs.statSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

console.log('[Packager] Staging clean files...');
copyFolderSync(ROOT_DIR, STAGE_DIR);

console.log('[Packager] Compressing release package...');
try {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${STAGE_DIR}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`, {
    stdio: 'inherit'
  });
  console.log(`[Packager] Successfully generated release package: ${OUTPUT_ZIP}`);
} catch (err) {
  console.error('[Packager Error]', err);
} finally {
  if (fs.existsSync(STAGE_DIR)) {
    fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  }
}
