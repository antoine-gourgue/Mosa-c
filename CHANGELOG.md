# Changelog

## [1.22.1](https://github.com/antoine-gourgue/Mosa-c/compare/v1.22.0...v1.22.1) (2026-06-11)


### Bug Fixes

* **notifications:** keep only the latest like/follow notification ([#387](https://github.com/antoine-gourgue/Mosa-c/issues/387)) ([2d6cd2a](https://github.com/antoine-gourgue/Mosa-c/commit/2d6cd2a683f8ff52d05db7a0cf89b5ab63f3e407))

## [1.22.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.21.0...v1.22.0) (2026-06-11)


### Features

* **interests:** searchable interest picker that scales ([a7ac805](https://github.com/antoine-gourgue/Mosa-c/commit/a7ac805769c9d2fa906aaed2155bb47e57ab6964))
* **settings:** switch toggles and a sticky Save/Reset bar ([9b8d5e5](https://github.com/antoine-gourgue/Mosa-c/commit/9b8d5e5ad62f69778c06ec60bb61559d9f376b8c))


### Bug Fixes

* **create:** compress the image before AI tag analysis ([26a4172](https://github.com/antoine-gourgue/Mosa-c/commit/26a41723bab98efeae116e846404fb3579ccb42b))
* **notifications:** clear the bell badge when the panel opens ([ef7f6f3](https://github.com/antoine-gourgue/Mosa-c/commit/ef7f6f36d5c89349c24823f4c996cc635a412727))
* **notifications:** clear the bell badge when the panel opens ([9388e11](https://github.com/antoine-gourgue/Mosa-c/commit/9388e1100e7eced89d10c83c962ffb9c9d5a6ba2))
* **notifications:** drop the unread tint after opening the panel ([3ed30ef](https://github.com/antoine-gourgue/Mosa-c/commit/3ed30efcb06723f6af41af03d1f2a3f0aad611a8))
* **settings:** harden updateNotificationPrefs against malformed input ([f5e9a2c](https://github.com/antoine-gourgue/Mosa-c/commit/f5e9a2c283af8f660b0db46cf982ada4c75901ad))

## [1.21.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.20.0...v1.21.0) (2026-06-11)


### Features

* **ai:** auto alt-text and tag suggestions on upload ([d1b9eae](https://github.com/antoine-gourgue/Mosa-c/commit/d1b9eae144450950e5621d30cc63e99d272eca1f))
* **ai:** auto alt-text and tag suggestions on upload ([ea30111](https://github.com/antoine-gourgue/Mosa-c/commit/ea30111da930234ac560ebd889ec00ec3122fbdb)), closes [#358](https://github.com/antoine-gourgue/Mosa-c/issues/358)
* **ai:** provider abstraction over Mistral (@/lib/ai) ([2c39f5b](https://github.com/antoine-gourgue/Mosa-c/commit/2c39f5b0e11774d1c2ccd9add94aa63968f219e1))
* **ai:** provider abstraction over Mistral (@/lib/ai) ([4abaaa0](https://github.com/antoine-gourgue/Mosa-c/commit/4abaaa08b0047a27d70b07a65aa034f848c44d0a)), closes [#357](https://github.com/antoine-gourgue/Mosa-c/issues/357)
* **ai:** semantic search and similarity-based related pins ([8ad2f50](https://github.com/antoine-gourgue/Mosa-c/commit/8ad2f50510828bb198c715bc8805c48c52ad78d2))
* **ai:** semantic search and similarity-based related pins ([78ba1b5](https://github.com/antoine-gourgue/Mosa-c/commit/78ba1b56eae8ab70b5bde7acb0cad93c4f2b6d16)), closes [#359](https://github.com/antoine-gourgue/Mosa-c/issues/359)

## [1.20.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.19.0...v1.20.0) (2026-06-11)


### Features

* **analytics:** creator analytics dashboard ([19f4c7f](https://github.com/antoine-gourgue/Mosa-c/commit/19f4c7f0d84d62e02c58e7c641791e91574513a2))
* **analytics:** creator analytics dashboard ([1499132](https://github.com/antoine-gourgue/Mosa-c/commit/149913216e03c294806ec3dd16be97fdd67ff244)), closes [#356](https://github.com/antoine-gourgue/Mosa-c/issues/356)
* **boards:** follow a board, not just a user ([4e5b97a](https://github.com/antoine-gourgue/Mosa-c/commit/4e5b97ad0acf6cc9e946e4ebfe7fabb219280194))
* **boards:** follow a board, not just a user ([65747de](https://github.com/antoine-gourgue/Mosa-c/commit/65747de2f9e642b5793e147925619257050ad4af)), closes [#353](https://github.com/antoine-gourgue/Mosa-c/issues/353)
* **feed:** interest-based onboarding ([10be3a8](https://github.com/antoine-gourgue/Mosa-c/commit/10be3a8b8a156cbd6da36eaf9a4713dbfceb2949))
* **feed:** interest-based onboarding ([28ca522](https://github.com/antoine-gourgue/Mosa-c/commit/28ca5228d0972580e9c114e16f163222233bf386)), closes [#354](https://github.com/antoine-gourgue/Mosa-c/issues/354)
* **notifications:** real-time bell badge and live panel ([41636c9](https://github.com/antoine-gourgue/Mosa-c/commit/41636c9c289c34d090ee620368e6a7a0d3b89d08))
* **notifications:** web push notifications (PWA) ([d08e325](https://github.com/antoine-gourgue/Mosa-c/commit/d08e3257fcce89c5b4af91db3f8b0ddb500ca54f))
* **notifications:** web push notifications (PWA) ([47613ab](https://github.com/antoine-gourgue/Mosa-c/commit/47613abfe585a4effe1b94355d29eb53451a63a7)), closes [#355](https://github.com/antoine-gourgue/Mosa-c/issues/355)


### Bug Fixes

* **onboarding:** navigate to the feed after picking interests ([12a1c68](https://github.com/antoine-gourgue/Mosa-c/commit/12a1c68cde6544e5e6a8a0a08de085626221746a))
* **push:** inline NEXT_PUBLIC_VAPID_PUBLIC_KEY at build time ([b32125c](https://github.com/antoine-gourgue/Mosa-c/commit/b32125ce26d648029d0b745e4ed20144a44bd435))
* **push:** inline NEXT_PUBLIC_VAPID_PUBLIC_KEY at build time ([741c135](https://github.com/antoine-gourgue/Mosa-c/commit/741c1354bc7372916db7920bb172f3385bba2eb6))
* **pwa:** disable service-worker caching in development ([521167c](https://github.com/antoine-gourgue/Mosa-c/commit/521167cbea26a91a5238349b0318e31f0616cdc3))
* **pwa:** disable service-worker caching in development ([75c3ae4](https://github.com/antoine-gourgue/Mosa-c/commit/75c3ae45aeeb7e49c7dd85c3fb0e41849b79d0ea))

## [1.19.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.18.0...v1.19.0) (2026-06-10)


### Features

* **privacy:** private accounts with follow requests ([b379b08](https://github.com/antoine-gourgue/Mosa-c/commit/b379b083f156e09d87ca363cbc3d232e0cc829b9))
* **privacy:** private accounts with follow requests ([c5c20ec](https://github.com/antoine-gourgue/Mosa-c/commit/c5c20ec5d3089ef93dbeabea6238b472a6f65fcb))


### Bug Fixes

* **privacy:** show follow requests in the notifications panel ([8cdbf84](https://github.com/antoine-gourgue/Mosa-c/commit/8cdbf84bb84995aa6f18d1699ccedaa863faad7a))

## [1.18.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.17.0...v1.18.0) (2026-06-10)


### Features

* **boards:** secret boards with description ([3206d38](https://github.com/antoine-gourgue/Mosa-c/commit/3206d38c3c3c3edd2cc95f753495d0c1d5f1ae9a))
* **boards:** secret boards with description ([#349](https://github.com/antoine-gourgue/Mosa-c/issues/349)) ([ff5d4e4](https://github.com/antoine-gourgue/Mosa-c/commit/ff5d4e46ccf337cf39a4a4a28fe89df77bb33857))
* **pins:** edit a pin's title, description, link and tags ([#350](https://github.com/antoine-gourgue/Mosa-c/issues/350)) ([bc97d3a](https://github.com/antoine-gourgue/Mosa-c/commit/bc97d3aa556a6136d84fee7a36a030a88bf42d3d))
* **pins:** edit pins ([9ac4d77](https://github.com/antoine-gourgue/Mosa-c/commit/9ac4d77dafdd41b52eb4e4708759d6eab6938d2b))
* **safety:** block users and report comments and profiles ([87a5f8d](https://github.com/antoine-gourgue/Mosa-c/commit/87a5f8d1b365a3faf62ea32b9c979cca89d30000))
* **safety:** block users and report comments and profiles ([ac08fd8](https://github.com/antoine-gourgue/Mosa-c/commit/ac08fd820a9c704695cc1043a21ffd0d47a84d79)), closes [#351](https://github.com/antoine-gourgue/Mosa-c/issues/351)
* **settings:** settings hub with notifications, privacy and account ([f2bde31](https://github.com/antoine-gourgue/Mosa-c/commit/f2bde31e772ff3d0ae3b4cfdf630659cc4f3b034))
* **settings:** settings hub with notifications, privacy and account ([8e983b8](https://github.com/antoine-gourgue/Mosa-c/commit/8e983b827f197d84d2919ea85c233f130a770a05)), closes [#352](https://github.com/antoine-gourgue/Mosa-c/issues/352)

## [1.17.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.16.0...v1.17.0) (2026-06-10)


### Features

* **i18n:** localize relative times and dates via a locale-aware time hook ([d3c6501](https://github.com/antoine-gourgue/Mosa-c/commit/d3c65011d18f215b9c4517b22b1c98c2e72081ca))
* **i18n:** next-intl foundation with auto-detected locale ([dd64b8f](https://github.com/antoine-gourgue/Mosa-c/commit/dd64b8f30615c0ac2859d5240b80bda98ac67176))
* **i18n:** next-intl foundation with auto-detected locale ([898c33c](https://github.com/antoine-gourgue/Mosa-c/commit/898c33c29570bd97ec5df70fee72638443fc0a4b))


### Bug Fixes

* **i18n:** harden the locale cookie with secure and httpOnly flags ([5de2c07](https://github.com/antoine-gourgue/Mosa-c/commit/5de2c074c0150ece85f6f45dc35ac0e0f33adefe))


### Refactors

* **i18n:** localize account and profile action errors ([7f80b78](https://github.com/antoine-gourgue/Mosa-c/commit/7f80b78011dbb792bb8cff19f86336778d366a83))
* **i18n:** localize auth action and validation errors ([1a42a33](https://github.com/antoine-gourgue/Mosa-c/commit/1a42a33371f21f63e0b376305e5ceedfedb50b39))
* **i18n:** localize auth screens via message catalogues ([6c67f58](https://github.com/antoine-gourgue/Mosa-c/commit/6c67f58688b0143b0534abd0d9cc98695399a9af))
* **i18n:** localize boards and pin cards ([0631eed](https://github.com/antoine-gourgue/Mosa-c/commit/0631eedabed5c640f57b1ee7fa76bb5eef0d4d96))
* **i18n:** localize feed, page bodies, metadata and error pages ([d2f4e96](https://github.com/antoine-gourgue/Mosa-c/commit/d2f4e9612e32ea6c2789ef6fc40b4922f19762c7))
* **i18n:** localize follower counts and feed/message empty states ([be0218d](https://github.com/antoine-gourgue/Mosa-c/commit/be0218d439d82e643b16372716f914bbaf3bc6d4))
* **i18n:** localize landing, profile and search ([1b7d215](https://github.com/antoine-gourgue/Mosa-c/commit/1b7d2159149b39a6a181d0d3e0d0f4744bc80a8b))
* **i18n:** localize navigation (side, bottom, top, fab) ([b175329](https://github.com/antoine-gourgue/Mosa-c/commit/b175329d6293b174aed7c221a7a95abfe9b30793))
* **i18n:** localize notifications (inbox, panel, messages) ([079afd2](https://github.com/antoine-gourgue/Mosa-c/commit/079afd29959792e6738d86b6752180477fbc5a9e))
* **i18n:** localize profile settings screen ([2348303](https://github.com/antoine-gourgue/Mosa-c/commit/234830355909df859e23967ec5be0c7e60bf2abc))
* **i18n:** localize remaining server action errors ([f01ab11](https://github.com/antoine-gourgue/Mosa-c/commit/f01ab118a0c3dd18f50e96d1eca18c566f3e2a03))
* **i18n:** localize shared ui component defaults ([56a45b3](https://github.com/antoine-gourgue/Mosa-c/commit/56a45b3006cee1aa764f89ad9a14cf4d8712bd7d))
* **i18n:** localize the comment count header ([44cdfb3](https://github.com/antoine-gourgue/Mosa-c/commit/44cdfb35ed0b3a043fd67745c3e720e1d9345316))
* **i18n:** localize the create-pin flow ([09f3496](https://github.com/antoine-gourgue/Mosa-c/commit/09f349601f203f3a597e6deed08f54da2516cf49))
* **i18n:** localize the messaging experience ([ad42ea9](https://github.com/antoine-gourgue/Mosa-c/commit/ad42ea95fe396c0b9c3717e0dd2e8ab5ac7a87d3))
* **i18n:** localize the pin detail view and comments ([22c30a2](https://github.com/antoine-gourgue/Mosa-c/commit/22c30a2d38df0582f6f8aeb67ec4bb8e52cf96f2))
* **i18n:** localize typing indicator and message requests ([a37fa5c](https://github.com/antoine-gourgue/Mosa-c/commit/a37fa5c1cfe1a3b23e09d01014b354e45965704f))

## [1.16.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.15.0...v1.16.0) (2026-06-10)


### Features

* **account:** harden email change and password reset flows ([4c308ed](https://github.com/antoine-gourgue/Mosa-c/commit/4c308ed66e1e58ac0e15bf4683c8229208ba96f0))
* **account:** re-auth email changes and bound the status polling ([dda43ef](https://github.com/antoine-gourgue/Mosa-c/commit/dda43ef3cfd2834ba990fe9b968d98a67fae3724))
* **account:** throttle action emails and invalidate sessions on reset ([1b01cf6](https://github.com/antoine-gourgue/Mosa-c/commit/1b01cf639dc1e227a5907e07ca2c79f55911ed2a))

## [1.15.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.14.0...v1.15.0) (2026-06-10)


### Features

* **account:** live email verification status and consistent success styling ([0fbf524](https://github.com/antoine-gourgue/Mosa-c/commit/0fbf52404fc256833ecc5fc71f0109a913227fe1))
* **profile:** account settings with username, gender and email-verified email/password changes ([9d2ba6c](https://github.com/antoine-gourgue/Mosa-c/commit/9d2ba6ca5edb2bbc3c8fe7b252adf2855dcd78a9))
* **profile:** account settings with verified email & password changes ([f797da1](https://github.com/antoine-gourgue/Mosa-c/commit/f797da1c5b6d4d0ad62a5adbea92e48e35079ba8))


### Bug Fixes

* **account:** atomic token issuance and constant-time reset response ([7b5ebf4](https://github.com/antoine-gourgue/Mosa-c/commit/7b5ebf42e66180701f3405f3b7ba259291ace96a))
* **account:** harden email/password flows against CodeRabbit findings ([4c4d1d4](https://github.com/antoine-gourgue/Mosa-c/commit/4c4d1d4c8ed089f3ba674221035041dc20e94d40))

## [1.14.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.13.0...v1.14.0) (2026-06-09)


### Features

* **pwa:** installable desktop app (macOS & Windows) ([8ad4c93](https://github.com/antoine-gourgue/Mosa-c/commit/8ad4c93dde8098656ce9bb4e490325e4ce347826))
* **pwa:** installable desktop app with manifest, icons and offline SW ([6ab1caf](https://github.com/antoine-gourgue/Mosa-c/commit/6ab1cafbfdee2e228b000640eca5fbadd3704572))


### Bug Fixes

* **pwa:** register SW after load and keep the cache refresh alive ([3fa2b4e](https://github.com/antoine-gourgue/Mosa-c/commit/3fa2b4e2f3263b25842a8a30eade53066f346fc2))

## [1.13.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.12.0...v1.13.0) (2026-06-09)


### Features

* **auth:** add a one-tap verify button to the OTP email ([968e58d](https://github.com/antoine-gourgue/Mosa-c/commit/968e58da4338f9c7b1149fe532e6135557ad786e))
* **auth:** brand the verification email with the logo ([8a8c955](https://github.com/antoine-gourgue/Mosa-c/commit/8a8c955cb636a3d773a0e9b016804e9765479fd2))
* **auth:** email OTP verification on sign-up ([23f7309](https://github.com/antoine-gourgue/Mosa-c/commit/23f7309908b66d80f1583a5367405cb4888cd47b))
* **auth:** flatten the verification email and use a logo lockup ([326a2d9](https://github.com/antoine-gourgue/Mosa-c/commit/326a2d97855a112b794b0b0d2b10a7db15a1a77a))
* **auth:** single-step sign-up with username and inline gender ([27825a4](https://github.com/antoine-gourgue/Mosa-c/commit/27825a4cf172167de5908af6b0cabc36f69d58bd))
* **auth:** verify email with an OTP on sign-up ([965ed5e](https://github.com/antoine-gourgue/Mosa-c/commit/965ed5eff40f31b6aaafb4a462433af6d6a43c21)), closes [#335](https://github.com/antoine-gourgue/Mosa-c/issues/335)

## [1.12.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.11.0...v1.12.0) (2026-06-09)


### Features

* **messages:** group conversations ([04e9554](https://github.com/antoine-gourgue/Mosa-c/commit/04e9554bfa32911d99db9afa153b26768b8d1b5f))
* **messages:** group conversations (multi-participant) ([9b9c04d](https://github.com/antoine-gourgue/Mosa-c/commit/9b9c04d15c2c185d310852262fa0150594881f9f))
* **messages:** image, camera & GIF attachments in conversations ([7dc4802](https://github.com/antoine-gourgue/Mosa-c/commit/7dc480216b746d723440df0b482a3f840c1f4a01))
* **messages:** image, camera and GIF attachments in conversations ([4baf08a](https://github.com/antoine-gourgue/Mosa-c/commit/4baf08abe35cafd91b46695486148adbc3550a69))
* **messages:** live group leave notice and realtime group creation ([efe5642](https://github.com/antoine-gourgue/Mosa-c/commit/efe5642fe458ae19d517c2e60fcdead12ae7bb4f))
* **messages:** polish groups — avatar fit, leave icon, desktop panel-only ([9205de8](https://github.com/antoine-gourgue/Mosa-c/commit/9205de80106e2dd6557da32cd0ddd48a96aa83d3))

## [1.11.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.10.0...v1.11.0) (2026-06-09)


### Features

* **feed:** personalise the "For you" home feed ([a68e79b](https://github.com/antoine-gourgue/Mosa-c/commit/a68e79b1fca8b6c8928a40e4cc6926f6a1500bbd))
* **feed:** personalise the "For you" home feed ([c382383](https://github.com/antoine-gourgue/Mosa-c/commit/c382383f038e077d7b165c23c3f949270da9dc85))
* **messages:** share a pin into a direct message ([a57ecf8](https://github.com/antoine-gourgue/Mosa-c/commit/a57ecf86121cea6c4b577f8c2c4e7e9c499c114b))
* **messages:** share a pin into a direct message ([3ccd0f9](https://github.com/antoine-gourgue/Mosa-c/commit/3ccd0f9fc31cf6391e9aa5a42d2769e8d4121f2a))
* **tags:** replace categories with free-form tags ([2896558](https://github.com/antoine-gourgue/Mosa-c/commit/28965581af74102f64da09220c1f409d41fe8594))
* **tags:** replace categories with free-form tags ([1eeafe0](https://github.com/antoine-gourgue/Mosa-c/commit/1eeafe00bc9b50d5895ed2655a318d3dbfd78193))


### Bug Fixes

* **messages:** harden pin sharing per review ([66d474c](https://github.com/antoine-gourgue/Mosa-c/commit/66d474c90325cb1b6f1e8bad2a9f6c301a376ee5))

## [1.10.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.9.1...v1.10.0) (2026-06-08)


### Features

* **detail:** redesign pin closeup and enrich the standalone page ([03c58b6](https://github.com/antoine-gourgue/Mosa-c/commit/03c58b657c0e1f63b0aa19bbe5268ae5270f49b8))
* **detail:** redesign pin closeup and enrich the standalone page ([9db6ac8](https://github.com/antoine-gourgue/Mosa-c/commit/9db6ac803966e3b224991cd43033263112753b23))

## [1.9.1](https://github.com/antoine-gourgue/Mosa-c/compare/v1.9.0...v1.9.1) (2026-06-08)


### Documentation

* rewrite README and refresh brand and screenshots ([1dd837c](https://github.com/antoine-gourgue/Mosa-c/commit/1dd837c74e96fb93ea9cf392e2342ccc41f26db9))
* rewrite README and refresh brand and screenshots ([3580237](https://github.com/antoine-gourgue/Mosa-c/commit/358023710889fee0c54ae9bf93dea202be432235))

## [1.9.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.8.0...v1.9.0) (2026-06-08)


### Features

* **ui:** menu icons and sidebar hover tooltips ([4fb0488](https://github.com/antoine-gourgue/Mosa-c/commit/4fb0488826d38ef98bce4b3af541dda6fde8b133))
* **ui:** menu icons and sidebar hover tooltips ([449102b](https://github.com/antoine-gourgue/Mosa-c/commit/449102b10deef533fd4f9d2606351c372f1ffcd2))

## [1.8.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.7.0...v1.8.0) (2026-06-08)


### Features

* **boards:** cohesive pinterest-style boards page ([4a2b16c](https://github.com/antoine-gourgue/Mosa-c/commit/4a2b16ce5408ca41e09a63e00108b3f7a0f3ea31))
* **create:** pinterest-style create pin page ([b553841](https://github.com/antoine-gourgue/Mosa-c/commit/b553841d1656319dca797453fdfcaecd139d5704))
* pinterest-style redesign ([d7e4f9f](https://github.com/antoine-gourgue/Mosa-c/commit/d7e4f9f5ff2f70b869a15f885801abd0bcc2ea57))


### Bug Fixes

* **nav:** polish sidebar logo and settings icon ([f0de741](https://github.com/antoine-gourgue/Mosa-c/commit/f0de741b2c2778ab443f8bbd8102a8a37c4cb171))
* **ui:** resolve e2e accessibility and create-page regressions ([4c20199](https://github.com/antoine-gourgue/Mosa-c/commit/4c20199ae41542df214d71b07a6092a50adccb61))


### Refactors

* **ui:** harmonize buttons and inputs on a less-rounded scale ([8af8cb5](https://github.com/antoine-gourgue/Mosa-c/commit/8af8cb557b1cbb246010b119c41b1102b7183473))

## [1.7.0](https://github.com/antoine-gourgue/Mosa-c/compare/v1.6.0...v1.7.0) (2026-06-07)


### Features

* **auth:** google logo on sign-up, google on login, remove apple ([396da84](https://github.com/antoine-gourgue/Mosa-c/commit/396da841b0ca48cb4f1f3b77f9fe82a5c8dd5443))
* **messages:** full-height workspace layout for the inbox ([b1a0db1](https://github.com/antoine-gourgue/Mosa-c/commit/b1a0db1b62918077a1d177f89c39815438d3bd76))

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
