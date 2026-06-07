# Changelog

## [1.2.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.1.1...v1.2.0) (2026-06-07)


### Features

* **public:** public read-only pins, profiles and landing ([be7660c](https://github.com/antoine-gourgue/Mosa-c/commit/be7660cba42849a4cfcde0b0c880058c4446544f))
* **seo:** add json-ld structured data ([b8f84c6](https://github.com/antoine-gourgue/Mosa-c/commit/b8f84c66e2ec0b79ef3a22e57427eefddfd1f6fc))
* **seo:** add open graph and twitter link previews ([3519e08](https://github.com/antoine-gourgue/Mosa-c/commit/3519e08007c7ecfbdfa67f8a22cff8fe255c862e))
* **seo:** add robots, sitemap and pwa manifest ([8c3bec3](https://github.com/antoine-gourgue/Mosa-c/commit/8c3bec3df26f8d3d1e75425a1e4920af76425eb4))
* **seo:** noindex private routes and add canonical urls ([e9c306f](https://github.com/antoine-gourgue/Mosa-c/commit/e9c306fbb08f3f9bbf346935d3e162551524ecf1))
* **ui:** add error and loading boundaries ([cf3c84b](https://github.com/antoine-gourgue/Mosa-c/commit/cf3c84b924e2822a90912fcf48ed30ce963b34df))


### Bug Fixes

* **seo:** render the sitemap dynamically ([ceaf3fb](https://github.com/antoine-gourgue/Mosa-c/commit/ceaf3fb483dabcfa754b1068812b7b7e7d110579))

## [1.1.1](https://github.com/antoine-gourgue/Mosa-c/compare/v1.1.0...v1.1.1) (2026-06-07)


### Bug Fixes

* **create:** compress images reliably on iOS Safari ([0723ba6](https://github.com/antoine-gourgue/Mosa-c/commit/0723ba6484e63e9eb1343e2a8518b925ff3221be))
* **create:** keep uploads small enough for the server limit on iOS ([7652a06](https://github.com/antoine-gourgue/Mosa-c/commit/7652a06eb3036826ab76a1fd7ae7d5e5c9df0122))

## [1.1.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.0.2...v1.1.0) (2026-06-06)


### Features

* **admin:** add role-based access control foundation ([8c015ed](https://github.com/antoine-gourgue/Mosa-c/commit/8c015ed1d3a744e8a01f82f97739b175de2d531b))
* **admin:** admin shell and dashboard ([f94ac88](https://github.com/antoine-gourgue/Mosa-c/commit/f94ac8892a30d1c3aeebcacae70a5c3de1f8bd73))
* **admin:** category management ([f0b1219](https://github.com/antoine-gourgue/Mosa-c/commit/f0b121911603739f5c64f6ac009399a024c9666d))
* **admin:** content moderation for pins and comments ([b4ce52c](https://github.com/antoine-gourgue/Mosa-c/commit/b4ce52c9b3f71367ae1232aacaed02ce6d1f11dd))
* **admin:** pin detail page and polished detail layouts ([33ae946](https://github.com/antoine-gourgue/Mosa-c/commit/33ae9466ea930a717199307e8c26abc62d728fef))
* **admin:** reports queue ([37caaec](https://github.com/antoine-gourgue/Mosa-c/commit/37caaecf6ef291ed060cf8cbf7751c8a4ea560d5))
* **admin:** user detail page with inline editing ([3783f4a](https://github.com/antoine-gourgue/Mosa-c/commit/3783f4aaa98004d66d5c6c023dece22486ff0cea))
* **admin:** user management ([f995079](https://github.com/antoine-gourgue/Mosa-c/commit/f9950792625dff09b87053e8534e5ebe211ae472))
* **report:** persist pin reports ([3848c18](https://github.com/antoine-gourgue/Mosa-c/commit/3848c1828637970f332a22ceb3f31c922c23df0b))


### Bug Fixes

* **admin:** provide a ToastProvider in the admin layout ([0b270f2](https://github.com/antoine-gourgue/Mosa-c/commit/0b270f241443c368d37c84861837e78b28544617))

## [1.0.2](https://github.com/antoine-gourgue/Mosa-c/compare/v1.0.1...v1.0.2) (2026-06-06)


### Bug Fixes

* **create:** support HEIC/HEIF photo uploads ([ed24c88](https://github.com/antoine-gourgue/Mosa-c/commit/ed24c88992c07c6094d3c4961e9aff7bcd599693))

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
