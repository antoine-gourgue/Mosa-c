# Architecture

Clean, layered architecture. Pages/route handlers stay thin and delegate to the server layer; UI is a reusable design system.

## Folder structure

```
mosaic/
├── docker-compose.yml          # PostgreSQL service
├── Dockerfile                  # Production app image
├── .env.example
├── prisma/
│   ├── schema.prisma           # Data model
│   ├── seed.ts                 # Demo content (from the design handoff)
│   └── migrations/
├── public/
│   ├── images/                 # Seeded pin/creator images
│   └── uploads/                # User-uploaded images (gitignored)
├── src/
│   ├── app/
│   │   ├── (auth)/             # sign-up, login, onboarding
│   │   ├── (main)/             # authenticated shell with TopNav
│   │   │   ├── page.tsx        # Home feed
│   │   │   ├── search/
│   │   │   ├── boards/[id]/
│   │   │   ├── create/
│   │   │   └── @modal/(.)pin/[id]/   # intercepting route for the detail overlay
│   │   ├── api/                # route handlers (auth, upload, ...)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # design system: Button, Avatar, Input, IconButton, Pill, Toast, Card, Skeleton
│   │   ├── layout/             # TopNav, Fab, AppShell
│   │   ├── pin/                # PinCard, Masonry
│   │   ├── search/             # CategoryGrid, InspirationRail
│   │   └── detail/             # DetailView, CreatorRow, MoreLike
│   ├── hooks/                  # useColumns, useToast, ...
│   ├── lib/                    # prisma client, auth config, env, utils
│   ├── server/
│   │   ├── actions/            # server actions (mutations)
│   │   └── services/           # data-access services (queries)
│   ├── types/                  # shared domain types
│   ├── icons/                  # typed SVG icon components
│   └── styles/                 # tokens
├── tests/                      # Playwright e2e
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Layers

1. **Presentation** (`app/`, `components/`): rendering and interaction only. Server Components by default; Client Components only when interactivity is required.
2. **Application** (`server/actions`): mutations triggered from the UI, input-validated with Zod, returning typed results.
3. **Domain/data** (`server/services`, `lib`): Prisma queries, mapping to domain types, business rules.
4. **Infrastructure** (`prisma`, `docker`, `lib/env`): database, storage, configuration.

## Rules

- Components never call Prisma directly; they call services or actions.
- All external input is validated with Zod at the boundary.
- Domain types in `src/types` are the contract between layers; Prisma types stay in the data layer.
- Image storage is behind a small abstraction (`lib/storage`) so local disk can be swapped for S3.
