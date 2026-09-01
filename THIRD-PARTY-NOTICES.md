# Third-party notices

## Eclipse Scout (`@eclipse-scout/core`)

ES Mockup derives its look & feel from Eclipse Scout so that mockups match the
real framework. The following material originates from `@eclipse-scout/core`
(version 26.2.2 at the time of writing):

| In this repository | Origin | Nature |
| --- | --- | --- |
| `public/fonts/scoutIcons.woff`, `public/fonts/scoutIcons-light.woff` | `res/fonts/` | Unmodified copy of the Scout icon font. |
| `src/styles/scout-tokens.generated.css` | `src/style/colors.less`, `sizes.less`, `fonts.less` | Generated: the LESS variables compiled to CSS custom properties. |
| `src/model/scoutColors.generated.ts` | `src/style/colors.less` | Generated: the colour declarations as a JSON expression tree. |
| `src/model/scoutIcons.generated.ts` | `src/style/icons.less` | Generated: icon name to character map. |
| `src/render/colorSystem.ts` | `less.js` colour functions | Re-implementation of `fade`, `darken`, `lighten` and `rgba` with the same semantics. |
| `src/render/layout.ts` | `src/layout/logicalgrid/LogicalGridData.ts` | The weight inheritance rules of Scout's logical grid, re-implemented. |

Eclipse Scout is:

> Copyright (c) 2010, 2026 BSI Business Systems Integration AG
>
> This program and the accompanying materials are made available under the terms
> of the Eclipse Public License 2.0 which is available at
> <https://www.eclipse.org/legal/epl-2.0/>
>
> SPDX-License-Identifier: EPL-2.0

The full text of the Eclipse Public License 2.0 is available at
<https://www.eclipse.org/legal/epl-2.0/>. The corresponding source of Eclipse
Scout is published at <https://github.com/eclipse-scout/scout.rt> and on npm as
`@eclipse-scout/core`.

The files listed above remain subject to the EPL-2.0. The rest of ES Mockup is
licensed under the MIT license (see `LICENSE`).

ES Mockup is an independent tool. It is not affiliated with, endorsed by, or an
official product of the Eclipse Foundation or BSI Business Systems Integration AG.

## Build-time dependencies

* [less](https://lesscss.org/) — BSD-3-Clause — used at build time to compile the
  Scout LESS variables and by `npm test` to verify the colour system.
* [Vite](https://vitejs.dev/) — MIT — build tooling.
* [TypeScript](https://www.typescriptlang.org/) — Apache-2.0 — build tooling.
* [Playwright](https://playwright.dev/) — Apache-2.0 — development-only, used by
  the screenshot / gallery / end-to-end helpers in `tools/dev`.

The shipped application bundle has no runtime dependencies.
