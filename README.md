# TrueNorth - Executive Dashboard

A web application for managing tasks, goals, and business metrics for tech executives.

## Features

- Task Management with notes and due dates
- Organization and Business Unit structure
- Stakeholder Goal Tracking
- Business Metrics Dashboard
- Meeting Notes and Progress Tracking

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- TailwindCSS
- Jest & Testing Library

## Data Model

### Organization Structure
- Users manage multiple Organizations
- Organizations contain Business Units
- Business Units have Stakeholders
- Stakeholders have Goals and Meetings
- Business Units track Metrics

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

3. Set up the database:
   ```bash
   # Create a PostgreSQL database
   createdb truenorth_dev

   # Copy the example env file
   cp .env.example .env

   # Update the DATABASE_URL in .env with your database credentials
   # DATABASE_URL="postgresql://username:password@localhost:5432/truenorth_dev"

   # Run migrations
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
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