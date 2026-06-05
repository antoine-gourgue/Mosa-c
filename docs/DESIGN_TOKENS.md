# Design tokens

Sourced from the design handoff. These map to the Tailwind theme and CSS variables.

## Colors

| Token           | Value                          | Usage                          |
| --------------- | ------------------------------ | ------------------------------ |
| `--bg`          | `#ffffff`                      | App background                 |
| `--ink`         | `#1a1a1a`                      | Primary text / dark surfaces   |
| `--ink-soft`    | `#6b6b6b`                      | Secondary text                 |
| `--ink-faint`   | `#9a9a9a`                      | Tertiary text                  |
| `--surface`     | `#efefef`                      | Inputs, neutral fills          |
| `--surface-2`   | `#e6e6e6`                      | Hover fills                    |
| `--surface-3`   | `#dadada`                      | Borders on fills               |
| `--line`        | `#e9e9e9`                      | Dividers                       |
| `--accent`      | `oklch(0.55 0.21 22)` ≈ `#e60023` | Primary action (red)        |
| `--accent-press`| `oklch(0.48 0.21 22)`          | Pressed accent                 |

## Layout

| Token          | Value   | Usage                       |
| -------------- | ------- | --------------------------- |
| `--nav-h`      | `80px`  | Top navigation height       |
| `--radius-pin` | `16px`  | Pin image radius            |
| `--radius-lg`  | `24px`  | Large surfaces              |

## Shadow

```
--shadow-pop: 0 1px 2px rgba(0,0,0,.06), 0 12px 28px rgba(0,0,0,.16)
```

## Typography

```
--font: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif
```

| Element        | Size / weight |
| -------------- | ------------- |
| Brand          | 21px / 700    |
| Page title     | 52px / 800    |
| Detail title   | 30px / 800    |
| Pin title      | 15px / 600    |
| Author / meta  | 13px          |
| Legal text     | 12px          |

## Masonry

- Minimum column width: `220px` (feed), `200px` (search results), `230px` (board).
- Gap: `16px`. Columns computed dynamically from viewport width, never below 2.

## Interaction

- Pin hover overlay: black `28%`, transitions `0.15s`.
- Toast: bottom `28px`, centered, dark `#1a1a1a`, auto-dismiss after `3.2s`, enter `translateY(20px)→0` over `0.25s`.
- Follow states: `Follow` (`--surface`) → `Following` (`--ink`, white text).
- Save states: `Save` (`--accent`) → `Saved` (`--ink`).
