const fs = require('fs');
const path = require('path');

// Robust workaround for Next.js "clientReferenceManifest" bug in some deployments.
// After build, traverse .next/server/app and place an empty
// "page_client-reference-manifest.js" next to every page.js if missing.

const APP_DIR = path.join(__dirname, '../.next/server/app');
const MANIFEST_NAME = 'page_client-reference-manifest.js';
const CONTENT = 'module.exports = {}\n';

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, acc);
    } else if (e.isFile() && e.name === 'page.js') {
      acc.push(full);
    }
  }
  return acc;
}

try {
  const pages = walk(APP_DIR);
  let created = 0;
  for (const pageJs of pages) {
    const dir = path.dirname(pageJs);
    const manifestPath = path.join(dir, MANIFEST_NAME);
    if (!fs.existsSync(manifestPath)) {
      fs.writeFileSync(manifestPath, CONTENT);
      created++;
    }
  }
  console.log(`✓ Ensured client reference manifests (created ${created})`);
} catch (e) {
  console.warn('[fix-manifest] Failed to create client reference manifests:', e);
}
