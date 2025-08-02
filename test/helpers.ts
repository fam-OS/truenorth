import { createServer } from 'http';
import { NextApiHandler } from 'next';
import { apiResolver } from 'next/dist/server/api-utils/node';
import supertest from 'supertest';

export function createTestServer(handler: NextApiHandler) {
  const server = createServer((req, res) =>
    apiResolver(req, res, undefined, handler, {
      previewModeId: '',
      previewModeEncryptionKey: '',
      previewModeSigningKey: '',
    })
  );
  return supertest(server);
}