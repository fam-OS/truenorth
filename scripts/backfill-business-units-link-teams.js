#!/usr/bin/env node
/*
  Backfill script: Link orphan BusinessUnits to an Organization via a Team

  What it does:
  - Finds BusinessUnits that have no Teams linked (prisma.BusinessUnit.Team is empty)
  - For each orphan BU, creates a Team under a chosen Organization and sets businessUnitId
  - Organization selection strategy:
      1) If there is exactly one Organization, use it.
      2) Otherwise, use the most recently created Organization.
  - Safe by default (dry-run). Pass `--execute` to apply changes.

  Usage:
    node scripts/backfill-business-units-link-teams.js           # dry run
    node scripts/backfill-business-units-link-teams.js --execute # perform writes

  Prerequisites:
  - Ensure DATABASE_URL is set (e.g., `set -a; source .env; set +a`)
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  console.log(`\n[Backfill] Linking orphan BusinessUnits to Organizations via Teams`);
  console.log(`[Backfill] Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}`);

  // Load candidate orgs
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  if (orgs.length === 0) {
    console.log('[Backfill] No Organizations found. Nothing to do.');
    return;
  }

  // Find BusinessUnits with zero Teams
  const businessUnits = await prisma.businessUnit.findMany({
    select: { id: true, name: true, Team: { select: { id: true }, take: 1 } },
    orderBy: { createdAt: 'asc' },
  });
  const orphans = businessUnits.filter((bu) => (bu.Team || []).length === 0);

  console.log(`[Backfill] Organizations available: ${orgs.length}`);
  console.log(`[Backfill] BusinessUnits total: ${businessUnits.length}`);
  console.log(`[Backfill] Orphan BusinessUnits (no Teams): ${orphans.length}`);

  if (orphans.length === 0) {
    console.log('[Backfill] Nothing to backfill. Exiting.');
    return;
  }

  const chosenOrg = orgs.length === 1 ? orgs[0] : orgs[0]; // most recent as default
  console.log(`[Backfill] Chosen Organization: ${chosenOrg.id} (${chosenOrg.name || 'Unnamed'})`);

  let createdTeams = 0;
  for (const bu of orphans) {
    const teamName = `${bu.name} Team`;
    console.log(` - BU ${bu.id} (${bu.name}) -> will create Team "${teamName}" under Org ${chosenOrg.id}`);
    if (!execute) continue;
    try {
      await prisma.team.create({
        data: {
          name: teamName,
          description: `Auto-created by backfill for BusinessUnit ${bu.id}`,
          organizationId: chosenOrg.id,
          businessUnitId: bu.id,
        },
      });
      createdTeams += 1;
    } catch (e) {
      console.warn(`   ! Failed creating team for BU ${bu.id}:`, e?.message || e);
    }
  }

  if (execute) {
    console.log(`\n[Backfill] Completed. Teams created: ${createdTeams}/${orphans.length}`);
  } else {
    console.log(`\n[Backfill] DRY-RUN complete. Would create ${orphans.length} team(s). Re-run with --execute to apply.`);
  }
}

main()
  .catch((e) => {
    console.error('[Backfill] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
