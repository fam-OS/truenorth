/*
 Backfill Stakeholder.teamMemberId by email-first; create TeamMember stubs for unmatched.
 Usage:
   node scripts/backfill-stakeholders-teamMemberId.js
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default team to assign TeamMember stubs to
const DEFAULT_TEAM_ID = 'cmf1bwcsn0006rpucvlt8uq64';

async function main() {
  console.log('Starting backfill: Stakeholder.teamMemberId');

  // Verify default team exists
  const defaultTeam = await prisma.team.findUnique({ where: { id: DEFAULT_TEAM_ID } });
  if (!defaultTeam) {
    throw new Error(`Default team not found: ${DEFAULT_TEAM_ID}. Please create it or update DEFAULT_TEAM_ID.`);
  }

  const stakeholders = await prisma.stakeholder.findMany({ where: { teamMemberId: null } });
  console.log(`Found ${stakeholders.length} stakeholders missing teamMemberId.`);

  let linked = 0;
  let created = 0;
  for (const s of stakeholders) {
    const email = (s.email || '').trim();

    // Try match by email (case-insensitive)
    let tm = null;
    if (email && email !== '') {
      tm = await prisma.teamMember.findFirst({
        where: { email: email },
      }).catch(() => null);
    }

    if (!tm) {
      // Create a stub TeamMember in the default team
      try {
        tm = await prisma.teamMember.create({
          data: {
            name: s.name || 'Unnamed Stakeholder',
            email: email || null,
            role: s.role || null,
            teamId: DEFAULT_TEAM_ID,
            isActive: true,
          },
        });
      } catch (e) {
        // Handle unique constraint on (teamId,email)
        if (e && e.code === 'P2002') {
          tm = await prisma.teamMember.create({
            data: {
              name: s.name || 'Unnamed Stakeholder',
              email: null, // avoid duplicate email in the default team
              role: s.role || null,
              teamId: DEFAULT_TEAM_ID,
              isActive: true,
            },
          });
        } else {
          throw e;
        }
      }
      created += 1;
      console.log(`Created TeamMember stub ${tm.id} for stakeholder ${s.id}`);
    } else {
      linked += 1;
      console.log(`Matched TeamMember ${tm.id} by email for stakeholder ${s.id}`);
    }

    await prisma.stakeholder.update({
      where: { id: s.id },
      data: { teamMemberId: tm.id },
    });
  }

  console.log(`Backfill complete. Matched existing: ${linked}, created stubs: ${created}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
