# Contributing Guide

Thank you for your interest in improving TrueNorth! This guide explains how to set up your environment, run the app and tests, follow code style conventions, and submit high‑quality pull requests. The second half documents our API route patterns and conventions.

We welcome issues, discussions, and PRs of all sizes — from documentation fixes to new features.

## Quick Start for Contributors

1. Fork the repository and clone your fork
   ```bash
   git clone https://github.com/<your-username>/truenorth.git
   cd truenorth
   git remote add upstream https://github.com/fam-OS/truenorth.git
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   # Edit .env and set at least DATABASE_URL
   ```

   - Local Postgres example: `postgresql://username:password@localhost:5432/truenorth`
   - Neon example (managed): add `?sslmode=require&channel_binding=require`

4. Database setup
   ```bash
   npx prisma migrate dev   # for local dev
   npm run seed             # optional: load demo data
   ```

5. Start the dev server
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

Optional auth for full experience (NextAuth): set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and optionally Google OAuth envs. See README Authentication section.

## Project Scripts

- `npm run dev` — start Next.js with Turbopack
- `npm run build` — generate Prisma client, build Next.js, fix manifest
- `npm start` — start production server
- `npm test` — run Jest tests
- `npm run test:watch` — watch mode for Jest
- `npm run test:ui` — run Playwright E2E tests (headless)
- `npm run test:ui:headed` — run Playwright in headed mode
- `npm run seed` — seed demo data

## Code Style & Linting

- TypeScript required (`^5`).
- Run `npm run lint` and ensure no errors before committing.
- Prefer small, focused changes with clear intent and tests.
- Keep imports organized; avoid adding imports in the middle of files.

## Testing

Unit/integration tests use Jest (Node env). E2E tests use Playwright.

```bash
npm test             # run Jest tests
npm run test:ui      # run Playwright tests
npm run test:ui:headed
```

## Database & Prisma

- Dev: `npx prisma migrate dev` to apply migrations and regenerate client.
- CI/Prod: `npx prisma migrate deploy`.
- Create new migrations with `npx prisma migrate dev --name <migration_name>`.
- Seed: `npm run seed`.

## Git Workflow

- Create feature branches from `main`: `feat/<short-name>` or `fix/<short-name>`.
- Keep PRs small and focused when possible; larger changes are fine if well‑scoped and reviewed incrementally.
- Reference related issues in your PR description (e.g., `Closes #123`).

## Pull Request Checklist

- [ ] Code builds locally (`npm run build`) and passes tests (`npm test`).
- [ ] Lint passes (`npm run lint`).
- [ ] Added/updated tests where relevant.
- [ ] Updated docs/README if behavior or setup changes.
- [ ] Consider accessibility and error handling.

---

## Principles

- Be explicit and typed. Use Zod schemas to validate inputs at the edge.
- Return consistent JSON shapes and HTTP status codes.
- Keep Prisma access centralized via the singleton client.
- Prefer small, composable route handlers with clear includes/selects.

## Error Handling

Use the shared helper in `src/lib/api-response.ts`.

- Import: `import { handleError } from '@/lib/api-response';`
- Wrap route logic in try/catch and return `handleError(error)` in the catch.
- Zod validation errors return 400 with `{ error: 'Validation error', details }`.
- Generic errors default to 500 with `{ error: message }`.
- For expected not-found cases, return 404 explicitly.

Example:

```ts
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    // ...
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
```

Delete not-found pattern (Prisma):

```ts
try {
  await prisma.initiative.delete({ where: { id } });
  return NextResponse.json({ success: true }); // 200
} catch (error) {
  if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
    return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
  }
  return handleError(error);
}
```

## Validation

- Define Zod schemas under `src/lib/validations/` (e.g., `initiative.ts`, `kpi.ts`).
- Parse request bodies before DB calls:

```ts
import { createInitiativeSchema } from '@/lib/validations/initiative';

const json = await request.json();
const data = createInitiativeSchema.parse(json); // throws ZodError -> handled
```

- Normalize nullable-to-undefined in schemas where needed to match Prisma optional fields.
- Validate query parameters from `new URL(request.url).searchParams` as needed (string to number, enums, etc.).

## Prisma Usage

Use the shared singleton from `src/lib/prisma.ts`.

```ts
import { prisma } from '@/lib/prisma';
```

- The client is a dev-time singleton with query/error logging and a `$use` error middleware.
- Prefer `include` only for relations actually needed by the response. Consider `select` for lean payloads.
- Use `orderBy` consistently (e.g., `createdAt: 'desc'`) where list stability matters.
- Use `findUnique`/`findFirst` for single reads; `findMany` for lists with filters.
- Consider transactions (`prisma.$transaction`) when modifying multiple models that must be atomic.

## API Route Patterns

All API routes live under `src/app/api/...` and export HTTP methods as functions.

- GET (list): filter via `searchParams` and return JSON array.
- GET (single): path params, return 404 if not found.
- POST (create): validate body, create, return 201 with resource.
- PUT/PATCH (update): validate body, update, return updated resource.
- DELETE: return 200 `{ success: true }` on success; 404 if not found.

Example (from `src/app/api/initiatives/route.ts`):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createInitiativeSchema } from '@/lib/validations/initiative';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;

    const initiatives = await prisma.initiative.findMany({
      where: { organizationId: orgId, ownerId },
      include: { organization: true, owner: true, kpis: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(initiatives);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createInitiativeSchema.parse(json);

    const initiative = await prisma.initiative.create({
      data,
      include: { organization: true, owner: true },
    });

    return NextResponse.json(initiative, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## Status Codes and Response Shapes

- 200 OK: Successful reads/updates/deletes. For delete: `{ success: true }`.
- 201 Created: Successful creates, return full resource in body.
- 400 Bad Request: Validation errors (Zod) via `handleError`.
- 404 Not Found: Explicit when IDs are missing or Prisma "record not found" cases.
- 500 Internal Server Error: Unexpected errors via `handleError`.

Always return JSON objects or arrays. Avoid returning plain strings.

## Dynamic Route Params (Next.js App Router)

In some runtimes, `params` for dynamic routes may be async. See `README.md` Development Notes for the `await params` pattern when needed.

## Testing

- Write Jest tests for API handlers under `test/api/*.test.ts`.
- Mock Prisma via `prismaMock` where appropriate.
- Test both success and error paths (validation 400, not found 404, etc.).

## Performance and Safety

- Use pagination for potentially large lists (add `take`, `skip`).
- Index common filters in Prisma schema (e.g., `@@index([organizationId])`).
- Use `onDelete: Cascade` thoughtfully; ensure UI/API respects cascading effects.

## Naming and Structure

- Place schemas in `src/lib/validations/` with `createXSchema`, `updateXSchema` names.
- Keep route handlers small; delegate mapping/formatting to helpers if complex.
- Keep console logging minimal in production (current Prisma client config logs queries in non-production only).

## Where to Get Help

- Open an issue: https://github.com/fam-OS/truenorth/issues
- Start a discussion: https://github.com/fam-OS/truenorth/discussions

Thanks for contributing! If you have questions, open an issue or draft PR with your proposal.
