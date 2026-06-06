# Changelog

## [1.0.1](https://github.com/antoine-gourgue/Mosa-c/compare/v1.0.0...v1.0.1) (2026-06-06)


### Documentation

* add the Mosaic logo to the README ([d5f0d95](https://github.com/antoine-gourgue/Mosa-c/commit/d5f0d9523a815164b0b7499244d1236615259da5))

## 1.0.0 (2026-06-06)

First stable release of Mosaic — a Pinterest-style image board built with
Next.js, Prisma and Auth.js.

### Features

- **Authentication**: email/password and Google sign-in with JWT sessions.
- **Pins**: create (with client-side image compression), view, download and
  delete, with like, comment and download counters.
- **Boards**: full CRUD, a default Quick Saves board, save-to-board and
  multi-user collaboration.
- **Social**: follow creators, a notifications inbox and follower counts.
- **Discovery**: home feed with For You / Following tabs, engagement sorting
  and infinite scroll, plus search with sorting.
- **Navigation**: responsive shell with a desktop top bar and a mobile bottom
  navigation bar.
- **Storage**: Supabase Storage for uploaded images.
- **Analytics**: optional Umami integration.

### Operations

- Continuous integration (lint, typecheck, unit, e2e and accessibility tests)
  and continuous deployment to a self-hosted VPS via Docker.
