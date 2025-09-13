# TrueNorth — Executive Dashboard (Open Source, Self‑Hosted)

![CI](https://github.com/fam-OS/truenorth/actions/workflows/ci.yml/badge.svg?branch=test)

TrueNorth is an open-source executive and operations dashboard you can self-host inside your company. It helps leaders manage team planning, 1:1s, initiatives, KPIs, and financials — in one place. We do not host your data or facilitate signups.

## Features

- Task Management with notes and due dates
- Organization and Business Unit structure
- Stakeholder Goal Tracking
- Business Metrics Dashboard
- Meeting Notes and Progress Tracking

## Tech Stack

- Next.js (App Router) — currently Next `15.4.5` with Turbopack for dev
- React `19.x`, TypeScript `^5`
- Prisma ORM `^6.13.0`
- PostgreSQL
- Tailwind CSS `^4`
- Zod `^4` for request validation
- Jest for backend tests (Node environment)

## Recent Improvements

- Auth-scoped Goals endpoint
  - `src/app/api/goals/route.ts` now restricts results to Business Units the viewer can access (derived from their Organizations via Teams/Initiatives). New users with no org access will see zero goals in dashboard overviews.
- Session typing hardening for CI/Vercel
  - Cast `getServerSession(authOptions)` results to `any` before accessing `session.user` in a few routes to satisfy stricter type inference in CI.
  - Updated files include:
    - `src/app/api/auth/otp/verify/route.ts`
    - `src/app/api/reports/initiatives/route.ts`
- Nodemailer typing fix for builds
  - Added `types/nodemailer.d.ts` to provide a minimal ambient declaration.
  - Updated `src/lib/email.ts` to avoid referencing `nodemailer.Transporter` namespace type (uses `any`), fixing “Cannot find namespace 'nodemailer'” build errors without introducing a new dev dependency.
- Marketing page and header UI updates (open-source focus)
  - Switched logo to PNG and matched header background tone: `src/app/(dashboard)/layout.tsx` now uses `bg-[#FFF6E5]`.
  - Adjusted header/logo sizing for better branding presence.
  - Marketing page (`src/app/page.tsx`) updated to remove Sign in/Sign up CTAs and add links to the GitHub repo and contributing guide.

## Data Model

### Diagram

```mermaid
erDiagram
  Organization ||--o{ BusinessUnit : has
  Organization ||--o{ Team : has
  Organization }o--o{ User : members
  Organization ||--o{ Initiative : has
  Organization ||--o{ Kpi : has

  BusinessUnit }o--|| Organization : belongs_to
  BusinessUnit ||--o{ Stakeholder : has
  BusinessUnit ||--o{ Metric : has

  Stakeholder }o--|| BusinessUnit : belongs_to
  Stakeholder ||--o{ Goal : has
  Stakeholder ||--o{ Meeting : has
  Stakeholder }o--o{ Stakeholder : reports_to

  Team }o--|| Organization : belongs_to
  Team ||--o{ TeamMember : has
  Team ||--o{ OpsReview : has
  Team ||--o{ OpsReviewItem : has
  Team ||--o{ Kpi : has

  TeamMember }o--|| Team : belongs_to
  TeamMember ||--o{ OpsReview : owns
  TeamMember ||--o{ OpsReviewItem : owns
  TeamMember ||--o{ Initiative : owns
  TeamMember }o--o{ TeamMember : manages

  OpsReview }o--|| Team : belongs_to
  OpsReview ||--o{ OpsReviewItem : has
  OpsReview }o--o{ TeamMember : owner

  OpsReviewItem }o--|| OpsReview : belongs_to
  OpsReviewItem }o--|| Team : belongs_to
  OpsReviewItem }o--o{ TeamMember : owner

  Initiative }o--|| Organization : belongs_to
  Initiative }o--o{ TeamMember : owner
  Initiative ||--o{ Kpi : has

  Kpi }o--|| Organization : belongs_to
  Kpi }o--|| Team : belongs_to
  Kpi }o--o{ Initiative : links_to

  Goal }o--|| Stakeholder : belongs_to
  Meeting }o--|| Stakeholder : belongs_to
  Metric }o--|| BusinessUnit : belongs_to
  User }o--o{ Organization : member_of
```

The diagram reflects the relations defined in `prisma/schema.prisma`, including optional links like `Kpi.initiativeId` and owners on `Initiative`, `OpsReview`, and `OpsReviewItem`.

### Organization Structure
- Users manage multiple Organizations
- Organizations contain Business Units
- Business Units have Stakeholders
- Stakeholders have Goals and Meetings
- Business Units track Metrics

### Teams
- Organizations contain Teams
- Teams have Team Members

### Team Members
- Fields: `id`, `name`, `email?`, `role?`, `teamId`
- Note: `email` and `role` are optional (nullable). Multiple members can have a `NULL` email; uniqueness is enforced only for non-null emails per team via a composite unique index `@@unique([teamId, email])`.

### Task Management
- Tasks with status tracking
- Task notes and comments
- Due date management

### Goal Tracking
- Goals linked to Stakeholders
- Start and end dates
- Requirements gathering
- Progress tracking
- Multiple status states

### (Planned) Ops Reviews
- Data concept: Ops Review has a title, owner (Team Member relation), description, quarter, month, year, and Team relation

## Getting Started (Local Dev)

1. Clone the repository:
   ```bash
   git clone https://github.com/fam-OS/truenorth.git
   cd truenorth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL

   You can use a local Postgres or a managed Postgres like Neon. Examples below cover both.

   ### Option A) Local Postgres (macOS/Homebrew example)

   #### a. Open Terminal and enter the PostgreSQL shell:
   ```bash
   psql -U postgres
   ```

   #### b. Create a new user and database (replace `yourusername`/`yourpassword` as needed):
   ```sql
   CREATE USER yourusername WITH PASSWORD 'yourpassword';
   CREATE DATABASE truenorth_dev;
   GRANT ALL PRIVILEGES ON DATABASE truenorth_dev TO yourusername;
   \q
   ```

   #### c. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

   #### d. Set your DATABASE_URL in `.env`:
   ```env
   DATABASE_URL="postgresql://yourusername:yourpassword@localhost:5432/truenorth_dev"
   ```

   #### e. Run migrations & seed demo data:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```

   ### Option B) Neon (Managed Postgres)

   1. Create a free Neon project and database
   2. Copy the connection string and set it as `DATABASE_URL` in your `.env` (Neon requires SSL):
      ```env
      DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require&channel_binding=require"
      ```
   3. Run migrations & seed demo data:
      ```bash
      npx prisma migrate deploy
      npm run seed
      ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   Stop the development server: 
   ```bash
   pkill -f next
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> Note: The marketing landing page is public and promotes self-hosting. Authenticated areas require you to configure authentication (see below) if you want to use the full app.

## Authentication (Optional but Recommended)

TrueNorth uses NextAuth. You can enable any provider(s) you prefer for your internal deployment. Common setups:

- Credentials auth (email/password) — internal only
- Google OAuth — for companies on Google Workspace

Required environment variables (depending on providers):

```env
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

For production, set `NEXTAUTH_URL` to your deployed URL and ensure secrets are set via your platform’s env settings.

### Email/OTP (Optional)

If you enable email-based flows (e.g., OTP or notifications), configure SMTP credentials. An example is included in `env.example`:

```env
SMTP_HOST="smtp.postmarkapp.com"
SMTP_PORT="587"
SMTP_USER="<postmark-server-token>"
SMTP_PASS="<postmark-server-token>"
EMAIL_FROM="TrueNorth <no-reply@yourdomain.com>"
# Optional: EMAIL_STREAM for Postmark message stream
EMAIL_STREAM="true-north"
```

You can use any SMTP provider. Ensure network egress is allowed from your hosting environment.

## Database Schema

### Organizations
- id: unique identifier
- name: organization name
- description: optional description
- businessUnits: related business units
- users: related users

### Business Units
- id: unique identifier
- name: unit name
- description: optional description
- orgId: related organization
- stakeholders: related stakeholders
- metrics: related metrics

### Stakeholders
- id: unique identifier
- name: stakeholder name
- email: contact email
- role: role description
- businessUnitId: related business unit
- goals: related goals
- meetings: related meetings

### Goals
- id: unique identifier
- title: goal title
- description: detailed description
- startDate: goal start date
- endDate: goal end date
- status: NOT_STARTED/IN_PROGRESS/COMPLETED/AT_RISK/BLOCKED/CANCELLED
- stakeholderId: related stakeholder
- requirements: requirements notes
- progressNotes: progress tracking notes

### Metrics
- id: unique identifier
- name: metric name
- target: target value
- current: current value
- unit: measurement unit
- businessUnitId: related business unit

### Teams
- id: unique identifier
- name: team name
- description: optional description
- organizationId: related organization
- members: related team members

### Team Members
- id: unique identifier
- name: team member name
- email: optional contact email (nullable)
- role: optional role (nullable)
- teamId: related team

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for project conventions, development setup, and the PR checklist.

## License
MIT

---

## Development Notes

- Dynamic route params in Next.js App Router (current version) are provided as an async value in some runtimes. In API routes and server components using dynamic segments (e.g., `src/app/api/organizations/[organizationId]/teams/route.ts`, `src/app/teams/[teamId]/page.tsx`), make sure to `await params` before accessing properties:

  ```ts
  export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = await params;
    // ...
  }
  ```

- When server-fetching internal APIs from a page or route, construct an absolute base URL using request headers to avoid "Invalid URL" errors on the server:

  ```ts
  import { headers } from 'next/headers';
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/teams/${teamId}`);
  ```

## Environment Variables

- `DATABASE_URL` — Postgres connection string (required)
- `NEXTAUTH_SECRET` — random string used to sign NextAuth JWTs (required if enabling auth)
- `NEXTAUTH_URL` — base URL of your deployment (required in production if enabling auth)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — optional if using Google OAuth
- `NEXT_PUBLIC_BASE_URL` — optional. If set, client code may use it to prefix API calls; server routes/pages should prefer header-derived base URL as above.

## Self-Hosting / Production Deployment

You can deploy TrueNorth to your own infrastructure. Common options:

- Vercel (recommended for Next.js)
- Your own Node host (PM2/systemd) behind nginx

Minimum steps:

1) Provision Postgres (local, RDS, or Neon) and set `DATABASE_URL`
2) Run migrations (deploy) and seed if desired:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
3) Set environment variables for auth (if enabled)
4) Build and start
   ```bash
   npm run build
   npm start
   ```

Notes:

- Prisma: `clientExtensions` preview flag is not required in v6+.
- If CI or builds complain about `session.user` typing, ensure routes cast or use shared auth helpers as noted below in Development Notes.
- If Nodemailer types cause CI errors, keep `types/nodemailer.d.ts` or install `@types/nodemailer`.

### Deploy to Vercel (One‑Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fam-OS/truenorth&project-name=truenorth&repository-name=truenorth&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,EMAIL_FROM,EMAIL_STREAM&envDescription=Set%20required%20secrets%20for%20auth%20and%20database)

After deploy, run migrations (e.g., via a one-off job or `vercel exec`), then seed if desired.

### Continuous Integration

Pull requests targeting the `test` branch run CI via GitHub Actions (`.github/workflows/ci.yml`):

- Spins up Postgres service
- Installs dependencies with `npm ci`
- Generates Prisma client and runs `prisma migrate deploy`
- Seeds demo data (`npm run seed`)
- Runs tests (`npm test`)

## Security & Data Ownership

TrueNorth is designed for self-hosting. You control your infrastructure, data, and access.

- Data ownership: All data lives in your database (Postgres you provision). The app does not send data to external services unless you configure them (e.g., email SMTP).
- No telemetry: The project does not collect or transmit telemetry by default.
- Network & access: Host behind your company SSO and/or on a private network/VPN. Restrict public access where appropriate.
- Authentication: Use NextAuth providers that match your environment. For Google OAuth, restrict allowed domains in your provider settings.
- HTTPS: Always terminate TLS in production and set `NEXTAUTH_URL` to the `https://` origin of your deployment.
- Secrets: Set secrets via your platform’s secure env store. Never commit `.env` files. Rotate `NEXTAUTH_SECRET` if exposed.
- Database: Use encryption at rest (managed services like Neon/RDS provide this). Enforce SSL (`sslmode=require` for Neon). Back up regularly and test restores.
- Backups & migrations: Use `prisma migrate deploy` in CI/Prod. Schedule database backups and establish a recovery plan.

## Prisma

- Apply schema changes and generate client:

  ```bash
  npx prisma migrate dev --name <migration_name>
  npx prisma generate
  ```