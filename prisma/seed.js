/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Create a user first with hashed password
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: hashedPassword,
    },
  });

  // Create CompanyAccount
  const companyAccount = await prisma.companyAccount.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: 'Acme Corp',
      description: 'Demo company',
      employees: '50-100',
      headquarters: 'San Francisco, CA',
      launchedDate: 'January 2020',
      isPrivate: true,
    },
  });

  // Create Organization (Business Unit)
  const org = await prisma.organization.create({
    data: {
      name: 'E-Commerce Division',
      description: 'Online retail business unit',
      companyAccountId: companyAccount.id,
    },
  });

  // Teams
  const [teamEng, teamOps] = await Promise.all([
    prisma.team.create({ data: { name: 'Engineering', organizationId: org.id, description: 'Builds products' } }),
    prisma.team.create({ data: { name: 'Operations', organizationId: org.id, description: 'Runs the business' } }),
  ]);

  // Team Members
  const [alice, bob, carol] = await Promise.all([
    prisma.teamMember.create({ data: { name: 'Alice Anderson', email: 'alice@example.com', role: 'Engineer', teamId: teamEng.id } }),
    prisma.teamMember.create({ data: { name: 'Bob Brown', email: 'bob@example.com', role: 'Engineer', teamId: teamEng.id } }),
    prisma.teamMember.create({ data: { name: 'Carol Clark', email: 'carol@example.com', role: 'Ops Manager', teamId: teamOps.id } }),
  ]);

  // Business Unit
  const bu = await prisma.businessUnit.create({
    data: {
      name: "E-Commerce",
      description: "Web storefront BU",
      organizationId: org.id,
    },
  });

  // Stakeholders
  const [stakeExec, stakePM] = await Promise.all([
    prisma.stakeholder.create({ data: { name: 'Dana Director', email: 'dana@example.com', role: 'Executive', businessUnitId: bu.id } }),
    prisma.stakeholder.create({ data: { name: 'Evan PM', email: 'evan@example.com', role: 'Product Manager', businessUnitId: bu.id } }),
  ]);
  // Stakeholder relationships (reportsTo)
  await prisma.stakeholder.update({ where: { id: stakePM.id }, data: { reportsToId: stakeExec.id } });

  // Metrics
  await prisma.metric.create({
    data: {
      name: 'Conversion Rate',
      target: 3.5,
      current: 2.8,
      unit: '%',
      businessUnitId: bu.id,
    },
  });

  // Initiatives
  const initiative = await prisma.initiative.create({
    data: {
      name: 'Checkout Revamp',
      type: 'OPERATIONAL_EFFICIENCY',
      atRisk: false,
      status: 'IN_PROGRESS',
      summary: 'Revamp checkout to reduce friction',
      valueProposition: 'Increase conversion and revenue',
      implementationDetails: 'Phased rollout',
      releaseDate: new Date(),
      organizationId: org.id,
      ownerId: alice.id,
      businessUnitId: bu.id,
    },
  });

  // KPIs
  await prisma.kpi.create({
    data: {
      name: 'Revenue Impact',
      targetMetric: 1000000,
      actualMetric: 200000,
      forecastedRevenue: 1200000,
      actualRevenue: 250000,
      metTarget: false,
      metTargetPercent: 20.0,
      quarter: 'Q3',
      year: new Date().getFullYear(),
      organizationId: org.id,
      teamId: teamEng.id,
      initiativeId: initiative.id,
      businessUnitId: bu.id,
    },
  });

  // Ops Review and Items
  const review = await prisma.opsReview.create({
    data: {
      title: 'Q3 Ops Review',
      description: 'Quarterly operations review',
      quarter: 'Q3',
      month: 8,
      year: new Date().getFullYear(),
      teamId: teamOps.id,
      ownerId: carol.id,
    },
  });

  await prisma.opsReviewItem.create({
    data: {
      title: 'SLA Improvements',
      description: 'Improve SLA to 99.9%',
      targetMetric: 99.9,
      actualMetric: 99.2,
      quarter: 'Q3',
      year: new Date().getFullYear(),
      opsReviewId: review.id,
      teamId: teamOps.id,
      ownerId: carol.id,
    },
  });

  // Headcount Tracker
  await prisma.headcountTracker.createMany({
    data: [
      {
        teamId: teamEng.id,
        organizationId: org.id,
        year: new Date().getFullYear(),
        role: 'Software Engineer',
        level: 'L3',
        salary: 140000,
        q1Forecast: 2, q1Actual: 2,
        q2Forecast: 2, q2Actual: 1,
        q3Forecast: 3, q3Actual: 2,
        q4Forecast: 3, q4Actual: 0,
        notes: 'Hiring ramp in H2',
      },
      {
        teamId: teamOps.id,
        organizationId: org.id,
        year: new Date().getFullYear(),
        role: 'Analyst',
        level: 'Mid',
        salary: 90000,
        q1Forecast: 1, q1Actual: 1,
        q2Forecast: 1, q2Actual: 1,
        q3Forecast: 1, q3Actual: 1,
        q4Forecast: 1, q4Actual: 0,
        notes: 'Backfill expected Q4',
      },
    ],
  });

  // Costs
  await prisma.cost.createMany({
    data: [
      {
        teamId: teamEng.id,
        organizationId: org.id,
        year: new Date().getFullYear(),
        type: 'SOFTWARE',
        q1Forecast: 20000, q1Actual: 18000,
        q2Forecast: 22000, q2Actual: 21000,
        q3Forecast: 22000, q3Actual: 0,
        q4Forecast: 23000, q4Actual: 0,
        notes: 'Cloud and tooling subscriptions',
      },
      {
        teamId: teamOps.id,
        organizationId: org.id,
        year: new Date().getFullYear(),
        type: 'TRAINING',
        q1Forecast: 5000, q1Actual: 3000,
        q2Forecast: 7000, q2Actual: 1000,
        q3Forecast: 7000, q3Actual: 0,
        q4Forecast: 7000, q4Actual: 0,
        notes: 'Certifications and workshops',
      },
    ],
  });

  // Tasks & Notes
  const task = await prisma.task.create({
    data: { title: 'Kickoff Meeting', status: 'TODO', description: 'Plan project kickoff' },
  });
  await prisma.note.create({
    data: { content: 'Prepare agenda and invite stakeholders', taskId: task.id },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
