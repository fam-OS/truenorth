import { PrismaClient } from '@prisma/client';

// Extend the NodeJS namespace to include our custom global variables
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a function to initialize Prisma Client
const createPrismaClient = () => {
  console.log('Creating new Prisma Client instance');
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // Add query logging in development
  if (process.env.NODE_ENV !== 'production') {
    // Type assertion for the query event
    client.$on('query' as never, (e: any) => {
      console.log('Query: ' + e.query);
      console.log('Params: ' + e.params);
      console.log('Duration: ' + e.duration + 'ms');
    });

    // Type assertion for the error event
    client.$on('error' as never, (e: any) => {
      console.error('Prisma Error:', e);
    });
  }

  return client;
};

// Initialize prisma as a singleton to prevent too many connections
const prisma = global.prisma || createPrismaClient();

// Only assign to global in development to prevent memory leaks
if (process.env.NODE_ENV !== 'production' && !global.prisma) {
  global.prisma = prisma;
}

// Add error handling middleware
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error('Prisma Client Error:', {
      model: params.model,
      action: params.action,
      args: params.args,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
});

export { prisma };