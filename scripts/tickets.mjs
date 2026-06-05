/**
 * Single source of truth for the Mosaic project backlog.
 *
 * Consumed by `scripts/seed-github.mjs` to create milestones, labels, issues
 * and per-ticket branches, and by `scripts/gen-plan.mjs` to render
 * `PROJECT_PLAN.md`. Keep this file as the canonical backlog definition.
 */

/**
 * @typedef {Object} Milestone
 * @property {string} key - Stable short key (e.g. "M1").
 * @property {string} title - Display title used as the GitHub milestone name.
 * @property {string} description - One-line epic summary.
 */

/** @type {Milestone[]} */
export const milestones = [
  {
    key: "M1",
    title: "M1 · Project Setup & Tooling",
    description: "Next.js, TypeScript strict, Tailwind, lint/format, env, repo hygiene.",
  },
  {
    key: "M2",
    title: "M2 · Design System & Foundations",
    description: "Tokens, icons and reusable, prop-driven UI components.",
  },
  {
    key: "M3",
    title: "M3 · Database & Backend Infrastructure",
    description: "Docker Postgres, Prisma schema, seed, services layer.",
  },
  {
    key: "M4",
    title: "M4 · Authentication & Onboarding",
    description: "Auth.js, credentials + OAuth-ready, sign-up and onboarding flows.",
  },
  {
    key: "M5",
    title: "M5 · Core Feed (Home / Masonry)",
    description: "App shell, TopNav, masonry, pin cards, save flow.",
  },
  {
    key: "M6",
    title: "M6 · Search & Discovery",
    description: "Search page, categories, inspiration rail, live filtering.",
  },
  {
    key: "M7",
    title: "M7 · Pin Detail & Interactions",
    description: "Detail overlay, creator row, follow, suggestions.",
  },
  {
    key: "M8",
    title: "M8 · Boards & Saves",
    description: "Quick Saves board, collaborators, board CRUD.",
  },
  {
    key: "M9",
    title: "M9 · Create Pin & Upload",
    description: "Create page, file upload, storage, persistence.",
  },
  {
    key: "M10",
    title: "M10 · Animations & Polish (GSAP)",
    description: "GSAP setup, feed/overlay/toast/auth animations.",
  },
  {
    key: "M11",
    title: "M11 · Testing & CI/CD",
    description: "Vitest, Playwright, GitHub Actions pipeline.",
  },
  {
    key: "M12",
    title: "M12 · Deployment & Documentation",
    description: "Dockerfile, deploy config, a11y, responsive QA, docs.",
  },
];

/**
 * @typedef {Object} Label
 * @property {string} name
 * @property {string} color - Hex without leading '#'.
 * @property {string} description
 */

/** @type {Label[]} */
export const labels = [
  { name: "type:setup", color: "fbca04", description: "Tooling / scaffolding" },
  { name: "type:feature", color: "1d76db", description: "User-facing feature" },
  { name: "type:chore", color: "c5def5", description: "Maintenance task" },
  { name: "type:test", color: "d4c5f9", description: "Tests" },
  { name: "type:docs", color: "0075ca", description: "Documentation" },
  { name: "type:infra", color: "5319e7", description: "Infrastructure" },
  { name: "type:design-system", color: "e99695", description: "Reusable UI component" },
  { name: "area:tooling", color: "ededed", description: "Build / tooling" },
  { name: "area:design-system", color: "f9d0c4", description: "Design system" },
  { name: "area:backend", color: "0e8a16", description: "Database / server" },
  { name: "area:auth", color: "006b75", description: "Authentication" },
  { name: "area:feed", color: "bfd4f2", description: "Home feed" },
  { name: "area:search", color: "c2e0c6", description: "Search" },
  { name: "area:detail", color: "fef2c0", description: "Pin detail" },
  { name: "area:boards", color: "d4c5f9", description: "Boards" },
  { name: "area:create", color: "f7c6c7", description: "Create pin" },
  { name: "area:animation", color: "b36b00", description: "GSAP animation" },
  { name: "area:ci", color: "5319e7", description: "CI/CD" },
  { name: "area:deploy", color: "1d76db", description: "Deployment" },
  { name: "priority:p0", color: "b60205", description: "Must have / blocking" },
  { name: "priority:p1", color: "d93f0b", description: "High priority" },
  { name: "priority:p2", color: "fbca04", description: "Nice to have" },
];

/**
 * Renders a ticket body to markdown.
 *
 * @param {Object} t
 * @param {string} t.summary
 * @param {string} [t.context]
 * @param {string[]} t.tasks
 * @param {string[]} t.acceptance
 * @param {string[]} [t.technical]
 * @returns {string}
 */
function body(t) {
  const block = (title, items) =>
    items && items.length ? `\n### ${title}\n\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";
  const dod = [
    "Code follows `docs/CONVENTIONS.md`: JSDoc in English, **no `//` comments**, TypeScript strict, no implicit `any`.",
    "`npm run lint` and `npm run typecheck` pass.",
    "Relevant unit/e2e tests added or updated.",
    "PR opened referencing this issue (`Closes #<n>`); CI green before merge.",
  ];
  return [
    `## Summary\n\n${t.summary}`,
    t.context ? `\n### Context\n\n${t.context}` : "",
    block("Tasks", t.tasks),
    block("Acceptance criteria", t.acceptance),
    block("Technical notes", t.technical),
    block("Definition of Done", dod),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @typedef {Object} Ticket
 * @property {string} title
 * @property {string} milestone - Milestone key.
 * @property {string[]} labels
 * @property {"feature"|"chore"|"fix"} type - Branch prefix.
 * @property {string} slug - Branch slug (issue number is prefixed at creation).
 * @property {string} body - Rendered markdown body.
 */

/** @type {Ticket[]} */
export const tickets = [
  /* ----------------------------- M1 ----------------------------- */
  {
    title: "Scaffold Next.js (App Router) + TypeScript strict",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p0"],
    type: "chore",
    slug: "scaffold-next-typescript",
    body: body({
      summary:
        "Initialize the Next.js application with the App Router, React and TypeScript in strict mode.",
      tasks: [
        "Run `create-next-app` with App Router, TypeScript, ESLint, `src/` directory and import alias `@/*`.",
        "Pin Node version via `.nvmrc` and `engines` in `package.json`.",
        "Add base npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`.",
        "Remove default boilerplate (demo page content, unused assets).",
      ],
      acceptance: [
        "`npm run dev` serves a blank Mosaic shell on http://localhost:3000.",
        "`npm run build` and `npm run typecheck` succeed.",
        "Folder layout matches `docs/ARCHITECTURE.md`.",
      ],
      technical: [
        "Use the latest stable Next.js. App Router only (no `pages/`).",
        "`typecheck` script: `tsc --noEmit`.",
      ],
    }),
  },
  {
    title: "Enforce strict TypeScript configuration",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p0"],
    type: "chore",
    slug: "tsconfig-strict",
    body: body({
      summary: "Harden `tsconfig.json` so implicit `any` and unsafe patterns are compile errors.",
      tasks: [
        "Enable `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`.",
        "Set `verbatimModuleSyntax` and `isolatedModules`.",
        "Configure path aliases (`@/components`, `@/lib`, `@/server`, ...).",
      ],
      acceptance: [
        "A file using an implicit `any` fails `npm run typecheck`.",
        "All aliases resolve in editor and build.",
      ],
    }),
  },
  {
    title: "Configure ESLint + Prettier (no `//` comments, JSDoc rules)",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p0"],
    type: "chore",
    slug: "eslint-prettier",
    body: body({
      summary: "Set up linting and formatting that enforce the project documentation conventions.",
      context:
        "Per `docs/CONVENTIONS.md`, only JSDoc is allowed; `//` and non-JSDoc block comments are forbidden.",
      tasks: [
        "Configure ESLint (flat config) with the Next.js, TypeScript and import plugins.",
        "Add a rule banning line comments (`no-inline-comments` / `no-warning-comments` + a custom `no-restricted-syntax` for `Line` comments).",
        "Add `eslint-plugin-jsdoc` requiring JSDoc on exported functions/components with English description.",
        "Add Prettier and an ESLint/Prettier integration; add `format` and `format:check` scripts.",
        "Enable `@typescript-eslint/no-explicit-any` as an error.",
      ],
      acceptance: [
        "A `//` comment triggers a lint error.",
        "An exported function without JSDoc triggers a lint error.",
        "`npm run lint` and `npm run format:check` pass on the codebase.",
      ],
    }),
  },
  {
    title: "Define project folder architecture & path aliases",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p1"],
    type: "chore",
    slug: "folder-architecture",
    body: body({
      summary:
        "Create the layered folder skeleton described in `docs/ARCHITECTURE.md` with placeholder index files.",
      tasks: [
        "Create `src/{components/{ui,layout,pin,search,detail},hooks,lib,server/{actions,services},types,icons,styles}`.",
        "Add `index.ts` barrels where appropriate.",
        "Add a `.gitkeep` to `public/uploads`.",
      ],
      acceptance: ["Folder tree matches the architecture doc.", "Imports via aliases compile."],
    }),
  },
  {
    title: "Environment variables: schema, validation and `.env.example`",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p0"],
    type: "chore",
    slug: "env-validation",
    body: body({
      summary:
        "Centralize and validate environment variables with Zod, failing fast on misconfiguration.",
      tasks: [
        "Create `src/lib/env.ts` validating `DATABASE_URL`, `AUTH_SECRET`, OAuth client vars and `NEXT_PUBLIC_*` with Zod.",
        "Export a typed `env` object; never read `process.env` elsewhere.",
        "Write `.env.example` with every key documented.",
      ],
      acceptance: [
        "Missing/invalid env vars throw a descriptive error at startup.",
        "`env` is fully typed (no `string | undefined` leaking).",
      ],
    }),
  },
  {
    title: "Git hooks: Husky, lint-staged, commitlint",
    milestone: "M1",
    labels: ["type:setup", "area:tooling", "priority:p2"],
    type: "chore",
    slug: "git-hooks",
    body: body({
      summary: "Automate quality gates on commit and enforce conventional commit messages.",
      tasks: [
        "Add Husky `pre-commit` running lint-staged (ESLint + Prettier on staged files).",
        "Add `commit-msg` hook with commitlint (conventional config).",
        "Document the workflow in the README.",
      ],
      acceptance: [
        "A non-conventional commit message is rejected.",
        "Staged files are linted/formatted on commit.",
      ],
    }),
  },

  /* ----------------------------- M2 ----------------------------- */
  {
    title: "Map design tokens to Tailwind theme & CSS variables",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p0"],
    type: "feature",
    slug: "design-tokens-tailwind",
    body: body({
      summary:
        "Wire the tokens from `docs/DESIGN_TOKENS.md` into Tailwind and CSS custom properties.",
      tasks: [
        "Install and configure Tailwind CSS.",
        "Expose colors (`ink`, `ink-soft`, `surface`, `accent`, ...), radii (`pin`, `lg`), the `shadow-pop` shadow and the nav height as theme tokens.",
        "Declare CSS variables in `globals.css` and reference them from the Tailwind theme.",
        "Configure the brand font stack.",
      ],
      acceptance: [
        "Utilities like `bg-accent`, `text-ink-soft`, `rounded-pin`, `shadow-pop` work.",
        "Tokens are the single source; no hard-coded hex in components.",
      ],
    }),
  },
  {
    title: "Global styles, reset and font setup",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p1"],
    type: "feature",
    slug: "global-styles",
    body: body({
      summary: "Establish base global styles, a sensible reset and the application font.",
      tasks: [
        "Add base layer resets (box-sizing, body background `--bg`, default text color `--ink`).",
        "Load the font via `next/font` and expose it as a CSS variable.",
        "Set selection, focus-visible and scrollbar baseline styles.",
      ],
      acceptance: [
        "Body uses the design background and font everywhere.",
        "Focus-visible outlines are accessible.",
      ],
    }),
  },
  {
    title: "Typed SVG icon system",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p0"],
    type: "feature",
    slug: "icon-system",
    body: body({
      summary: "Port the handoff icons into typed, reusable React icon components.",
      context:
        "Source icons: Search, Camera, Plus, Bell, Stack, Share, More, Back, Check, Sliders, Sparkle, Organize, Notes.",
      tasks: [
        "Create one component per icon in `src/icons`, accepting `size` (number) and `strokeWidth` props with a default.",
        "Provide a shared `IconProps` type and a barrel export.",
        "Icons inherit `currentColor`.",
      ],
      acceptance: [
        "`<SearchIcon size={22} />` renders and scales correctly.",
        "All icons referenced by the design are available and typed.",
      ],
    }),
  },
  {
    title: "Button component (variants, sizes, props)",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p0"],
    type: "feature",
    slug: "button-component",
    body: body({
      summary: "Reusable, accessible Button configurable entirely through props.",
      tasks: [
        "Variants: `accent`, `ghost`, `dark`, `social`; sizes: `sm | md | lg`; `fullWidth`, `disabled`, `loading`, optional `leftIcon`/`rightIcon`.",
        "Implement variants with a typed style map (no ad-hoc conditionals).",
        "Forward `ref`, spread native button props, correct `aria` and disabled handling.",
        "Full JSDoc with `@param` for every prop.",
      ],
      acceptance: [
        "All variant/size combinations match the handoff (accent red, dark, ghost, social border).",
        "Keyboard and screen-reader accessible.",
        "Unit tests cover variants and disabled/loading states.",
      ],
    }),
  },
  {
    title: "IconButton / round button component",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p1"],
    type: "feature",
    slug: "icon-button-component",
    body: body({
      summary: "Circular icon-only button used in the nav, pin overlay and detail actions.",
      tasks: [
        "Props: `icon`, `size`, `tone` (`light | dark`), `active`, `title`/`aria-label` required.",
        "Hover/active states matching the design (white round 40px, etc.).",
      ],
      acceptance: [
        "Used by TopNav, PinCard overlay and Detail actions without duplication.",
        "Requires an accessible label.",
      ],
    }),
  },
  {
    title: "Avatar component (size, verified badge, fallback)",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p0"],
    type: "feature",
    slug: "avatar-component",
    body: body({
      summary: "Avatar with numeric size, verified badge and graceful initials fallback.",
      context: "Ported from `components.jsx` Avatar.",
      tasks: [
        "Props: `src`, `name`, `size` (number), `verified`, optional `badgeSize`.",
        "On image error, render uppercase initials sized relative to `size`.",
        "Render the verified check badge when `verified`.",
      ],
      acceptance: [
        "Sizes 22/40/44/48/68 used across the app render correctly.",
        "Broken `src` falls back to initials.",
        "Unit tests for fallback and badge.",
      ],
    }),
  },
  {
    title: "Input / TextField component",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p1"],
    type: "feature",
    slug: "input-component",
    body: body({
      summary: "Labeled input used in auth and create forms.",
      tasks: [
        "Props: `label`, `type`, `placeholder`, `error`, plus native input props; associate `label`/`input` via id.",
        "Field styling matching the handoff `.field` (label + input).",
        "Support email/password/number/text.",
      ],
      acceptance: [
        "Accessible label association; error state visible and announced.",
        "Reused by sign-up and create-pin forms.",
      ],
    }),
  },
  {
    title: "Pill / Tab component (nav links, choices)",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p1"],
    type: "feature",
    slug: "pill-component",
    body: body({
      summary: "Pill-shaped toggle used for nav tabs and onboarding choices.",
      tasks: [
        "Props: `active`, `size`, `as` (button/link), children.",
        "Active state: dark fill, white text; inactive: transparent.",
      ],
      acceptance: ["Home/Saved nav tabs and onboarding gender options reuse it."],
    }),
  },
  {
    title: "Toast component + ToastProvider/context",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p0"],
    type: "feature",
    slug: "toast-system",
    body: body({
      summary: "Global toast system to surface 'Saved to Quick Saves' notifications.",
      context:
        "Toast: dark, bottom-centered, thumbnail + text + 'View' action, auto-dismiss after 3.2s.",
      tasks: [
        "Create `ToastProvider`, a `useToast()` hook and a `Toast` presentational component.",
        "Support a thumbnail, title, optional action button and timeout.",
        "Auto-dismiss after 3.2s; allow manual dismiss.",
      ],
      acceptance: [
        "`useToast().show({ img, title, action })` renders a bottom-centered toast.",
        "Toast disappears after 3.2s; only one visible at a time.",
        "Animation handled in the GSAP milestone.",
      ],
    }),
  },
  {
    title: "Card / Surface primitives & Divider",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p2"],
    type: "feature",
    slug: "surface-primitives",
    body: body({
      summary: "Low-level surface, card and divider primitives shared by screens.",
      tasks: [
        "`Surface` with radius/elevation props; `Divider` using `--line`.",
        "Document usage in JSDoc.",
      ],
      acceptance: ["Detail and board screens reuse these primitives."],
    }),
  },
  {
    title: "Skeleton & Spinner loading components",
    milestone: "M2",
    labels: ["type:design-system", "area:design-system", "priority:p1"],
    type: "feature",
    slug: "loading-components",
    body: body({
      summary: "Loading placeholders for the feed and detail while data resolves.",
      tasks: [
        "`Skeleton` (shimmer) with width/height/radius props; `Spinner` with size.",
        "A `PinCardSkeleton` matching the pin card layout.",
      ],
      acceptance: ["Used by Suspense/loading states in feed and detail."],
    }),
  },
  {
    title: "Design system showcase page",
    milestone: "M2",
    labels: ["type:docs", "area:design-system", "priority:p2"],
    type: "feature",
    slug: "design-system-showcase",
    body: body({
      summary: "A dev-only `/styleguide` page rendering every component and its variants.",
      tasks: [
        "List Button/Avatar/Input/Pill/IconButton/Toast/Skeleton variants and sizes.",
        "Gate the route to development only.",
      ],
      acceptance: ["All design-system components visible with their prop matrix."],
    }),
  },

  /* ----------------------------- M3 ----------------------------- */
  {
    title: "Docker Compose for PostgreSQL",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p0"],
    type: "chore",
    slug: "docker-postgres",
    body: body({
      summary: "Provide a one-command local PostgreSQL via Docker Compose.",
      tasks: [
        "Add `docker-compose.yml` with a `postgres` service, named volume and healthcheck.",
        "Expose port and credentials via env; document in `.env.example`.",
        "Add `db:up` / `db:down` npm scripts.",
      ],
      acceptance: [
        "`docker compose up -d` starts Postgres and Prisma can connect.",
        "Data persists across restarts via the volume.",
      ],
    }),
  },
  {
    title: "Prisma setup & client singleton",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p0"],
    type: "chore",
    slug: "prisma-setup",
    body: body({
      summary: "Install Prisma and expose a hot-reload-safe client singleton.",
      tasks: [
        "Init Prisma, point `datasource` at `DATABASE_URL`.",
        "Create `src/lib/prisma.ts` with a global singleton to avoid dev connection leaks.",
        "Add `db:migrate`, `db:studio`, `db:generate` scripts.",
      ],
      acceptance: [
        "`prisma generate` works; client imported via `@/lib/prisma`.",
        "No duplicate clients in dev.",
      ],
    }),
  },
  {
    title: "Prisma schema: User, Pin, Board, Save, Follow, Category",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p0"],
    type: "feature",
    slug: "prisma-schema",
    body: body({
      summary: "Model the full domain so localStorage state becomes real persistence.",
      context: "Replaces the mock model in `data.jsx` and the localStorage state in `app.jsx`.",
      tasks: [
        "`User` (id, email unique, passwordHash nullable, name, avatarUrl, gender, followersCount, verified).",
        "`Pin` (id, title, description, imageUrl, width, height, link, categoryId, creatorId, createdAt).",
        "`Category` (id, slug, label, imageUrl).",
        "`Board` (id, name, ownerId, isDefault) with `BoardPin` join (boardId, pinId).",
        "`Save` (userId, pinId, unique pair).",
        "`Follow` (followerId, creatorId, unique pair).",
        "Relations, indexes and `onDelete` behavior; OAuth/session tables if required by the adapter.",
      ],
      acceptance: [
        "`prisma migrate dev` creates all tables and constraints.",
        "Unique constraints prevent duplicate saves/follows.",
      ],
    }),
  },
  {
    title: "Seed script from the design handoff data",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p0"],
    type: "feature",
    slug: "prisma-seed",
    body: body({
      summary: "Seed creators, pins, categories and inspiration from the handoff `data.jsx`.",
      tasks: [
        "Map the 4 creators to `User`, the 15 pins to `Pin`, the 8 categories to `Category`.",
        "Create a demo user with a default 'Quick Saves' board and a couple of seeded saves/follows.",
        "Make the seed idempotent (`upsert`).",
        "Wire `prisma.seed` in `package.json`.",
      ],
      acceptance: [
        "`npx prisma db seed` populates a browsable dataset matching the mockups.",
        "Re-running the seed does not duplicate rows.",
      ],
    }),
  },
  {
    title: "Image assets pipeline (handoff images → public)",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p1"],
    type: "chore",
    slug: "image-assets",
    body: body({
      summary: "Bring the handoff images into the app and reference them from seeded data.",
      tasks: [
        "Copy `design_handoff_mosaic/images/*` into `public/images`.",
        "Reference these paths from the seed.",
        "Configure `next/image` (sizes, remote patterns if needed).",
      ],
      acceptance: ["Seeded pins render their images via `next/image`."],
    }),
  },
  {
    title: "Services layer & error/response conventions",
    milestone: "M3",
    labels: ["type:infra", "area:backend", "priority:p1"],
    type: "feature",
    slug: "services-layer",
    body: body({
      summary: "Establish the data-access services and a consistent result/error shape.",
      tasks: [
        "Create `src/server/services/{pins,users,boards,saves,follows}.ts` with typed query functions.",
        "Define a `Result<T>`/error convention and a domain error type.",
        "Map Prisma rows to `src/types` domain types.",
      ],
      acceptance: [
        "Components/actions never import Prisma directly.",
        "Services return domain types, not Prisma models.",
      ],
    }),
  },

  /* ----------------------------- M4 ----------------------------- */
  {
    title: "Auth.js (NextAuth) setup with Prisma adapter",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p0"],
    type: "feature",
    slug: "authjs-setup",
    body: body({
      summary: "Install and configure Auth.js with the Prisma adapter and session strategy.",
      tasks: [
        "Configure the Auth.js handler/route, secret and session strategy.",
        "Wire the Prisma adapter and required tables.",
        "Expose a typed `auth()` helper for server components/actions.",
      ],
      acceptance: [
        "Sessions persist and are readable server-side.",
        "Types for the session user are extended (id, avatar).",
      ],
    }),
  },
  {
    title: "Credentials provider (email/password + bcrypt)",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p0"],
    type: "feature",
    slug: "credentials-provider",
    body: body({
      summary: "Email/password authentication with hashed passwords.",
      tasks: [
        "Add the Credentials provider validating against `User.passwordHash`.",
        "Hash with bcrypt on registration; verify on login.",
        "Validate inputs with Zod; return safe errors.",
      ],
      acceptance: [
        "Valid credentials sign in; invalid ones are rejected without leaking which field failed.",
        "Passwords are never stored or logged in plaintext.",
      ],
    }),
  },
  {
    title: "OAuth providers ready (Google/Apple scaffolding)",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p2"],
    type: "feature",
    slug: "oauth-providers",
    body: body({
      summary: "Wire Google and Apple providers, enabled by env presence.",
      tasks: [
        "Add provider configs reading client id/secret from validated env.",
        "Conditionally enable providers only when configured.",
        "Document how to obtain credentials in `.env.example`.",
      ],
      acceptance: [
        "'Continue with Google/Apple' buttons trigger the OAuth flow when configured.",
        "App boots fine when OAuth env is absent.",
      ],
    }),
  },
  {
    title: "Register & login server actions with validation",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p0"],
    type: "feature",
    slug: "auth-actions",
    body: body({
      summary: "Server actions for account creation and sign-in used by the auth UI.",
      tasks: [
        "`register({ email, password, age })` → create user, default board, sign in.",
        "Zod schemas for all inputs; typed field-level errors returned to the form.",
        "Persist onboarding gender on the user.",
      ],
      acceptance: [
        "Duplicate email returns a friendly error.",
        "Successful registration creates the default 'Quick Saves' board.",
      ],
    }),
  },
  {
    title: "Sign-up screen UI",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p0"],
    type: "feature",
    slug: "sign-up-screen",
    body: body({
      summary: "Recreate the sign-up screen (handoff `auth.jsx` step 1).",
      context: "Two-column layout: left visual mosaic, right form (max-width 480px).",
      tasks: [
        "Build the right-side form: brand, H1 'Find your next idea', Email/Password/Age fields, accent 'Continue', 'OR', Google/Apple social buttons, legal text, 'Log in' link.",
        "Build the left visual mosaic panel (3 columns, rotated, gradient overlay); hidden on mobile.",
        "Reuse Input/Button/Avatar/Icon components only.",
        "Wire the form to the register action.",
      ],
      acceptance: [
        "Pixel-faithful to the mockup on desktop; form full-width on mobile.",
        "Validation errors render inline.",
      ],
    }),
  },
  {
    title: "Onboarding gender step UI",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p1"],
    type: "feature",
    slug: "onboarding-gender",
    body: body({
      summary: "Recreate the onboarding gender step (handoff `auth.jsx` step 2).",
      tasks: [
        "Four full-width pill options (Female/Male/Non-binary/Prefer not to say).",
        "'Next' disabled until a choice is made; selected = dark fill.",
        "Persist the choice via the register/onboarding action.",
      ],
      acceptance: ["Selecting an option enables 'Next'.", "Gender is stored on the user."],
    }),
  },
  {
    title: "Login screen UI",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p1"],
    type: "feature",
    slug: "login-screen",
    body: body({
      summary: "Login screen reusing the auth layout for returning users.",
      tasks: [
        "Email/password form wired to the credentials sign-in.",
        "Link back to sign-up; error display on bad credentials.",
      ],
      acceptance: ["Valid users sign in and land on Home."],
    }),
  },
  {
    title: "Session, route protection & middleware",
    milestone: "M4",
    labels: ["type:feature", "area:auth", "priority:p0"],
    type: "feature",
    slug: "route-protection",
    body: body({
      summary: "Protect the authenticated app shell and redirect appropriately.",
      tasks: [
        "Add middleware redirecting unauthenticated users from `(main)` to login.",
        "Redirect authenticated users away from auth pages.",
        "Expose the current user to server components.",
      ],
      acceptance: [
        "Unauthenticated access to Home redirects to login.",
        "Signed-in users skip the auth screens.",
      ],
    }),
  },

  /* ----------------------------- M5 ----------------------------- */
  {
    title: "App shell layout for the (main) route group",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "app-shell",
    body: body({
      summary:
        "Authenticated layout wrapping all main routes with the sticky TopNav and modal slot.",
      tasks: [
        "Create `(main)/layout.tsx` rendering TopNav, page content and the `@modal` parallel-route slot.",
        "Provide page padding per the handoff (16px 24px 80px).",
        "Mount the ToastProvider here.",
      ],
      acceptance: ["All main pages share the nav, padding and toast host."],
    }),
  },
  {
    title: "TopNav component",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "top-nav",
    body: body({
      summary: "Sticky top navigation (handoff `components.jsx` TopNav).",
      context:
        "80px height, sticky, translucent blurred background, brand + tabs + search + action icons.",
      tasks: [
        "Brand (logo + 'Mosaic'), Home/Saved pills, central search input, action icons (Create, Bell with dot, Stack, Avatar).",
        "Active tab reflects the current route; typing in search navigates to `/search`.",
        "Use Pill, IconButton, Avatar and Icon components.",
      ],
      acceptance: [
        "Matches the mockup; stays visible on scroll.",
        "Search focus/typing routes to search and syncs the query.",
      ],
    }),
  },
  {
    title: "useColumns responsive masonry hook",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "use-columns",
    body: body({
      summary: "Hook computing masonry column count from viewport width.",
      context: "Ported from `useColumns` in `components.jsx`.",
      tasks: [
        "Params `min`, `gap`, `pad`; recompute on resize; never below 2 columns.",
        "Clean up the resize listener; debounce if needed.",
      ],
      acceptance: [
        "Columns recalculate on resize matching the handoff math.",
        "Unit-tested with mocked widths.",
      ],
    }),
  },
  {
    title: "Masonry component",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "masonry",
    body: body({
      summary: "Masonry grid laying out pin cards using `useColumns`.",
      tasks: [
        "Accept `pins`, `min` and render PinCards in a CSS column layout (gap 16px).",
        "Avoid column-break inside a card.",
      ],
      acceptance: ["Feed/search/board reuse Masonry with different `min` values."],
    }),
  },
  {
    title: "PinCard component",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "pin-card",
    body: body({
      summary: "Pin card with hover overlay, Save/Share and author meta (handoff PinCard).",
      tasks: [
        "Image with 16px radius and `next/image`; hover overlay (black 28%).",
        "Top-right 'More' round button; bottom Save (accent→dark when saved) + Share round button.",
        "Optional count badge (top-left, blurred dark).",
        "Below image: title (15/600) and author (avatar 22 + name).",
        "Clicking the card opens the detail overlay; action buttons stop propagation.",
      ],
      acceptance: [
        "Hover and saved states match the mockup.",
        "Save toggles and triggers the toast.",
      ],
    }),
  },
  {
    title: "Home feed page (server-rendered pins)",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p0"],
    type: "feature",
    slug: "home-feed",
    body: body({
      summary: "Home route fetching pins from the database and rendering the masonry feed.",
      tasks: [
        "Server Component fetching pins via the pins service.",
        "Render Masonry; add a loading skeleton via Suspense.",
        "Annotate each card with the current user's saved state.",
      ],
      acceptance: [
        "Home renders real seeded pins in a responsive masonry.",
        "Saved pins show the 'Saved' state on load.",
      ],
    }),
  },
  {
    title: "Floating action button (FAB)",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "priority:p2"],
    type: "feature",
    slug: "fab",
    body: body({
      summary: "Fixed bottom-right FAB to create a pin, shown on Home and Board.",
      tasks: [
        "64px white circle with shadow and Plus icon, linking to `/create`.",
        "Hidden on routes where it does not apply.",
      ],
      acceptance: ["FAB visible on Home/Board and navigates to Create."],
    }),
  },
  {
    title: "Save / unsave server action with optimistic UI + toast",
    milestone: "M5",
    labels: ["type:feature", "area:feed", "area:backend", "priority:p0"],
    type: "feature",
    slug: "save-action",
    body: body({
      summary: "Persist saves and reflect them instantly with optimistic UI and a toast.",
      context: "Replaces the localStorage `savedIds` toggle from `app.jsx`.",
      tasks: [
        "`toggleSave(pinId)` server action upserting/deleting a `Save` for the current user.",
        "Optimistic update on PinCard/Detail; revalidate affected routes.",
        "Show 'Saved to Quick Saves' toast with thumbnail and 'View' → Board.",
      ],
      acceptance: [
        "Saving persists across reloads.",
        "UI updates instantly and rolls back on error.",
        "Toast appears and links to the board.",
      ],
    }),
  },

  /* ----------------------------- M6 ----------------------------- */
  {
    title: "Search page route & enlarged search bar",
    milestone: "M6",
    labels: ["type:feature", "area:search", "priority:p0"],
    type: "feature",
    slug: "search-page",
    body: body({
      summary: "Search route with the enlarged search bar (camera icon) and content states.",
      tasks: [
        "Build `/search` with the big search bar (56px, max-width 920px) and a visual-search camera button.",
        "Switch between the discovery view (no query) and results view (query).",
        "Read/write the query via the URL.",
      ],
      acceptance: ["Search bar autofocuses; query persists in the URL."],
    }),
  },
  {
    title: "Category grid",
    milestone: "M6",
    labels: ["type:feature", "area:search", "priority:p1"],
    type: "feature",
    slug: "category-grid",
    body: body({
      summary: "Four-column category cards shown when there is no query.",
      tasks: [
        "Card: background image + dark left gradient + bottom-left white label (21/700), 150px tall, radius 18.",
        "Clicking a category sets the query to its label.",
        "Fetch categories from the database.",
      ],
      acceptance: ["Grid matches the mockup; clicking filters the feed by that label."],
    }),
  },
  {
    title: "Today's Inspiration rail",
    milestone: "M6",
    labels: ["type:feature", "area:search", "priority:p2"],
    type: "feature",
    slug: "inspiration-rail",
    body: body({
      summary: "Horizontal snap-scroll carousel of inspiration cards.",
      tasks: [
        "Cards 340px wide, image 230px tall, caption overlay; horizontal snap scrolling.",
        "Clicking a card opens the pin detail.",
      ],
      acceptance: ["Rail scrolls with snap; cards open the detail overlay."],
    }),
  },
  {
    title: "Live search filtering + empty state",
    milestone: "M6",
    labels: ["type:feature", "area:search", "priority:p0"],
    type: "feature",
    slug: "search-filtering",
    body: body({
      summary: "Filter pins live by title, category and creator with a friendly empty state.",
      context: "Replaces the client-side filter in `SearchScreen`.",
      tasks: [
        "Query pins server-side by title/category/creator name (case-insensitive).",
        "Render results in Masonry (min 200) or an empty message quoting the query.",
        "Debounce input and sync to the URL (`?q=`).",
      ],
      acceptance: [
        "Typing filters results; clearing returns to discovery.",
        "No-result message matches the mockup.",
      ],
    }),
  },

  /* ----------------------------- M7 ----------------------------- */
  {
    title: "Pin detail overlay via intercepting route",
    milestone: "M7",
    labels: ["type:feature", "area:detail", "priority:p0"],
    type: "feature",
    slug: "detail-route",
    body: body({
      summary:
        "Open pin detail as an overlay using parallel/intercepting routes, with a real page fallback.",
      context: "Clicking a pin opens an overlay; deep-linking `/pin/[id]` renders a full page.",
      tasks: [
        "Add `@modal/(.)pin/[id]` intercepting route plus a standalone `/pin/[id]` page.",
        "Scrim (black 55%), centered card (max-width 1016, radius 32), close on Esc or scrim click.",
        "Fixed close button (top-left white circle).",
      ],
      acceptance: [
        "In-app pin clicks open the overlay; direct URL renders the full page.",
        "Esc and scrim click close the overlay and restore the feed.",
      ],
    }),
  },
  {
    title: "Detail layout: media + info panel",
    milestone: "M7",
    labels: ["type:feature", "area:detail", "priority:p0"],
    type: "feature",
    slug: "detail-layout",
    body: body({
      summary: "Two-column detail content (handoff `DetailScreen`).",
      tasks: [
        "Left: image covering full height; right pane (padding 30/36).",
        "Actions row: More + Share left; Visit + Save (accent→dark) right.",
        "Breadcrumb link, H1 title (30/800), description.",
        "Fetch the pin and creator from the database.",
      ],
      acceptance: ["Detail matches the mockup and reflects live save state."],
    }),
  },
  {
    title: "Creator row + Follow action",
    milestone: "M7",
    labels: ["type:feature", "area:detail", "area:backend", "priority:p0"],
    type: "feature",
    slug: "follow-action",
    body: body({
      summary: "Creator row with a persistent Follow/Following toggle.",
      context: "Replaces the localStorage `follows` toggle from `app.jsx`.",
      tasks: [
        "Avatar 48 + name + followers + Follow button.",
        "`toggleFollow(creatorId)` server action with unique constraint; optimistic UI.",
        "Follow=surface, Following=dark text white.",
      ],
      acceptance: [
        "Follow persists across reloads.",
        "Button reflects state instantly and rolls back on error.",
      ],
    }),
  },
  {
    title: "'More like creator' suggestions",
    milestone: "M7",
    labels: ["type:feature", "area:detail", "priority:p2"],
    type: "feature",
    slug: "more-like-creator",
    body: body({
      summary: "Suggested creators grid under the divider on the detail view.",
      tasks: [
        "Three mini-creator cards (avatar 68, name, followers, Follow).",
        "Each Follow toggles independently and persists.",
      ],
      acceptance: ["Suggestions render and follow toggles work."],
    }),
  },

  /* ----------------------------- M8 ----------------------------- */
  {
    title: "Board page (Quick Saves) layout & tools",
    milestone: "M8",
    labels: ["type:feature", "area:boards", "priority:p0"],
    type: "feature",
    slug: "board-page",
    body: body({
      summary: "Quick Saves board screen (handoff `BoardScreen`).",
      tasks: [
        "Centered header 'Quick Saves' (52/800).",
        "Three tools row: More ideas / Organize / Notes (72px square + label).",
        "Pin count bar + filter button.",
      ],
      acceptance: ["Header, tools and count bar match the mockup."],
    }),
  },
  {
    title: "Board collaborators avatar stack",
    milestone: "M8",
    labels: ["type:feature", "area:boards", "priority:p2"],
    type: "feature",
    slug: "board-collaborators",
    body: body({
      summary: "Overlapping collaborator avatars with an add button.",
      tasks: ["Stacked avatars (negative margin, white border) + '+' add button."],
      acceptance: ["Avatar stack renders as in the mockup."],
    }),
  },
  {
    title: "Saved pins grid + empty state",
    milestone: "M8",
    labels: ["type:feature", "area:boards", "area:backend", "priority:p0"],
    type: "feature",
    slug: "saved-grid",
    body: body({
      summary: "Render the current user's saved pins from the database, or an empty state.",
      tasks: [
        "Fetch saved pins via the saves service; render Masonry (min 230).",
        "Empty state message matching the mockup when there are no saves.",
      ],
      acceptance: [
        "Saved pins appear here after saving from the feed/detail.",
        "Empty state shows when nothing is saved.",
      ],
    }),
  },
  {
    title: "Boards CRUD (create board, add pin to board)",
    milestone: "M8",
    labels: ["type:feature", "area:boards", "area:backend", "priority:p1"],
    type: "feature",
    slug: "boards-crud",
    body: body({
      summary: "Create boards and assign pins to them beyond the default Quick Saves.",
      tasks: [
        "Server actions: `createBoard(name)`, `addPinToBoard(pinId, boardId)`, `removePinFromBoard`.",
        "Default board auto-created at registration; saving adds to Quick Saves.",
        "Validation and ownership checks.",
      ],
      acceptance: [
        "A user can create a board and move a pin into it.",
        "Only the owner can modify their boards.",
      ],
    }),
  },

  /* ----------------------------- M9 ----------------------------- */
  {
    title: "Create Pin page layout",
    milestone: "M9",
    labels: ["type:feature", "area:create", "priority:p0"],
    type: "feature",
    slug: "create-page",
    body: body({
      summary: "Create Pin screen (handoff `CreateScreen`).",
      tasks: [
        "Two-column layout (max-width 760): left upload zone, right fields (Title/Description/Link/Board) + Publish.",
        "Reuse Input/Button components.",
      ],
      acceptance: ["Layout matches the mockup; Publish is full-width accent."],
    }),
  },
  {
    title: "Image upload drop zone with preview",
    milestone: "M9",
    labels: ["type:feature", "area:create", "priority:p0"],
    type: "feature",
    slug: "upload-dropzone",
    body: body({
      summary: "Dashed drop zone supporting click and drag-and-drop with live preview.",
      tasks: [
        "Accept images, validate type/size, show a preview, allow replacing.",
        "Read intrinsic width/height for the pin record.",
      ],
      acceptance: [
        "Selecting or dropping an image shows a preview.",
        "Invalid files are rejected with a message.",
      ],
    }),
  },
  {
    title: "Image storage abstraction (local disk, S3-ready)",
    milestone: "M9",
    labels: ["type:infra", "area:create", "area:backend", "priority:p1"],
    type: "feature",
    slug: "storage-abstraction",
    body: body({
      summary: "A small storage interface so local uploads can be swapped for S3 later.",
      tasks: [
        "Define a `Storage` interface (`put`, `url`); implement a local-disk adapter writing to `public/uploads`.",
        "Wire the adapter selection via env.",
        "Validate and sanitize filenames/content types.",
      ],
      acceptance: [
        "Uploaded files are stored and served via a stable URL.",
        "Switching adapters requires no caller changes.",
      ],
    }),
  },
  {
    title: "Create pin server action (persist + redirect)",
    milestone: "M9",
    labels: ["type:feature", "area:create", "area:backend", "priority:p0"],
    type: "feature",
    slug: "create-pin-action",
    body: body({
      summary: "Persist a new pin from the create form and route to the board.",
      tasks: [
        "`createPin({ title, description, link, boardId, image })` storing the image and Pin row.",
        "Zod validation; associate creator = current user.",
        "Revalidate feed/board and redirect to Board.",
      ],
      acceptance: [
        "Publishing creates a pin visible in the feed and board.",
        "Validation errors render inline.",
      ],
    }),
  },

  /* ----------------------------- M10 ---------------------------- */
  {
    title: "GSAP setup with useGSAP and reduced-motion support",
    milestone: "M10",
    labels: ["type:feature", "area:animation", "priority:p1"],
    type: "feature",
    slug: "gsap-setup",
    body: body({
      summary: "Install GSAP and establish the React integration and accessibility baseline.",
      context:
        "Use `@gsap/react` `useGSAP`; honor `prefers-reduced-motion` via `gsap.matchMedia()`.",
      tasks: [
        "Install `gsap` and `@gsap/react`; register plugins centrally.",
        "Create an animation utilities module and a reduced-motion guard.",
        "Document the animation approach in `docs/`.",
      ],
      acceptance: [
        "Animations are disabled/simplified when reduced motion is requested.",
        "`useGSAP` cleans up on unmount (no leaks).",
      ],
    }),
  },
  {
    title: "Feed entrance stagger animation",
    milestone: "M10",
    labels: ["type:feature", "area:animation", "priority:p2"],
    type: "feature",
    slug: "feed-stagger",
    body: body({
      summary: "Animate pin cards into view with a staggered fade/slide on load.",
      tasks: [
        "Stagger PinCards on first paint; use transforms only for performance.",
        "Respect reduced motion.",
      ],
      acceptance: ["Feed cards animate in smoothly at 60fps without layout jank."],
    }),
  },
  {
    title: "Pin detail overlay open/close transition (Flip)",
    milestone: "M10",
    labels: ["type:feature", "area:animation", "priority:p1"],
    type: "feature",
    slug: "detail-flip",
    body: body({
      summary: "Smoothly animate opening/closing the pin detail overlay.",
      tasks: [
        "Animate scrim fade and card scale/position on open and close.",
        "Optionally use the Flip plugin to morph from card to overlay.",
        "Ensure Esc/scrim close run the exit animation.",
      ],
      acceptance: [
        "Overlay opens and closes with a polished transition; reduced motion falls back to a fade.",
      ],
    }),
  },
  {
    title: "Toast slide animation",
    milestone: "M10",
    labels: ["type:feature", "area:animation", "priority:p2"],
    type: "feature",
    slug: "toast-animation",
    body: body({
      summary: "Animate the toast enter/exit (translateY 20→0, fade, 0.25s).",
      tasks: ["Drive enter/exit with GSAP; coordinate with the 3.2s auto-dismiss."],
      acceptance: ["Toast slides up on show and out on dismiss matching the spec."],
    }),
  },
  {
    title: "Auth mosaic background animation",
    milestone: "M10",
    labels: ["type:feature", "area:animation", "priority:p2"],
    type: "feature",
    slug: "auth-mosaic-animation",
    body: body({
      summary: "Subtle motion on the auth screen image mosaic.",
      tasks: ["Add a slow parallax/drift to the rotated mosaic; respect reduced motion."],
      acceptance: ["Auth visual feels alive without distracting from the form."],
    }),
  },

  /* ----------------------------- M11 ---------------------------- */
  {
    title: "Vitest + React Testing Library setup",
    milestone: "M11",
    labels: ["type:test", "area:ci", "priority:p0"],
    type: "chore",
    slug: "vitest-setup",
    body: body({
      summary: "Configure the unit test runner for components, hooks and services.",
      tasks: [
        "Add Vitest, RTL, jsdom and a setup file; add `test` and `test:watch` scripts.",
        "Configure path aliases and coverage.",
      ],
      acceptance: ["`npm test` runs an example component test successfully."],
    }),
  },
  {
    title: "Unit tests for design-system components",
    milestone: "M11",
    labels: ["type:test", "area:design-system", "priority:p1"],
    type: "test",
    slug: "ds-unit-tests",
    body: body({
      summary: "Cover Button, Avatar, Input, Pill, Toast and useColumns with unit tests.",
      tasks: [
        "Test variants/sizes, disabled/loading, avatar fallback/badge, toast lifecycle.",
        "Test `useColumns` math with mocked widths.",
      ],
      acceptance: ["Critical design-system behavior is covered and green in CI."],
    }),
  },
  {
    title: "Unit tests for services & server actions",
    milestone: "M11",
    labels: ["type:test", "area:backend", "priority:p1"],
    type: "test",
    slug: "backend-unit-tests",
    body: body({
      summary: "Test save/follow/create logic against a test database or mocked Prisma.",
      tasks: [
        "Cover toggleSave, toggleFollow, createPin, register including unique-constraint paths.",
        "Use a transactional/test database or Prisma mock.",
      ],
      acceptance: ["Core mutations are covered including duplicate/error cases."],
    }),
  },
  {
    title: "Playwright setup & critical e2e flows",
    milestone: "M11",
    labels: ["type:test", "area:ci", "priority:p1"],
    type: "test",
    slug: "playwright-e2e",
    body: body({
      summary: "End-to-end coverage for the most important user journeys.",
      tasks: [
        "Configure Playwright with a seeded test database and a base URL.",
        "Flows: sign-up/login, save a pin → appears on board, search filtering, open/close detail, create a pin.",
      ],
      acceptance: ["e2e suite runs locally and in CI against a seeded app."],
    }),
  },
  {
    title: "GitHub Actions CI (lint, typecheck, test, build)",
    milestone: "M11",
    labels: ["type:infra", "area:ci", "priority:p0"],
    type: "chore",
    slug: "github-actions-ci",
    body: body({
      summary: "Continuous integration running all quality gates on PRs and main.",
      tasks: [
        "Workflow: install, lint, typecheck, unit test, build.",
        "Spin up a Postgres service container; run migrations/seed for e2e.",
        "Cache npm; run e2e in a separate job.",
      ],
      acceptance: [
        "PRs are blocked unless lint, typecheck, unit tests and build pass.",
        "e2e job runs against a real Postgres service.",
      ],
    }),
  },

  /* ----------------------------- M12 ---------------------------- */
  {
    title: "Production Dockerfile & compose",
    milestone: "M12",
    labels: ["type:infra", "area:deploy", "priority:p1"],
    type: "chore",
    slug: "production-docker",
    body: body({
      summary: "Containerize the app for production with a multi-stage build.",
      tasks: [
        "Multi-stage Dockerfile (deps → build → runtime) using Next standalone output.",
        "Production `docker-compose` wiring app + Postgres.",
        "Run migrations on startup.",
      ],
      acceptance: ["`docker compose -f docker-compose.prod.yml up` serves the built app."],
    }),
  },
  {
    title: "Deployment configuration & docs",
    milestone: "M12",
    labels: ["type:docs", "area:deploy", "priority:p2"],
    type: "docs",
    slug: "deployment-docs",
    body: body({
      summary: "Document how to deploy (Vercel and self-hosted) and configure env.",
      tasks: [
        "Document required env vars and database provisioning.",
        "Provide Vercel and self-host instructions; note migration steps.",
      ],
      acceptance: ["A new engineer can deploy by following the docs."],
    }),
  },
  {
    title: "Accessibility pass",
    milestone: "M12",
    labels: ["type:chore", "area:deploy", "priority:p1"],
    type: "chore",
    slug: "a11y-pass",
    body: body({
      summary: "Audit and fix accessibility across the app.",
      tasks: [
        "Keyboard navigation, focus management for the overlay, ARIA labels on icon buttons.",
        "Color-contrast and image alt-text checks; run an automated a11y audit.",
      ],
      acceptance: ["No critical a11y violations; overlay traps and restores focus correctly."],
    }),
  },
  {
    title: "Responsive QA pass",
    milestone: "M12",
    labels: ["type:chore", "area:deploy", "priority:p1"],
    type: "chore",
    slug: "responsive-qa",
    body: body({
      summary: "Verify and fix responsive behavior from mobile to wide desktop.",
      tasks: [
        "Validate masonry columns, nav, auth layout and overlay at key breakpoints.",
        "Fix overflow and tap-target issues on mobile.",
      ],
      acceptance: ["Layouts hold from ~360px to ~1600px without breakage."],
    }),
  },
];
