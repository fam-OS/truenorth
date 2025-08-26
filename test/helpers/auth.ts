import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

export async function createTestUser(
  email = 'test@example.com',
  name = 'Test User'
): Promise<TestUser> {
  // In a real test environment, you would use your auth system to create a test user
  // For now, we'll return a mock user
  return {
    id: 'user_123',
    email,
    token: 'test_token_123',
  };
}

export function getAuthHeaders(user: TestUser) {
  return {
    Authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
}
