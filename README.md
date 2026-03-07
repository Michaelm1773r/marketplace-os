# Marketplace OS

A managed marketplace web app that turns buyer briefs into tracked execution plans, assigns freelancers, orchestrates dependencies, runs QA, and releases payment by milestone.

**Status:** Round 1 — Foundation (auth, database, admin shell, role-based navigation)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **PostgreSQL** database — free options:
  - [Neon](https://neon.tech) (recommended, free tier)
  - [Supabase](https://supabase.com) (free tier)
  - Or run locally with Docker: `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres`

### Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Then edit .env — see "Environment Setup" below

# 3. Generate Prisma client
npx prisma generate

# 4. Create database tables
npx prisma migrate dev --name init

# 5. Seed with test data (optional but recommended)
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Setup

Edit your `.env` file with these values:

### Database (required)

Sign up at [neon.tech](https://neon.tech), create a project, and copy the connection string.

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### NextAuth Secret (required)

Generate a random secret:

```bash
openssl rand -base64 32
```

```
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Email — Magic Link Auth (required to sign in)

**Option A: Ethereal (easiest for development)**

Go to [ethereal.email](https://ethereal.email), click "Create Ethereal Account", and use the credentials:

```
EMAIL_SERVER_HOST="smtp.ethereal.email"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-ethereal-username@ethereal.email"
EMAIL_SERVER_PASSWORD="your-ethereal-password"
EMAIL_FROM="noreply@marketplace-os.com"
```

Then check the Ethereal web inbox to see magic link emails.

**Option B: Postmark or SendGrid (production)**

Use your real SMTP credentials. See `.env.example` for the format.

---

## Test Accounts

After running `npm run db:seed`, these accounts exist in the database. Sign in by entering the email on the login page — the magic link arrives in your Ethereal inbox (or real inbox if using a production email provider).

| Role | Email | What you see |
|------|-------|-------------|
| **Admin/Operator** | `admin@marketplace-os.com` | Operator console with all projects, freelancer bench, QA queue |
| **Buyer** | `buyer@example.com` | Buyer dashboard with sample project, milestone tracking |
| **Freelancer (Designer)** | `designer@example.com` | Freelancer dashboard with assigned tasks |
| **Freelancer (Developer)** | `developer@example.com` | Freelancer dashboard |
| **Freelancer (Content)** | `content@example.com` | Freelancer dashboard |

---

## What's Included (Round 1)

### Done
- [x] Next.js 14 project with TypeScript and Tailwind CSS
- [x] Full Prisma schema (14 entities: Users, Projects, Milestones, Tasks, Submissions, QA Reviews, Change Requests, Payments, Notifications, etc.)
- [x] Magic link email authentication (NextAuth)
- [x] Role-based access: Buyer, Freelancer, Admin
- [x] Sidebar navigation (adapts to user role)
- [x] Dashboard with role-specific views
- [x] Admin: operator console, project list, freelancer bench, QA queue
- [x] Buyer: project list, overview stats
- [x] Freelancer: task list, overview stats
- [x] Notifications page
- [x] Settings page
- [x] Database seed script with sample data
- [x] Mobile-responsive layout

### Coming in Round 2
- [ ] Brief intake form (structured project brief with file uploads)
- [ ] Milestone and task CRUD (operator creates plans)
- [ ] Milestone templates (landing page, marketing site)
- [ ] Freelancer assignment UI
- [ ] Buyer plan review and approval

### Coming in Round 3
- [ ] Project workspace (task board, comments, activity feed)
- [ ] Deliverable submission and QA review flow
- [ ] Revision and change request logic
- [ ] File uploads with S3 signed URLs

### Coming in Round 4
- [ ] Stripe payments (milestone escrow, freelancer payouts)
- [ ] Event-driven notification system (email + in-app)
- [ ] SLA timers and reminder jobs (BullMQ)
- [ ] Auto-release rules

---

## Project Structure

```
marketplace-os/
├── CLAUDE.md               # Rules for Claude Code
├── prisma/
│   ├── schema.prisma       # Database schema (14 entities)
│   └── seed.ts             # Test data seed script
├── src/
│   ├── app/
│   │   ├── api/auth/       # NextAuth API route
│   │   ├── dashboard/      # All authenticated pages
│   │   │   ├── admin/      # Operator-only pages
│   │   │   ├── projects/   # Buyer project pages
│   │   │   ├── tasks/      # Freelancer task pages
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── login/          # Auth pages
│   │   ├── unauthorized/
│   │   ├── globals.css
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── auth-provider.tsx
│   │   └── sidebar.tsx     # Role-based navigation
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config
│   │   ├── auth-helpers.ts # getCurrentUser, requireRole
│   │   ├── db.ts           # Prisma client
│   │   └── utils.ts        # formatCents, formatDate, cn
│   └── types/
│       └── next-auth.d.ts  # Type augmentation for roles
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Useful Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run db:seed        # Seed database with test data
npx prisma studio      # Visual database browser (opens in browser)
npx prisma migrate dev # Run migrations after schema changes
```

---

## Using Claude Code for Next Rounds

This repo includes a `CLAUDE.md` file with rules and context for Claude Code. To continue building:

1. Open your terminal in this project directory
2. Start Claude Code: `claude`
3. Tell it what to build: "Read CLAUDE.md and implement Epic 2: Brief Intake from the PRD"

Claude Code will read the existing codebase, understand the schema and patterns, and implement the next feature set.

---

## Deployment

When ready for production:

1. **Frontend + API:** Deploy to [Vercel](https://vercel.com) (connect your GitHub repo)
2. **Database:** Use your Neon/Supabase production database
3. **Environment:** Set all `.env` variables in Vercel's dashboard
4. **Domain:** Add your custom domain in Vercel settings

---

## License

Private — not open source.
