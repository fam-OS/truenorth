import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create a single mock instance and ensure the prisma import in API code uses it
export const prismaMock = mockDeep<PrismaClient>();

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});

// Silence noisy console output during tests. Toggle via TEST_DEBUG=1 to see logs.
const shouldLog = !!process.env.TEST_DEBUG;
const noop = () => {};

beforeAll(() => {
  if (!shouldLog) {
    jest.spyOn(console, 'error').mockImplementation(noop as any);
    jest.spyOn(console, 'warn').mockImplementation(noop as any);
    jest.spyOn(console, 'log').mockImplementation(noop as any);
  }
});