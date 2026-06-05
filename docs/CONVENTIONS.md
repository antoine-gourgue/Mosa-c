# Conventions

## Language & typing

- TypeScript `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`.
- Never use implicit `any`. Prefer precise types, generics and discriminated unions.
- Public functions, components, hooks and types are exported with explicit return types.

## Documentation

- **JSDoc only, in English.** Every exported component, hook, function, type and server action carries a JSDoc block.
- **No inline comments.** `//` line comments and non-JSDoc `/* */` blocks are forbidden. Code must be self-explanatory through naming; rationale goes into JSDoc.
- JSDoc example:

```ts
/**
 * Computes the number of masonry columns for the current viewport width.
 *
 * @param min - Minimum column width in pixels.
 * @param gap - Horizontal gap between columns in pixels.
 * @returns The number of columns, never below 2.
 */
export function useColumns(min: number, gap: number): number {
  /* ... */
}
```

## Components / design system

- Every visual element is a reusable component in `src/components/ui`.
- Configuration is done **through props**, never by duplicating the component:
  - `size`: `"sm" | "md" | "lg"` (or numeric where it makes sense, e.g. `Avatar`).
  - `variant`: semantic style (e.g. `Button` → `"accent" | "ghost" | "dark" | "social"`).
  - `color`, `tone`, `fullWidth`, `disabled`, ... as needed.
- Components are controlled, accessible (ARIA, keyboard) and forward `ref` when wrapping a DOM node.
- Variants are implemented with a typed map (or `cva`-style helper), not ad-hoc conditionals.

## Naming

- Components: `PascalCase` files and exports (`PinCard.tsx`).
- Hooks: `useXxx` in `src/hooks`.
- Server actions: `verbNoun` (`createPin`, `toggleSave`) in `src/server/actions`.
- Types/interfaces: `PascalCase`; no `I` prefix.
- Tailwind: prefer tokens from the theme over arbitrary values.

## Git

- Branch per ticket: `feature/<issue-number>-<slug>`, `fix/...`, `chore/...`.
- Conventional commits: `feat(feed): add masonry column hook`.
- One PR per ticket, `Closes #<n>`, CI green before merge.

## Testing

- Unit: Vitest + React Testing Library for components, hooks, services.
- e2e: Playwright for critical flows (auth, save, search, create).
- A ticket is **Done** only when its acceptance criteria are covered by tests where applicable.
