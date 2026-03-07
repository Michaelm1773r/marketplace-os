# CLAUDE.md

## Project: Managed Marketplace OS

A managed marketplace web app that turns buyer briefs into tracked execution plans,
assigns freelancers, orchestrates dependencies, runs QA, and releases payment by milestone.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- PostgreSQL + Prisma ORM
- Redis + BullMQ for background jobs
- S3-compatible storage (Cloudflare R2 / AWS S3) for file uploads
- Stripe (Checkout for buyers, Connect for freelancer payouts)
- NextAuth.js with email magic link authentication

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npx prisma migrate dev    # Run pending migrations
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Visual DB browser
```

## Rules

- Never change DB schema without creating a Prisma migration
- Always add permission checks (role-based) on API routes and server actions
- Never log secrets, tokens, or PII
- Run lint + typecheck before committing
- Write tests for all payment and permission logic
- Use server actions for mutations; API routes only for webhooks
- All file uploads use signed URLs (no public buckets)
- Domain events must be emitted for all state changes
- Use Zod for all input validation
- Money stored as integers (cents)
- Dates stored as UTC; displayed in user timezone on frontend

## File Structure

```
src/app/                  # Next.js pages and layouts
src/components/ui/        # shadcn/ui primitives
src/components/           # Shared UI components
src/lib/db.ts             # Prisma client
src/lib/auth.ts           # Auth config
src/lib/validations/      # Zod schemas
src/lib/events/           # Domain events
src/lib/storage.ts        # S3 helpers
src/lib/payments.ts       # Stripe helpers
prisma/                   # Schema and migrations
docs/                     # PRD, tickets, specs
```
