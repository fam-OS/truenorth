# TrueNorth - Executive Dashboard

A web application for managing tasks, goals, and business metrics for tech executives.

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

## Data Model

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

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/truenorth.git
   cd truenorth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL (macOS/Homebrew example):

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

   #### e. Run migrations:
   ```bash
   npx prisma migrate dev
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

1. Create a feature branch
2. Make your changes
3. Write or update tests
4. Submit a pull request

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
- `NEXT_PUBLIC_BASE_URL` — optional. If set, client code may use it to prefix API calls; server routes/pages should prefer header-derived base URL as above.

## Prisma

- Apply schema changes and generate client:

  ```bash
  npx prisma migrate dev --name <migration_name>
  npx prisma generate
  ```