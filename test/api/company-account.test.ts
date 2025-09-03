import { prismaMock } from '../setup';
import { GET as GET_COMPANY_ACCOUNTS, POST as POST_COMPANY_ACCOUNT } from '@/app/api/company-account/route';
import { GET as GET_COMPANY_ACCOUNT, PUT as PUT_COMPANY_ACCOUNT, DELETE as DELETE_COMPANY_ACCOUNT } from '@/app/api/company-account/[companyAccountId]/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockSession = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

describe('Company Account API', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/company-account', () => {
    it('returns company account for authenticated user', async () => {
      const mockCompanyAccount = {
        id: 'company_123',
        userId: 'user_123',
        name: 'Test Company',
        description: 'Test Description',
        founderId: null,
        employees: '10-50',
        headquarters: 'San Francisco',
        launchedDate: '2023-01-01',
        isPrivate: true,
        tradedAs: null,
        corporateIntranet: '',
        glassdoorLink: '',
        linkedinLink: '',
        founder: null,
        organizations: [],
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(mockCompanyAccount);

      const res = await GET_COMPANY_ACCOUNTS();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe('Test Company');
      expect(data.userId).toBe('user_123');
    });

    it('returns 404 when no company account exists', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const res = await GET_COMPANY_ACCOUNTS();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });

    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET_COMPANY_ACCOUNTS();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/company-account', () => {
    it('creates a new company account', async () => {
      const newCompanyData = {
        name: 'New Company',
        description: 'New Company Description',
        founderId: '',
        employees: '1-10',
        headquarters: 'New York',
        launchedDate: '2024-01-01',
        isPrivate: true,
        tradedAs: '',
        corporateIntranet: '',
        glassdoorLink: '',
        linkedinLink: '',
      };

      const createdCompany = {
        id: 'company_456',
        userId: 'user_123',
        ...newCompanyData,
        founderId: null,
        founder: null,
        organizations: [],
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null); // No existing account
      (prismaMock as any).companyAccount.create.mockResolvedValue(createdCompany);

      const req = new Request('http://localhost/api/company-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanyData),
      });

      const res = await POST_COMPANY_ACCOUNT(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.name).toBe('New Company');
      expect(data.userId).toBe('user_123');
    });

    it('creates company account with founder relationship', async () => {
      const newCompanyData = {
        name: 'New Company',
        description: 'New Company Description',
        founderId: 'founder_123',
        employees: '1-10',
        headquarters: 'New York',
        launchedDate: '2024-01-01',
        isPrivate: true,
        tradedAs: '',
        corporateIntranet: '',
        glassdoorLink: '',
        linkedinLink: '',
      };

      const createdCompany = {
        id: 'company_456',
        userId: 'user_123',
        ...newCompanyData,
        founder: { id: 'founder_123', name: 'John Doe' },
        organizations: [],
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);
      (prismaMock as any).companyAccount.create.mockResolvedValue(createdCompany);

      const req = new Request('http://localhost/api/company-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanyData),
      });

      const res = await POST_COMPANY_ACCOUNT(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.founder.name).toBe('John Doe');
    });

    it('returns 400 when user already has a company account', async () => {
      const existingAccount = { id: 'company_123', userId: 'user_123' };
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(existingAccount);

      const req = new Request('http://localhost/api/company-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Company' }),
      });

      const res = await POST_COMPANY_ACCOUNT(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('User already has a company account');
    });

    it('validates required fields', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const req = new Request('http://localhost/api/company-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing required name field
      });

      const res = await POST_COMPANY_ACCOUNT(req as any);
      
      expect(res.status).toBe(400);
    });

    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new Request('http://localhost/api/company-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Company' }),
      });

      const res = await POST_COMPANY_ACCOUNT(req as any);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/company-account/:id', () => {
    it('returns specific company account', async () => {
      const mockCompanyAccount = {
        id: 'company_123',
        userId: 'user_123',
        name: 'Test Company',
        description: 'Test Description',
        founder: null,
        organizations: [],
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(mockCompanyAccount);

      const res = await GET_COMPANY_ACCOUNT({} as Request, { params: { companyAccountId: 'company_123' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe('Test Company');
    });

    it('returns 404 for non-existent company account', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const res = await GET_COMPANY_ACCOUNT({} as Request, { params: { companyAccountId: 'missing' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });

    it('returns 404 when user tries to access another user\'s account', async () => {
      // findFirst with user ownership check returns null for other user's account
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const res = await GET_COMPANY_ACCOUNT({} as Request, { params: { companyAccountId: 'company_123' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });
  });

  describe('PUT /api/company-account/:id', () => {
    it('updates company account', async () => {
      const existingAccount = {
        id: 'company_123',
        userId: 'user_123',
        name: 'Old Company',
      };

      const updatedAccount = {
        id: 'company_123',
        userId: 'user_123',
        name: 'Updated Company',
        description: 'Updated Description',
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(existingAccount);
      (prismaMock as any).companyAccount.update.mockResolvedValue(updatedAccount);

      const req = new Request('http://localhost/api/company-account/company_123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Company', description: 'Updated Description' }),
      });

      const res = await PUT_COMPANY_ACCOUNT(req as any, { params: { companyAccountId: 'company_123' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Company');
    });

    it('returns 404 when updating non-existent account', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const req = new Request('http://localhost/api/company-account/missing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Company' }),
      });

      const res = await PUT_COMPANY_ACCOUNT(req as any, { params: { companyAccountId: 'missing' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });
  });

  describe('DELETE /api/company-account/:id', () => {
    it('deletes company account', async () => {
      const existingAccount = {
        id: 'company_123',
        userId: 'user_123',
        name: 'Test Company',
      };

      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(existingAccount);
      (prismaMock as any).companyAccount.delete.mockResolvedValue(existingAccount);

      const req = new Request('http://localhost/api/company-account/company_123', { method: 'DELETE' });
      const res = await DELETE_COMPANY_ACCOUNT(req as any, { params: { companyAccountId: 'company_123' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ message: 'Company account deleted successfully' });
    });

    it('returns 404 when deleting non-existent account', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const req = new Request('http://localhost/api/company-account/missing', { method: 'DELETE' });
      const res = await DELETE_COMPANY_ACCOUNT(req as any, { params: { companyAccountId: 'missing' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });

    it('returns 404 when user tries to delete another user\'s account', async () => {
      // findFirst with user ownership check returns null for other user's account
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue(null);

      const req = new Request('http://localhost/api/company-account/company_123', { method: 'DELETE' });
      const res = await DELETE_COMPANY_ACCOUNT(req as any, { params: { companyAccountId: 'company_123' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Company account not found');
    });
  });
});
