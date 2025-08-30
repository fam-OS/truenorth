const fs = require('fs');
const path = require('path');

// Create missing client reference manifest file for dashboard page
const manifestPath = path.join(__dirname, '../.next/server/app/(dashboard)/page_client-reference-manifest.js');
const manifestDir = path.dirname(manifestPath);

// Ensure directory exists
if (!fs.existsSync(manifestDir)) {
  fs.mkdirSync(manifestDir, { recursive: true });
}

// Create empty manifest file
const manifestContent = `module.exports = {};`;

fs.writeFileSync(manifestPath, manifestContent);
console.log('✓ Created missing client reference manifest file');
