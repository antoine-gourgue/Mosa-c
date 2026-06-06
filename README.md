# Mosaic

A Pinterest-like image board to discover pins, save ideas, build boards, follow creators and publish content.

## Tech stack

| Concern         | Choice                                           |
| --------------- | ------------------------------------------------ |
| Framework       | Next.js (App Router) + React                     |
| Language        | TypeScript (`strict`, no implicit `any`)         |
| Styling         | Tailwind CSS + design tokens                     |
| Animation       | GSAP (`@gsap/react` `useGSAP`)                   |
| Database        | PostgreSQL (Docker)                              |
| ORM             | Prisma                                           |
| Auth            | Auth.js (NextAuth) — credentials + OAuth-ready   |
| Testing         | Vitest + React Testing Library, Playwright (e2e) |
| CI/CD           | GitHub Actions (lint, typecheck, test, build)    |
| Package manager | npm                                              |

## Project conventions

- **TypeScript strict everywhere.** No implicit `any`, no non-null assertions without justification.
- **Documentation:** JSDoc only, written in **English**. No inline `//` comments and no `/* ... */` block comments outside of JSDoc.
- **Design system first.** Every UI element is a reusable component configurable through props (`size`, `variant`, `color`, ...). See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).
- **Clean architecture.** Pages stay thin; logic lives in `server/`, `lib/`, `hooks/`. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Getting started

```bash
npm install
docker compose up -d            # start PostgreSQL
cp .env.example .env            # then fill the secrets
npx prisma migrate dev          # apply schema
npx prisma db seed              # seed demo content
npm run dev                     # http://localhost:3000
```

## Workflow

Work is tracked as GitHub Issues grouped into Milestones (epics) on a Projects board.

- One branch per ticket: `feature/<issue-number>-<slug>` (or `chore/`, `fix/`).
- Conventional commits (`feat:`, `fix:`, `chore:`, ...).
- A pull request closes its issue (`Closes #<n>`); CI must be green before merge.

### Git hooks

Husky installs hooks on `npm install` (via the `prepare` script):

- **pre-commit** runs `lint-staged` — ESLint (`--fix`) and Prettier on staged files.
- **commit-msg** runs `commitlint` to enforce the Conventional Commits format.

A non-conventional message (e.g. `update stuff`) is rejected; use `type(scope): subject`.

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full epic and ticket breakdown.

## Documentation

- [`PROJECT_PLAN.md`](PROJECT_PLAN.md) — epics, milestones and tickets.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — folder structure and layering.
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — coding, naming and documentation rules.
- [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md) — colors, spacing, radius, typography.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment on a VPS (Docker + Supabase).
