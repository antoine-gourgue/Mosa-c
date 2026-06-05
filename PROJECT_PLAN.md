# Mosaic — Project Plan

Generated from `scripts/tickets.mjs` (run `node scripts/gen-plan.mjs`). Epics map to GitHub Milestones; each ticket becomes an Issue with a `feature/<issue-number>-<slug>` branch.

**Totals:** 16 epics · 86 tickets · 26 labels.

## Labels

`type:setup` · `type:feature` · `type:chore` · `type:test` · `type:docs` · `type:infra` · `type:design-system` · `area:tooling` · `area:design-system` · `area:backend` · `area:auth` · `area:feed` · `area:search` · `area:detail` · `area:boards` · `area:create` · `area:animation` · `area:ci` · `area:deploy` · `area:profile` · `area:engagement` · `area:notifications` · `area:sharing` · `priority:p0` · `priority:p1` · `priority:p2`

## M1 · Project Setup & Tooling

> Next.js, TypeScript strict, Tailwind, lint/format, env, repo hygiene. — _6 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Scaffold Next.js (App Router) + TypeScript strict | chore | `chore/<n>-scaffold-next-typescript` | `type:setup` `area:tooling` `priority:p0` |
| 2 | Enforce strict TypeScript configuration | chore | `chore/<n>-tsconfig-strict` | `type:setup` `area:tooling` `priority:p0` |
| 3 | Configure ESLint + Prettier (no `//` comments, JSDoc rules) | chore | `chore/<n>-eslint-prettier` | `type:setup` `area:tooling` `priority:p0` |
| 4 | Define project folder architecture & path aliases | chore | `chore/<n>-folder-architecture` | `type:setup` `area:tooling` `priority:p1` |
| 5 | Environment variables: schema, validation and `.env.example` | chore | `chore/<n>-env-validation` | `type:setup` `area:tooling` `priority:p0` |
| 6 | Git hooks: Husky, lint-staged, commitlint | chore | `chore/<n>-git-hooks` | `type:setup` `area:tooling` `priority:p2` |

## M2 · Design System & Foundations

> Tokens, icons and reusable, prop-driven UI components. — _12 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Map design tokens to Tailwind theme & CSS variables | feature | `feature/<n>-design-tokens-tailwind` | `type:design-system` `area:design-system` `priority:p0` |
| 2 | Global styles, reset and font setup | feature | `feature/<n>-global-styles` | `type:design-system` `area:design-system` `priority:p1` |
| 3 | Typed SVG icon system | feature | `feature/<n>-icon-system` | `type:design-system` `area:design-system` `priority:p0` |
| 4 | Button component (variants, sizes, props) | feature | `feature/<n>-button-component` | `type:design-system` `area:design-system` `priority:p0` |
| 5 | IconButton / round button component | feature | `feature/<n>-icon-button-component` | `type:design-system` `area:design-system` `priority:p1` |
| 6 | Avatar component (size, verified badge, fallback) | feature | `feature/<n>-avatar-component` | `type:design-system` `area:design-system` `priority:p0` |
| 7 | Input / TextField component | feature | `feature/<n>-input-component` | `type:design-system` `area:design-system` `priority:p1` |
| 8 | Pill / Tab component (nav links, choices) | feature | `feature/<n>-pill-component` | `type:design-system` `area:design-system` `priority:p1` |
| 9 | Toast component + ToastProvider/context | feature | `feature/<n>-toast-system` | `type:design-system` `area:design-system` `priority:p0` |
| 10 | Card / Surface primitives & Divider | feature | `feature/<n>-surface-primitives` | `type:design-system` `area:design-system` `priority:p2` |
| 11 | Skeleton & Spinner loading components | feature | `feature/<n>-loading-components` | `type:design-system` `area:design-system` `priority:p1` |
| 12 | Design system showcase page | feature | `feature/<n>-design-system-showcase` | `type:docs` `area:design-system` `priority:p2` |

## M3 · Database & Backend Infrastructure

> Docker Postgres, Prisma schema, seed, services layer. — _6 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Docker Compose for PostgreSQL | chore | `chore/<n>-docker-postgres` | `type:infra` `area:backend` `priority:p0` |
| 2 | Prisma setup & client singleton | chore | `chore/<n>-prisma-setup` | `type:infra` `area:backend` `priority:p0` |
| 3 | Prisma schema: User, Pin, Board, Save, Follow, Category | feature | `feature/<n>-prisma-schema` | `type:infra` `area:backend` `priority:p0` |
| 4 | Seed script from the design handoff data | feature | `feature/<n>-prisma-seed` | `type:infra` `area:backend` `priority:p0` |
| 5 | Image assets pipeline (handoff images → public) | chore | `chore/<n>-image-assets` | `type:infra` `area:backend` `priority:p1` |
| 6 | Services layer & error/response conventions | feature | `feature/<n>-services-layer` | `type:infra` `area:backend` `priority:p1` |

## M4 · Authentication & Onboarding

> Auth.js, credentials + OAuth-ready, sign-up and onboarding flows. — _8 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Auth.js (NextAuth) setup with Prisma adapter | feature | `feature/<n>-authjs-setup` | `type:feature` `area:auth` `priority:p0` |
| 2 | Credentials provider (email/password + bcrypt) | feature | `feature/<n>-credentials-provider` | `type:feature` `area:auth` `priority:p0` |
| 3 | OAuth providers ready (Google/Apple scaffolding) | feature | `feature/<n>-oauth-providers` | `type:feature` `area:auth` `priority:p2` |
| 4 | Register & login server actions with validation | feature | `feature/<n>-auth-actions` | `type:feature` `area:auth` `priority:p0` |
| 5 | Sign-up screen UI | feature | `feature/<n>-sign-up-screen` | `type:feature` `area:auth` `priority:p0` |
| 6 | Onboarding gender step UI | feature | `feature/<n>-onboarding-gender` | `type:feature` `area:auth` `priority:p1` |
| 7 | Login screen UI | feature | `feature/<n>-login-screen` | `type:feature` `area:auth` `priority:p1` |
| 8 | Session, route protection & middleware | feature | `feature/<n>-route-protection` | `type:feature` `area:auth` `priority:p0` |

## M5 · Core Feed (Home / Masonry)

> App shell, TopNav, masonry, pin cards, save flow. — _8 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | App shell layout for the (main) route group | feature | `feature/<n>-app-shell` | `type:feature` `area:feed` `priority:p0` |
| 2 | TopNav component | feature | `feature/<n>-top-nav` | `type:feature` `area:feed` `priority:p0` |
| 3 | useColumns responsive masonry hook | feature | `feature/<n>-use-columns` | `type:feature` `area:feed` `priority:p0` |
| 4 | Masonry component | feature | `feature/<n>-masonry` | `type:feature` `area:feed` `priority:p0` |
| 5 | PinCard component | feature | `feature/<n>-pin-card` | `type:feature` `area:feed` `priority:p0` |
| 6 | Home feed page (server-rendered pins) | feature | `feature/<n>-home-feed` | `type:feature` `area:feed` `priority:p0` |
| 7 | Floating action button (FAB) | feature | `feature/<n>-fab` | `type:feature` `area:feed` `priority:p2` |
| 8 | Save / unsave server action with optimistic UI + toast | feature | `feature/<n>-save-action` | `type:feature` `area:feed` `area:backend` `priority:p0` |

## M6 · Search & Discovery

> Search page, categories, inspiration rail, live filtering. — _4 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Search page route & enlarged search bar | feature | `feature/<n>-search-page` | `type:feature` `area:search` `priority:p0` |
| 2 | Category grid | feature | `feature/<n>-category-grid` | `type:feature` `area:search` `priority:p1` |
| 3 | Today's Inspiration rail | feature | `feature/<n>-inspiration-rail` | `type:feature` `area:search` `priority:p2` |
| 4 | Live search filtering + empty state | feature | `feature/<n>-search-filtering` | `type:feature` `area:search` `priority:p0` |

## M7 · Pin Detail & Interactions

> Detail overlay, creator row, follow, suggestions. — _4 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Pin detail overlay via intercepting route | feature | `feature/<n>-detail-route` | `type:feature` `area:detail` `priority:p0` |
| 2 | Detail layout: media + info panel | feature | `feature/<n>-detail-layout` | `type:feature` `area:detail` `priority:p0` |
| 3 | Creator row + Follow action | feature | `feature/<n>-follow-action` | `type:feature` `area:detail` `area:backend` `priority:p0` |
| 4 | 'More like creator' suggestions | feature | `feature/<n>-more-like-creator` | `type:feature` `area:detail` `priority:p2` |

## M8 · Boards & Saves

> Quick Saves board, collaborators, board CRUD. — _4 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Board page (Quick Saves) layout & tools | feature | `feature/<n>-board-page` | `type:feature` `area:boards` `priority:p0` |
| 2 | Board collaborators avatar stack | feature | `feature/<n>-board-collaborators` | `type:feature` `area:boards` `priority:p2` |
| 3 | Saved pins grid + empty state | feature | `feature/<n>-saved-grid` | `type:feature` `area:boards` `area:backend` `priority:p0` |
| 4 | Boards CRUD (create board, add pin to board) | feature | `feature/<n>-boards-crud` | `type:feature` `area:boards` `area:backend` `priority:p1` |

## M9 · Create Pin & Upload

> Create page, file upload, storage, persistence. — _4 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Create Pin page layout | feature | `feature/<n>-create-page` | `type:feature` `area:create` `priority:p0` |
| 2 | Image upload drop zone with preview | feature | `feature/<n>-upload-dropzone` | `type:feature` `area:create` `priority:p0` |
| 3 | Image storage abstraction (local disk, S3-ready) | feature | `feature/<n>-storage-abstraction` | `type:infra` `area:create` `area:backend` `priority:p1` |
| 4 | Create pin server action (persist + redirect) | feature | `feature/<n>-create-pin-action` | `type:feature` `area:create` `area:backend` `priority:p0` |

## M10 · Animations & Polish (GSAP)

> GSAP setup, feed/overlay/toast/auth animations. — _5 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | GSAP setup with useGSAP and reduced-motion support | feature | `feature/<n>-gsap-setup` | `type:feature` `area:animation` `priority:p1` |
| 2 | Feed entrance stagger animation | feature | `feature/<n>-feed-stagger` | `type:feature` `area:animation` `priority:p2` |
| 3 | Pin detail overlay open/close transition (Flip) | feature | `feature/<n>-detail-flip` | `type:feature` `area:animation` `priority:p1` |
| 4 | Toast slide animation | feature | `feature/<n>-toast-animation` | `type:feature` `area:animation` `priority:p2` |
| 5 | Auth mosaic background animation | feature | `feature/<n>-auth-mosaic-animation` | `type:feature` `area:animation` `priority:p2` |

## M11 · Testing & CI/CD

> Vitest, Playwright, GitHub Actions pipeline. — _5 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Vitest + React Testing Library setup | chore | `chore/<n>-vitest-setup` | `type:test` `area:ci` `priority:p0` |
| 2 | Unit tests for design-system components | test | `test/<n>-ds-unit-tests` | `type:test` `area:design-system` `priority:p1` |
| 3 | Unit tests for services & server actions | test | `test/<n>-backend-unit-tests` | `type:test` `area:backend` `priority:p1` |
| 4 | Playwright setup & critical e2e flows | test | `test/<n>-playwright-e2e` | `type:test` `area:ci` `priority:p1` |
| 5 | GitHub Actions CI (lint, typecheck, test, build) | chore | `chore/<n>-github-actions-ci` | `type:infra` `area:ci` `priority:p0` |

## M12 · Deployment & Documentation

> Dockerfile, deploy config, a11y, responsive QA, docs. — _4 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Production Dockerfile & compose | chore | `chore/<n>-production-docker` | `type:infra` `area:deploy` `priority:p1` |
| 2 | Deployment configuration & docs | docs | `docs/<n>-deployment-docs` | `type:docs` `area:deploy` `priority:p2` |
| 3 | Accessibility pass | chore | `chore/<n>-a11y-pass` | `type:chore` `area:deploy` `priority:p1` |
| 4 | Responsive QA pass | chore | `chore/<n>-responsive-qa` | `type:chore` `area:deploy` `priority:p1` |

## M13 · Profile & Collections

> Public profiles, created pins, boards/collections, edit profile. — _6 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Add username and bio to the user model | feature | `feature/<n>-profile-schema` | `type:feature` `area:profile` `area:backend` `priority:p0` |
| 2 | Profile data-access services | feature | `feature/<n>-profile-services` | `type:feature` `area:profile` `area:backend` `priority:p0` |
| 3 | Public profile page (header + tabs) | feature | `feature/<n>-profile-page` | `type:feature` `area:profile` `priority:p0` |
| 4 | Profile Created and Saved tabs | feature | `feature/<n>-profile-tabs-content` | `type:feature` `area:profile` `priority:p1` |
| 5 | Board (collection) detail page | feature | `feature/<n>-board-detail-page` | `type:feature` `area:profile` `area:boards` `priority:p1` |
| 6 | Edit profile (name, bio, avatar) | feature | `feature/<n>-edit-profile` | `type:feature` `area:profile` `priority:p2` |

## M14 · Likes & Comments

> Like pins, comment threads, counts. — _5 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Likes and comments schema | feature | `feature/<n>-engagement-schema` | `type:feature` `area:engagement` `area:backend` `priority:p0` |
| 2 | Like action, button and count | feature | `feature/<n>-like-action` | `type:feature` `area:engagement` `priority:p0` |
| 3 | Comment services and actions | feature | `feature/<n>-comment-actions` | `type:feature` `area:engagement` `area:backend` `priority:p1` |
| 4 | Comments UI on the pin detail | feature | `feature/<n>-comments-ui` | `type:feature` `area:engagement` `area:detail` `priority:p1` |
| 5 | Surface like and comment counts | feature | `feature/<n>-engagement-counts` | `type:feature` `area:engagement` `priority:p2` |

## M15 · Notifications

> Follow/like/comment notifications, unread state, inbox. — _3 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Notifications schema and creation hooks | feature | `feature/<n>-notification-schema` | `type:feature` `area:notifications` `area:backend` `priority:p0` |
| 2 | Notification services | feature | `feature/<n>-notification-services` | `type:feature` `area:notifications` `area:backend` `priority:p1` |
| 3 | Notifications inbox UI | feature | `feature/<n>-notifications-ui` | `type:feature` `area:notifications` `priority:p1` |

## M16 · Sharing & Download

> Share pins (link/Web Share) and download images. — _2 tickets_

| # | Ticket | Type | Branch | Labels |
| - | ------ | ---- | ------ | ------ |
| 1 | Share a pin (link / Web Share) with copy fallback | feature | `feature/<n>-share-pin` | `type:feature` `area:sharing` `priority:p1` |
| 2 | Download a pin image | feature | `feature/<n>-download-image` | `type:feature` `area:sharing` `area:detail` `priority:p2` |

