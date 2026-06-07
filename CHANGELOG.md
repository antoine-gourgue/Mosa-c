# Changelog

## [1.6.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.5.0...v1.6.0) (2026-06-07)


### Features

* **messages:** conversation schema and data layer ([63cdf96](https://github.com/antoine-gourgue/Mosa-c/commit/63cdf96a80ed6eff4792287188ec0af0353ad30f))
* **messages:** inbox polish — no page scroll, skeletons, date separators, swipe to reveal time ([64cd490](https://github.com/antoine-gourgue/Mosa-c/commit/64cd490a434270ffeb858682f7714ccca887c080))
* **messages:** inbox ui (conversation list, chat, composer) ([9f9ce63](https://github.com/antoine-gourgue/Mosa-c/commit/9f9ce63eae7fcad917b2a99f89919f5e93cb760e))
* **messages:** live delivery and typing over the socket ([f1e080d](https://github.com/antoine-gourgue/Mosa-c/commit/f1e080d183167fdb7ba2c4a6775eb773aa1b2ac6))
* **messages:** message requests (accept/decline) for non-followers ([bf1f524](https://github.com/antoine-gourgue/Mosa-c/commit/bf1f5249bbda81f2b603531646abeabf2778dff5))
* **messages:** messages entry in the mobile top bar ([2ba8f97](https://github.com/antoine-gourgue/Mosa-c/commit/2ba8f9789764b42c4092e7fc4194d2cec0b5eaa8))
* **messages:** online presence and last-active ([ddfed24](https://github.com/antoine-gourgue/Mosa-c/commit/ddfed24620d5cc81a268db988352749151c482a2))
* **messages:** socket.io realtime service ([bfc64d1](https://github.com/antoine-gourgue/Mosa-c/commit/bfc64d15db0fbead7b4eff16f85330355e8e0df2))
* **messages:** unread badge, profile entry and gating ([2299741](https://github.com/antoine-gourgue/Mosa-c/commit/2299741a25280d29615c1564d2eca2cc5f77e70c))

## [1.5.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.4.0...v1.5.0) (2026-06-07)


### Features

* **profile:** liked pins tab ([30e209c](https://github.com/antoine-gourgue/Mosa-c/commit/30e209c77c48b3416e25be6af883775b52a0298f))

## [1.4.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.3.0...v1.4.0) (2026-06-07)


### Features

* **detail:** sync pin engagement between the grid and the detail modal ([f982956](https://github.com/antoine-gourgue/Mosa-c/commit/f9829568a44cae61bbc94e6813dd1495b2447aa6))
* **feed:** quick like on pin card hover ([e385e0d](https://github.com/antoine-gourgue/Mosa-c/commit/e385e0d91c8a3dbd984d99ddcbc0047afdf22489))


### Bug Fixes

* **detail:** remove duplicate share action from pin menus ([c587f24](https://github.com/antoine-gourgue/Mosa-c/commit/c587f24ef7f6b3301e811850bee6a7ac7e55b316))

## [1.3.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.2.1...v1.3.0) (2026-06-07)


### Features

* **comments:** emoji reactions on comments ([9a96466](https://github.com/antoine-gourgue/Mosa-c/commit/9a964669cbb83ca37c25314ee5eac2d02c16ffe1))
* **comments:** mention users with @ autocomplete ([28bf634](https://github.com/antoine-gourgue/Mosa-c/commit/28bf63420c9c48fddef7acfc89c8dab1de6d79f9))
* **comments:** reply to comments in flat threads ([78eb1be](https://github.com/antoine-gourgue/Mosa-c/commit/78eb1be74352ef18907d5b65331119e5ee5b8bfa))

## [1.2.1](https://github.com/antoine-gourgue/Mosa-c/compare/v1.2.0...v1.2.1) (2026-06-07)


### Bug Fixes

* **detail:** hide the save action on your own pins ([d80d6f3](https://github.com/antoine-gourgue/Mosa-c/commit/d80d6f30522cd653bd1128bd0428af8ac843b981))

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
