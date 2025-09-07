#!/usr/bin/env node
/*
  Backfill TeamMember.companyAccountId by traversing Team -> Organization -> CompanyAccount.
  Only updates rows where companyAccountId is NULL.
*/

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const toBackfill = await prisma.teamMember.findMany({
      where: { companyAccountId: null },
      select: { id: true, teamId: true },
    });

    console.log(`Found ${toBackfill.length} team members to backfill.`);

    let updated = 0;
    for (const tm of toBackfill) {
      if (!tm.teamId) {
        console.warn(`Skipping ${tm.id}: no teamId (cannot infer companyAccountId).`);
        continue;
      }
      const team = await prisma.team.findUnique({
        where: { id: tm.teamId },
        select: { organizationId: true },
      });
      if (!team) {
        console.warn(`Skipping ${tm.id}: team not found (${tm.teamId}).`);
        continue;
      }
      const org = await prisma.organization.findUnique({
        where: { id: team.organizationId },
        select: { companyAccountId: true },
      });
      if (!org?.companyAccountId) {
        console.warn(`Skipping ${tm.id}: organization/companyAccount not found (${team.organizationId}).`);
        continue;
      }

      await prisma.teamMember.update({
        where: { id: tm.id },
        data: { companyAccountId: org.companyAccountId },
      });
      updated++;
    }

    console.log(`Backfill complete. Updated ${updated} team members.`);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exitCode = 1;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    await prisma.$disconnect();
  }
}

main();
