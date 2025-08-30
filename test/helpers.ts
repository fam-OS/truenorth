import { createServer } from 'http';
import { NextApiHandler } from 'next';
import supertest from 'supertest';

export function createTestServer(handler: NextApiHandler) {
  const server = createServer(async (req, res) => {
    // Simple test server implementation without Next.js internal APIs
    try {
      await handler(req as any, res as any);
    } catch (error) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  return supertest(server);
}