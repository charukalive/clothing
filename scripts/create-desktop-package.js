/**
 * Preflight Packaging Script: create-desktop-package.js
 * Compresses web/ into a clean staging .zip file on the Desktop,
 * calculates its SHA-256 checksum and outputs file size metrics.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ARALIYA ATELIER: DESKTOP STAGING PACKAGE GENERATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Target directory paths
const ROOT_DIR = path.join(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'web');
const DESKTOP_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\charu', 'Desktop');
const ZIP_OUTPUT = path.join(DESKTOP_DIR, 'araliya-atelier-release.zip');

if (!fs.existsSync(WEB_DIR)) {
  console.error(`Error: Web source directory not found: ${WEB_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DESKTOP_DIR)) {
  console.error(`Error: Desktop directory not found: ${DESKTOP_DIR}`);
  process.exit(1);
}

// Remove old zip if it exists
if (fs.existsSync(ZIP_OUTPUT)) {
  fs.unlinkSync(ZIP_OUTPUT);
  console.log('• Removed previous release archive from Desktop.');
}

console.log(`• Packaging web storefront, admin panel, assets & scripts from: ${WEB_DIR}`);
console.log(`• Destination: ${ZIP_OUTPUT}`);

try {
  // Use PowerShell Compress-Archive for native, dependable Windows zip compression
  const psCommand = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${WEB_DIR}\\*' -DestinationPath '${ZIP_OUTPUT}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  if (!fs.existsSync(ZIP_OUTPUT)) {
    throw new Error('Compression finished but output zip file was not found.');
  }

  // Calculate file metrics
  const stats = fs.statSync(ZIP_OUTPUT);
  const fileBuffer = fs.readFileSync(ZIP_OUTPUT);
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  console.log('\n✓ Release Archive Generated Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Archive File:    ${path.basename(ZIP_OUTPUT)}`);
  console.log(`Location:        ${ZIP_OUTPUT}`);
  console.log(`File Size:       ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);
  console.log(`SHA-256 Digest:  ${sha256}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);

} catch (err) {
  console.error('Packaging failed:', err.message);
  process.exit(1);
}
