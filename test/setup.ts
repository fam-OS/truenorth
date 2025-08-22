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