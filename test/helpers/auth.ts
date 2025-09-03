import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  companyAccountId: string;
}

export async function setupTestUser(): Promise<TestUser> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const userId = `test-user-${timestamp}-${randomId}`;
  const email = `test-${timestamp}-${randomId}@example.com`;
  
  // Clean up any existing test data first
  await cleanupTestData(userId);
  
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      id: userId,
      email: email,
      name: 'Test User'
    }
  });

  // Create company account for the user
  const companyAccount = await prisma.companyAccount.create({
    data: {
      id: `test-company-${timestamp}-${randomId}`,
      name: 'Test Company',
      userId: testUser.id,
      isPrivate: true
    }
  });

  return {
    id: testUser.id,
    email: testUser.email,
    companyAccountId: companyAccount.id
  };
}

export async function cleanupTestData(userId: string): Promise<void> {
  try {
    // Simple cleanup approach - delete by user ID directly where possible
    // This avoids complex relationship queries that may not match schema
    
    // Delete user and cascade will handle most relationships
    await prisma.user.deleteMany({ 
      where: { 
        OR: [
          { id: userId },
          { email: { contains: userId.split('-').slice(-1)[0] } } // Match by random suffix
        ]
      }
    });
    
    // Clean up any orphaned company accounts
    await prisma.companyAccount.deleteMany({ 
      where: { userId } 
    });
    
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    // Ignore cleanup errors to prevent test failures
  }
}

export async function createTestUser(
  email = 'test@example.com',
  name = 'Test User'
): Promise<TestUser> {
  return setupTestUser();
}

export function getAuthHeaders(user: TestUser) {
  return {
    Authorization: `Bearer test_token`,
    'Content-Type': 'application/json',
  };
}
