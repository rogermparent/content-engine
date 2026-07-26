# Recipe Website UI Overhaul — "The Working Bench"

> **This is the durable source of truth for the multi-phase UI overhaul.**
> It persists in-repo so a fresh session (with cleared context) can rebuild the
> full picture by reading this file. Update the **Status** checkboxes and the
> **Decisions log** at every phase boundary. Each phase is a stacked PR and gets
> its own plan-mode pass seeded from this doc.

## Why this exists

The recipe editor app works but reads as generic and half-migrated:

- **No identity.** Homepage is two stacked card grids; no hero, no typeface. The
  app's two distinctive capabilities — **ingredient scaling** (`<Multiplyable>`)
  and **cooking timelines** — surface nowhere.
- **Half-adopted design system.** A shadcn/Radix layer exists in
  `@discontent/component-library` but native `Form/inputs/Select`/`Checkbox`
  duplicate it, raw `<button>`s bypass `Button`, and many components hardcode
  `slate/red/purple/cyan` instead of the OKLCH tokens.
- **Palette scattered & locked.** Tokens duplicated across each app's
  `globals.css`; app hardcoded to dark (`className="dark"` in `AppLayout`). No
  single place to change the palette, and no way to customize it.
- **Search cards blow out.** `SearchList` renders every matching ingredient in an
  unbounded `<ul>`; a match-heavy recipe stretches its whole grid row. Search is
  free-text only — no browse or filter.
- **Paste parsing asymmetric & brittle.** Ingredients detect headings;
  instructions only strip a number prefix — no section/step recognition, no way
  to fix mis-parses.

**Outcome:** a distinctive "Working Bench" identity (light **and** dark) driven by
one central, **fully customizable** palette; the shared design system fully
adopted; a **tag-driven** search/browse experience; smarter paste; and the
timeline as a first-class feature.

## Decisions log

- **Direction:** "The Working Bench" (see Design direction). Working Bench ships
  as the _default preset_, not a hard-coded look.
- **Color mode:** light + dark both first-class; 3-way **System / Light / Dark**
  control (via `next-themes`).
- **Palette:** one central token file in `packages/component-library` imported by
  every content-engine site; sites/users override at runtime (PR 2).
- **Theming depth:** **full end-user theming** — config + in-app Settings editor +
  live preview + switchable presets + import/export + per-component overrides.
- **Search:** tags/taxonomy as **priority filters** (weighted above name/
  ingredient); homepage browse chips feed tag-filtered search.
- **Sequencing:** foundation-first; **stacked branches/PRs, one per phase.**
- **Stack base:** branches off **`overhaul` HEAD** (not `main`). `overhaul` =
  `main` + the TanStack-form migration (Stage 5a–5d), which later PRs build on.
  _(2026-07-24: revised from the initial "base on main" after discovering the
  form-migration commits + uncommitted git-sync WIP.)_
- **git-sync WIP:** committed onto `overhaul` (commit `Git sync UI: sync panel,
conflict resolver, commit log`) before branching.
- **Deferred:** the **git-cluster dedup (step 1f)** is dropped from PR 1 — the
  `git/` files are being actively rewritten by the git-sync feature; revisit
  after that lands.
- **Light-mode contrast:** the app now renders light in the axe tests (system
  default), which exposed contrast gaps. Light `--primary` (ember) was darkened
  to `oklch(0.53 0.16 50)` to clear 4.5:1 with white text, and a pre-existing
  hardcoded `text-blue-400` link in `List/FeaturedRecipe` was retokened to
  `text-primary`. Axe WCAG2AA suite is green; the fuller pass is PR 7.
- **Known pre-existing test failures (not from this PR):** two editor-form
  visual tests — `edit form with slug conflict shows Overwrite` and `markdown
editor source mode active` — fail identically on the base commit
  (`37d72617`); they're broken by the in-progress TanStack-form migration.
  _(Resolved in **PR 4.2** — see below.)_
- **PR 4.2 — TanStack-form / Lexical migration repaired + suite greened
  (`ui/04.2-form-fixes` ← `ui/04.1-visual-fixes`, top of stack, no rebase).**
  Investigation reclassified the 23 red tests: a few real form bugs plus a lot of
  overhaul-induced test hygiene. Fixes:
  - **A1 (spike):** the `new-recipe` "submit never lands" failures were **not** a
    migrated-form runtime error — the recipe is created fine; the tests' final
    `getByText(name)` on the homepage now double-matched **PR 4's hero `<h2>`**
    and the list `<h3>`. Scoped those to the `recipe-list` testid (same class as
    B2). The form submit path is sound; no server changes.
  - **A2:** `LexicalMarkdown` rich→source toggle now **synchronously serialises**
    (`editor.read($exportRecipeMarkdown)` via a `CaptureEditor` ref plugin, gated
    on interaction) so a just-inserted node isn't missed by the async
    update-listener.
  - **A3:** added `MultiplyableNode.importDOM` (+ a `data-lexical-multiplyable`
    marker on `exportDOM`) so HTML copy-paste round-trips; clears the dev warning.
  - **B1/B2:** `git.spec` — scoped `getByRole("radio")` to `branchesSection`
    (excludes PR 1's theme toggle) and the hero-name `getByText` collisions to
    `recipe-list`.
  - **C1:** the NextAuth default sign-in page's `#submitButton` (stock `#157efb`,
    3.9:1 on white) now uses `theme.brandColor: "#b14700"` — the light `--primary`
    ember (`oklch(0.53 0.16 50)`, 5.57:1). `accessibility.spec` sign-in test
    un-`test.fail`ed and green.
  - **D1:** pinned `colorScheme: "light"` in `playwright.config.ts` so baselines
    can't drift light/dark.
  - **D2:** regenerated the genuinely-stale form baselines (`new-recipe-form`,
    `-overwrite`, `edit-form-populated`, `-overwrite`, `markdown-source-mode`,
    `paste-replace-imported-ingredients`), each visually confirmed as a correct
    Working Bench render (no dev overlay, tokenised buttons).
  - **Dev-mode hydration flake (root-caused):** the biggest source of suite noise
    was a controlled input / React click interacted-with **before the recipe-form
    island hydrated** (the value gets reset to empty, or the click is swallowed).
    Added a `markdownEditorReady(page, name)` helper that waits for Lexical's
    `data-lexical-editor="true"` marker (set in the same hydration commit that
    attaches handlers) and gated the form specs (yield, timeline, youtube,
    ytdlp, paste-replace, reference-updates, new-recipe, edit, \*-duplicate-slug,
    ingredient-preview) on it. Full `--project=e2e --project=mobile` green.
- **PR 5 — Smarter paste: symmetric heading detection + live review
  (`ui/05-paste` ← `ui/04.2-form-fixes`, top of stack, no rebase).** Shipped as
  **one PR** — a parser-only stage couldn't be CI-verified without the UI (no
  unit-test harness exists; Playwright is the only runner).
  - **Shared `detectHeading` (`common/util/detectHeading.ts`).** Conservative OR
    of three high-precision rules on an already-trimmed line: trailing colon
    (`/:\s*$/`, reproduces the old ingredient rule), `For the|your …` prefix, and
    ALL-CAPS (≥2 letters, no trailing sentence punctuation). Deliberately biased
    to **under-detection** — a false heading silently re-shapes the persisted
    tree, a missed one is a one-click promote in the review UI. `Step N` / `N.` /
    `a)` stay strippable _prefixes_ (handled by the step-number stripper), never
    headings. `parseIngredients.ts` swapped `endsWith(":")` → `detectHeading`;
    colon is still not stripped from ingredient text (unchanged).
  - **Instruction grouping fold.** `parseInstructions` is now a `parseToLines` +
    `assemble` pair: a single-pass fold accumulates flat `Instruction`s until a
    `detectHeading` line opens a new `InstructionGroup` (pushed once by
    reference, mutated as later steps nest in); lines before the first heading
    stay flat. No-heading input is byte-identical to the old flat parser (guards
    the regression specs). The data model, form Group/Ungroup UI, and detail
    rendering already existed — only the parser was missing.
  - **PasteField → always-on live review.** Introduced a flat, type-agnostic
    `ParsedLine { text; isHeading }` intermediate so both lists share one review
    surface; the flat-vs-grouped divergence lives in a per-type `assemble`. The
    textarea is the raw source of truth (its `onChange` re-derives `lines`,
    resetting toggles); a read-only per-line review list under it exposes a
    heading toggle (`Toggle Heading Line {n}`) that refines the derived model
    before Import. Review rows are **local state, not `form.Field`** (no `name=`),
    so they can't collide with `instructions[N]…` / `ingredients[N]…` FormData
    keys. `assemble(parseToLines(v))` reproduces the old `parseFunction(v)`
    exactly, so the one-click path (fill → Import, no toggling) is unchanged —
    which keeps the ~10 existing paste specs green with zero edits.
  - **Symmetry.** Heading detection + review apply to **both** ingredient and
    instruction paste. Ingredient headings stay flat (`type: "heading"`, no group
    nesting) — matching the current model and view; only instructions nest.
  - **Tests:** new `paste-review.spec.ts` (demote a mis-detected ALL-CAPS/`:`
    heading → lands flat; promote a plain line → becomes a group/heading; both
    lists) + new-recipe grouping specs (`For the dough:` / `Bake:`, ALL-CAPS +
    `For your …`, no-heading regression). All existing paste specs unchanged.
    Full `--project=e2e --project=mobile` green; `tsc` clean for editor +
    component-library. No baseline regen needed (paste `<details>` is collapsed
    in form baselines, so the review list isn't captured; ingredient assemble
    output is identical).
- **PR 7 — A11y + motion (`ui/07-a11y-motion` ← `ui/06-detail-timeline`, top of
  stack, no rebase).** Exploration found the app already largely accessible, so a
  targeted gap-closing pass: focus rings on the two Badge-buttons that lacked them
  (TagFilterRail, Form/Tags), keyboard-activation for the Timeline offset grip, a
  global `prefers-reduced-motion` guard in both app `globals.css`, and shared-kit
  convergence (`dialog` dark-bg → token, `sheet`/`slider` → house focus ring),
  committed separately since it touches all content-engine sites.
  - **Contrast = axe-only, expanded.** Per the decision to verify AA by axe at
    runtime (not a computed-ratio linter), the sweep grew from _light + 3 presets +
    `/`_ to _every preset (working-bench included) × light/dark × 3 pages + 2
    off-preset custom themes × light/dark_. This is the "custom themes in both
    modes" guarantee.
  - **Dark `--destructive` nudge.** The new dark axe caught the `bg-destructive
text-white` Delete button at 2.92:1 (needs 4.5) — the dark `--destructive` was
    never axe-verified. Darkened `theme.css` `.dark --destructive` `L=0.70 → 0.577`
    (→ 4.78:1), a surgical single-token fix. Dark-only, so light visual baselines
    (pinned light in `playwright.config`) don't move. Precedent: the PR-1 light
    `--primary` darkening.
  - **Deferred: light-mode teal-band curve gap.** The sweep also exposed that the
    light accent curve `oklch(0.53 0.16 h)` dips to ~4.31:1 at hue ~190 (fails only
    for a _custom_ teal accent; no built-in preset is in the 165–215 band). Fixing
    it is a contrast-curve redesign that would shift light baselines — explicitly
    out of PR 7 scope; documented as a follow-up. Custom test hues (berry 320,
    amber 25) sit outside the band.
- **PR 6 — Detail + timeline: toggle-able schedule, sticky scale, print, retheme
  (`ui/06-detail-timeline` ← `ui/05-paste`, top of stack, no rebase).**
  Exploration corrected the doc's PR 6 brief — the two-column layout and an
  interactive `TimelineView` already existed, so the work was replace/retheme,
  not net-new. Shipped as one branch:
  - **Toggle-able schedule (`View/Schedule`, `RecipeSchedule`).** Collapsed by
    default it shows a read-only compact strip per timeline (name, note, total,
    proportional bar; hands-on events in ember `primary`, rests quiet `muted`) —
    the plan at a glance, and what prints. An **"Adjust schedule"** disclosure
    (`aria-expanded`, stable accessible name) **swaps** those strips in place for
    the kept-and-rethemed interactive editor (resizable durations, zoom, offsets,
    overlap warnings). Swap (not additive) so only one representation is ever in
    the a11y tree on screen, avoiding a duplicate `Timeline: <name>` name; print
    always restores the strips.
  - **Editor retheme.** `View/Timeline/index.tsx`'s hardcoded slate/amber/blue
    palette → Working Bench tokens: surfaces `bg-card`/`bg-background`/
    `border-border`, active (hands-on) = ember `primary/20`, overlap conflict =
    `destructive`, all durations in `font-mono tabular-nums`. Roles/labels
    (`Timeline: <name>` region, `Timeline container` group, `Timeline zoom
multiplier`, `Step N duration in minutes`, `article` names) unchanged, so
    `timeline.spec` gained one "expand first" click per interactive test, not a
    rewrite. Editor duration text moved to the compact format (`1h`, not `1h 0m`).
  - **Sticky scale bar.** `MultiplierInput` + `MultipliedServings` extracted from
    the hero into a slim `sticky top-0 bg-background/90 backdrop-blur border-b`
    bar above the two-column section (`print:static print:hidden`). `MultiplierInput`
    reused verbatim, so `getByLabel("Multiply")` is unchanged. Prep/Cook/Total
    `InfoCard`s stay in the hero (they don't scale).
  - **`InfoCard` retheme.** Now a bench card surface (`bg-card border`) with a mono
    uppercase eyebrow label and a `font-mono tabular-nums` value — ties Prep/Cook/
    Total and Multiply/Yield into the numeric language. (Shared with the hero's
    scale/yield cards; the homepage baselines did not diff — the hero fixtures
    don't surface them at the captured size.)
  - **`formatDuration` consolidated** to `common/util/formatDuration.ts`
    (`formatDurationLong` "1 hr 30 min" for InfoCards, `formatDurationCompact`
    "1h 30m" for strips/editor), collapsing the 4 inline copies. `TimelineStrip`
    extracted to `common/components/TimelineStrip` as the shared read-only strip;
    `CompactTimeline` (hero) is now a thin wrapper over it (hero byte-identical).
  - **Print stylesheet.** A shared `@media print` block (kept in sync across both
    apps' `globals.css`) forces the schedule strip's segment fills and the
    checklist boxes to survive the browser's background-stripping, and avoids
    page-breaks inside an ingredient/step. Screen chrome (sticky bar, Reset,
    Bookmark, tags, image/video, header/footer) hidden via `print:` utilities.
  - **Tests.** `timeline.spec` reworked (collapsed-strip at-a-glance assertion +
    an in-test print check; interactive assertions expand first; compact
    durations). `recipe.spec` gained a sticky-scale-in-viewport test and a
    print-media test (ingredients shown, scale bar + Reset hidden). Full
    `--project=e2e --project=mobile` green; editor `tsc` clean. Regenerated only
    the 4 detail-page baselines a real diff touched — `recipe-6-multiplied`,
    `recipe-detail-signed-out`, `recipe-detail-signed-in`, `recipe-mobile` — each
    visually confirmed a correct Bench render. Homepage/hero, featured-detail, and
    all form baselines unchanged.
- **PR 2 split → 2a / 2b (2026-07-24).** 2a = the theming **engine** + the
  owner's editor + built-in presets + live preview, applied to the **editor
  app**, with the site default persisted in the editor's `settings.json`. 2b =
  baking the site default into the static **export** build, import/export JSON,
  per-component overrides, and user-saved named presets. Rationale: 2a is a
  self-contained, testable engine; export baking + advanced overrides are a
  separable second slice.
- **Theming contract (2a).** A theme is a small set of _knobs_
  (`{accentHue, neutral, radius, fontPairing, defaultMode}`) in
  `packages/component-library/theming`, **derived** into per-mode OKLCH tokens on
  the PR-1 contrast curve (accent L/C fixed, only hue moves; neutral shifts
  hue/chroma at fixed lightnesses) — so **every** accent/neutral choice stays
  WCAG2AA by construction (verified in `accessibility.spec.ts` across presets).
  - **Injection is two-layer, flash-free.** Site default (owner): editor
    `layout.tsx` reads `readSettings()` → `AppLayout` renders a `:root{}/.dark{}`
    `<style data-theme-default>` as the first child of `<body>` (wins over
    `theme.css` by source order; SSR, no JS, both modes). Visitor override + live
    preview: `ThemeVarsProvider` (in `common`, inside `AppProviders`) applies the
    **resolved mode's** tokens as **inline vars on `<html>`** keyed on
    next-themes' `resolvedTheme`; a blocking pre-paint `<script>` in `AppLayout`
    mirrors it from `localStorage` before first paint.
  - **localStorage keys:** `ce-theme` (knobs), `ce-theme-vars` (resolved
    `{light,dark}` maps read by the pre-paint script), `theme` (next-themes mode).
  - **Fonts:** `next/font` is build-time, so all pairings are pre-registered in
    `AppLayout/fonts.ts` on suffixed vars (`--ff-display-<key>`, …); `theme.css`
    binds the roles to the `bench` pairing by default, and the engine switches
    them to `var(--ff-*-<pairing>)`.
  - **Persistence:** `Settings.theme?` in the editor; `updateSettings`
    merge-preserves other fields, validates via `parseTheme`, and
    `revalidatePath("/", "layout")`. `getSiteConfig()` stays env-only.

## Stacked-PR roadmap

Each branch is off the previous. Rebase children after a parent merges.

| PR  | Branch (← parent)               | Status         | Scope                                                                                                                                                                                                                                               |
| --- | ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ui/01-foundation` ← `overhaul` | ✅ done        | This doc, central palette, typography, 3-way theme, shadcn dedup, primitives                                                                                                                                                                        |
| 2a  | `ui/02a-theming-engine` ← 01    | ✅ done        | Theming engine + owner theme editor + built-in presets + live preview (editor app); site default in `settings.json`                                                                                                                                 |
| 2b  | `ui/02b-theming-export` ← 2a    | ✅ done        | Bake site default into the static export build (`SITE_THEME` env), import/export theme JSON, owner-saved named presets                                                                                                                              |
| 2c  | `ui/02c-theming-overrides` ← 2b | ⏸️ deferred    | Per-component raw-token overrides (`--destructive`, `--chart-*`, …) behind a disclosure; expose owner presets to public visitors — **skipped for now**                                                                                              |
| 3   | `ui/03-search-tags` ← 2b        | 🟡 in progress | Tall-card fix, tags taxonomy as priority filters, search-page filter-chip rail (AND/OR), tag display on detail/cards                                                                                                                                |
| 4   | `ui/04-homepage` ← 03           | 🟡 in progress | Working Bench homepage + live hero                                                                                                                                                                                                                  |
| 4.2 | `ui/04.2-form-fixes` ← 04.1     | ✅ done        | Repair TanStack-form / Lexical migration (submit, source-toggle serialise, `importDOM`); fix overhaul-induced selector collisions; sign-in contrast; regen stale form baselines; root-cause + gate dev-mode hydration flake → full e2e+mobile green |
| 5   | `ui/05-paste` ← 04.2            | ✅ done        | Symmetric `detectHeading` (trailing-`:` / `For the …` / ALL-CAPS) for both parsers; `parseInstructions` folds steps into `InstructionGroup`s; always-on live paste review with per-line heading toggle                                              |
| 6   | `ui/06-detail-timeline` ← 05    | ✅ done        | Toggle-able schedule (compact strip → rethemed editor), sticky scale bar, print stylesheet, `formatDuration` dedup + `TimelineStrip` extraction, detail retheme                                                                                     |
| 7   | `ui/07-a11y-motion` ← 06        | ✅ done        | Focus rings on 2 gap buttons, Timeline offset keyboard-activation, global `prefers-reduced-motion` guard, shared-kit focus/dark-bg fixes, dark + custom-theme axe sweep (found + fixed dark `--destructive` AA fail)                                |

## Design direction — "The Working Bench"

A _working_ recipe index, not a food blog. The surface is a kitchen bench; the
recipe's data (quantities, times, schedule) is the material. Utilitarian but
warm, equal in light and dark.

**Color** — remapped onto the existing shadcn token slots so the whole primitive
layer inherits it: warm-neutral bench + copper/ember accent, kept off the
cream+terracotta cliché by pairing ember with a cool steel neutral.

- `--background` bench: light `oklch(0.98 0.006 85)` · dark `oklch(0.17 0.012 260)`
- `--card`: one step raised per mode
- `--primary`/action ember (copper): `oklch(0.70 0.16 55)`
- `--ring`: ember at reduced chroma
- Neutrals: low-chroma warm slate. Values are the direction; exact OKLCH is
  finalized in implementation and contrast-checked in both modes.

**Type** (added via `next/font`), three content-driven roles:

- **Display** — condensed grotesque (Archivo / Space Grotesk): headings & labels.
- **Body** — humanist sans (Public Sans / Inter): prose, instructions.
- **Utility/mono** — mono w/ tabular figures (Spline Sans Mono / JetBrains Mono):
  **quantities, durations, timeline times, eyebrow labels**. Numbers are a
  recipe's data and tie to the scaling feature — the signature typographic move.

**Layout** — asymmetric bench hero (featured photo tile + live panel), a
browse-chips row, then Featured / Latest grids.

**Signature** — the hero's **live panel**: the featured recipe's quantities scale
in place and its timeline renders as a compact schedule strip. One bold element;
everything else stays quiet.

## Phase detail

### PR 1 — Foundation `ui/01-foundation`

- [x] **1a** Durable plan doc (this file)
- [x] **1b** Central palette + typography: token blocks extracted to
      `packages/component-library/styles/theme.css`, imported by editor + export
      `globals.css` via a relative path (identical depth from both apps). Working
      Bench values applied in light + dark. Three fonts loaded via `next/font` in
      the shared AppLayout (`--ff-display/-body/-mono`), mapped onto
      `font-display/-sans/-mono`.
- [x] **1c** 3-way theme control: `next-themes` provider (defaultTheme=system) in
      AppProviders replaces hardcoded `<html className="dark">`; `ThemeToggle` on
      `ui/toggle-group` added to header (desktop + mobile sheet). Uses
      `useSyncExternalStore` for the mount guard (lint forbids setState-in-effect).
- [x] **1d** Token-drive primitives: `ui/button.tsx` variants rebound to
      `bg-primary/-destructive/-secondary`; shared `baseInputStyle` +
      `Errors` + markdown-toolbar/Lexical-node/Video-error colors retokened, which
      cascades to every hand-rolled input. **Deferred:** consolidating the native
      FormData `Select`/`Checkbox` onto Radix `ui/*` → form PRs (3/5/6), since they
      submit via native name attributes; retokened for now.
- [x] **1e** Off-system app buttons → `Button`: editor `layout.tsx` Sign In/Out
      (two forms merged into one), `Homepage` "More" link (Button asChild).
      Markdown links retokened in 1b. `SearchResultsModal`'s `<button>` left as a
      bare card-click wrapper on purpose. `git/CommitLog` moves with 1f.
- [x] **1g** Added `ui/card` + `ui/badge` primitives; `RecipeCard` given a token
      border + `card-foreground` (kept as a compact media card, not the padded
      Card shell).
- ~~1f git-cluster dedup~~ — **deferred** (see Decisions log).

### PR 2 — Full end-user theming (split into 2a / 2b)

Lives in `packages/component-library` so every content-engine site inherits it.

#### PR 2a — Theming engine + owner editor `ui/02a-theming-engine` ✅ done

- [x] **theming module** `packages/component-library/theming/` — knob model
      (`types.ts`), contrast-safe derivation (`derive.ts`), CSS/vars serializers
      (`serialize.ts`), built-in presets (`presets.ts`), untrusted-input
      validation (`parse.ts`), font-pairing menu (`fonts.ts`).
- [x] **Slider primitive** — `@radix-ui/react-slider` + `ui/slider.tsx`
      (aria-label forwarded to the thumb); `components/theming/AccentPicker.tsx`
      (curated swatches + hue slider).
- [x] **Flash-free injection** — `AppLayout` `theme` prop → SSR
      `<style data-theme-default>` + pre-paint `<script>`; `ThemeVarsProvider` in
      `common` wired into `AppProviders`; `theme.css` font-role default binding +
      pre-registered pairings in `AppLayout/fonts.ts`.
- [x] **Persistence** — `Settings.theme?`; editor `layout.tsx` reads
      `readSettings()` → passes `theme`; `updateSettings` merge-preserves,
      validates, and `revalidatePath("/", "layout")`.
- [x] **Editor UI** — `ThemeEditor` on `/settings`: preset select, `AccentPicker`,
      neutral/font selects, radius slider, default-mode toggle-group, live-preview
      cluster (buttons/card/badge/text), "Save as site default".
- [x] **Visitor preset/mode switch** — `PresetPicker` in the shared header (ships
      in `common` → export inherits it in 2b); built-in preset → localStorage.
- [x] **Tests** — `theme-editor.spec.ts` (live preview, per-mode, preset switch,
      save→SSR-no-flash, visitor persist); `accessibility.spec.ts` extended across
      presets (WCAG2AA green). Default look unchanged (no baseline regen).

#### PR 2b — Export baking + import/export + named presets `ui/02b-theming-export` ✅ done

- [x] **Export baking (env channel).** `common/config/site.ts` gains
      `getSiteTheme()` — parses the build-time `SITE_THEME` env var via
      `parseTheme` (absent/invalid → `undefined` → built-in default). The static
      export `layout.tsx` passes `<AppLayout theme={getSiteTheme()}>`, so the
      prerender inlines `<style data-theme-default>` on every page (pre-paint
      script + `ThemeVarsProvider` still allow visitor overrides). The
      editor→export build injects it: `buildExport()` reads `readSettings().theme`
      and threads `SITE_THEME=JSON.stringify(theme)` through an optional
      `extraEnv` param on `commandAction`, merged into the execa `env` alongside
      `CONTENT_DIRECTORY`. Non-`NEXT_PUBLIC_` → build-time server-only. The deploy
      path is unaffected (it redeploys the already-built `out/`).
- [x] **Import / export theme JSON.** `ThemeEditor` grows an "Import / Export"
      `ui/dialog` with a `ui/tabs` split: _Export_ = read-only textarea of the
      serialized theme + Copy (`navigator.clipboard`); _Import_ = editable
      textarea + Apply → `parseTheme` (inline error on `null`, else `setTheme` +
      `previewTheme` and close).
- [x] **Owner-saved named presets.** `Settings.presets?: NamedPreset[]`
      (`{id,name,theme}`) persisted in the editor's git-ignored `settings.json`.
      Server actions `savePreset`/`deletePreset` (`parseTheme`-validated,
      `randomUUID()` id, read-merge-write, `revalidatePath("/","layout")`). The
      editor UI adds a "Save current as preset" input + list with Apply/Delete,
      and the preset `Select` merges built-in `PRESETS` (by `key`) with saved
      presets (by `saved:<id>` value) under grouped "Built-in" / "Saved" labels
      (`SelectGroup`/`SelectLabel` added to the primitive).

**Contracts logged for later phases:**

- **Env baking:** `SITE_THEME` (JSON `Theme`) → `getSiteTheme()` in
  `common/config/site.ts`, read only by the export `layout.tsx` at build time.
- **Named-preset persistence:** owner-side only, in the editor's
  `settings/settings.json` (`presets[]`) — _not_ in the content repo and _not_
  yet exposed to public visitors. Exposing them to the export build is 2c.

#### PR 2c — Per-component overrides + public presets `ui/02c-theming-overrides` ⏸️ deferred

**Skipped for now** (2026-07-24) — PR 3 stacks directly on 2b instead. Revisit
after the search/homepage work; nothing in PR 3+ depends on it.

- Advanced per-component raw-token overrides (e.g. hand-editing `--destructive`,
  `--chart-*`, or a specific `--card`) behind a disclosure — extends the `Theme`
  model beyond the current knobs.
- Expose owner-saved named presets to public visitors in the export build (today
  visitors only get the built-in `PRESETS` via `PresetPicker`).

### PR 3 — Search + tags `ui/03-search-tags` 🟡 in progress

Re-parented `← 2b` (2c deferred). All shared changes land in `common` so the
export app inherits the model, the tall-card fix, and tag display; **export
search parity stays out of scope** (`/search/all` + `/search/version` exist only
in the editor app, so the FlexSearch filter experience is editor-only today).

- [x] **Tags model + persistence.** `tags?: string[]` on `Recipe` +
      `RecipeEntryValue` + `MassagedRecipeEntry`. Normalized (trim, collapse
      whitespace, lowercase, dedupe) via `common/controller/normalizeTags.ts`,
      applied in the zod `RecipeFormSchema.transform` and the `TagsInput` commit.
      Threaded through `buildRecipeData` / `formDataFromParsed` / form-state +
      form-values types.
- [x] **Indexed twice.** Emitted into the LMDB index value
      (`buildIndexValue.ts`) and mapped into the corpus (`getRecipes`), and added
      to the FlexSearch `Document.index` (`["name","ingredients","tags"]`). A
      lightweight client re-rank in `SearchContext` floats tag matches above
      ingredient-only matches (no FlexSearch-internals rewrite).
- [x] **Tags form field.** `common/components/Form/Tags` — free-form chips
      (Enter/comma commits, Backspace removes last) on the TanStack array-field
      pattern, submitting `tags[i]` (FormData bracket-notation → string array),
      plus one-click quick-add suggestions from the corpus (`getAllTags()`,
      prop-threaded through the new/edit/copy pages).
- [x] **Filter-chip rail (AND/OR).** `SearchForm/TagFilterRail` — corpus tag
      chips toggle a shared `selectedTags` filter with an `All`/`Any`
      (AND/OR, default AND) `ToggleGroup` + clear. Persisted like the query
      (sessionStorage + `tags`/`mode` URL params via `useSearchURLSync`). The
      filter applies to the query's results _or_ the whole corpus, so tags work
      as a no-query **browse** affordance. (Made `/search/all` fetch
      unconditional — the rail/browse need the full corpus with tags; the
      expensive FlexSearch _populate_ stays gated on the version check.)
- [x] **Tall-card fix.** `SearchList/index.tsx` caps matched-ingredient lines to
      3 + a muted "+N more", `line-clamp`s each line, and adds a single
      non-wrapping row of compact tag chips (`SearchList/CardTags`, click →
      toggles the rail filter) → uniform row heights.
- [x] **Reader-facing tags.** Chips under the title on `/recipe/[slug]`
      (`View/index.tsx`, each links to `/search?tags=…`) and schema.org
      `keywords` in `View/JsonLD`.

**Tags contract:** persisted as a normalized `string[]` (trimmed, lowercased,
deduped, empties dropped). Indexed in both the LMDB index value and FlexSearch.
Multi-tag filters combine AND by default with a togglable OR. No migration
script — creating/updating a recipe rewrites its index entry and bumps
`/search/version` (client refetches); older recipes pick up tags on the next
edit or via Settings → "Reload Recipe Database" (`rebuildRecipeIndex`). Export
search parity is a pre-existing limitation, deferred.

### PR 4 — Homepage `ui/04-homepage` 🟡 in progress

Rebuild `common/components/Homepage/index.tsx` (a shared server component, so both
apps inherit it — no `(recipes)/page.tsx` change): bench hero (featured photo +
live scaler/timeline panel), browse-chips row backed by PR-3 tag filters, then
Featured / Latest grids.

- [x] **Bench hero** — `Homepage/HeroBench.tsx` (server): asymmetric slab pairing
      a large photo tile (`getTransformedRecipeImageProps`) with the live panel.
      Mono eyebrow ("Featured"/"Latest"), `font-display` name (an **`<h2>`** — the
      masthead already owns the page's `<h1>`), ember "View recipe" CTA. Degrades
      to panel-only with no image.
- [x] **Live panel (signature)** — `Homepage/HeroLivePanel.tsx` (`"use client"`):
      `MultiplierProvider` wrapping the reused `MultiplierInput` /
      `MultipliedServings` + the first ~4 ingredients through
      `StyledMarkdown{Multiplyable}` so quantities **scale in place**, plus
      prep/cook/total (`font-mono tabular-nums`).
- [x] **Compact timeline strip (read-only)** — `Homepage/CompactTimeline.tsx`:
      the first timeline's events as one proportional strip (active = ember, rest
      = muted), mono durations, a spoken `aria-label` summary. The full
      interactive schedule stays **PR 6**.
- [x] **Browse chips** — `Homepage/BrowseChips.tsx` (server): `getAllTags()` →
      `Badge asChild` links to `/search?tags=…` (first 12 + a "More →" to
      `/search`); renders nothing when the corpus is untagged.
- [x] **Grids** — reuse `RecipeList`; headings in `font-display`; empty-state and
      the "More Latest Recipes" link preserved.

**Hero source & fallback.** The hero leads with the **first featured** recipe
(full `Recipe` via `getRecipeBySlug`, try/catch → no hero on failure); with **no
featured** recipes it falls back to the **latest** (`recipes[0]`) with a "Latest"
eyebrow. The **Featured grid keeps every featured recipe** (it is _not_ minus the
hero-promoted one): removing it would empty the "Featured Recipes" section on the
common one-featured case and break `featured-recipes.spec` + the fixture
generator, which assert the featured recipe appears under that heading. The
minor hero/grid overlap is the accepted trade-off; the grid heading text stays
"Featured Recipes"/"Latest Recipes" exactly.

**Verification (all green except pre-existing).** New `homepage-hero.spec.ts`
(UI-seeds one rich recipe → hero photo/name, scale `1 cup`→`2 cup`, browse chip
`/search?tags=bread`, timeline segment, WCAG2AA axe). `homepage.spec.ts` +
`featured-recipes.spec` homepage cases unchanged and green; `accessibility.spec`
green; `homepage-three-recipes` / `homepage-two-pages` / `homepage-mobile`
baselines regenerated. `tsc` clean for editor + export. Pre-existing, **not from
this PR** (verified by stashing): the TanStack-form visual baselines (new-recipe/
edit/markdown-source), the `featured-recipes-page-2` visual (99% diff), the flaky
featured-recipe-selector dialog, and the `recipe.spec` multiplier baseline.

### PR 5 — Paste `ui/05-paste` ✅ done

Shared `detectHeading(line)` util (trailing-`:`, `For the …`, ALL-CAPS —
`Step N`/`N.`/`a)` stay strippable prefixes, not headings) for both parsers;
`parseInstructions` (`Form/Instructions/index.tsx`) now folds steps into
`InstructionGroup`s; always-on live review in `Form/PasteField/index.tsx` (a
flat `ParsedLine { text; isHeading }` intermediate with a per-type `assemble`;
read-only rows, headers highlighted, per-line heading toggle before `onImport`).
Symmetric across ingredient + instruction paste; ingredient headings stay flat
(`type: "heading"`). See the Decisions log entry for the full rationale.

### PR 6 — Detail + timeline `ui/06-detail-timeline` ✅ done

The recipe **detail page** pass. Exploration found the two-column layout and an
interactive `TimelineView` already existed, so the work was replace/retheme, not
net-new. See the Decisions log entry for the full rationale.

- [x] **Toggle-able cook schedule** — `View/Schedule` (`RecipeSchedule`): a
      read-only compact `TimelineStrip` per timeline at a glance (ember = hands-on,
      quiet = rest, mono durations), with an **"Adjust schedule"** disclosure that
      swaps in the kept-and-rethemed interactive editor (resize/zoom/offset/overlap).
- [x] **Editor retheme** — `View/Timeline` slate/amber/blue → Bench tokens
      (`primary` active, `destructive` conflict, mono `tabular-nums` durations);
      roles/labels unchanged so `timeline.spec` only expands first.
- [x] **Sticky scale bar** — `MultiplierInput` + `MultipliedServings` in a slim
      `sticky top-0` bar above the two columns (`print:static print:hidden`);
      `getByLabel("Multiply")` unchanged. Prep/Cook/Total stay in the hero.
- [x] **`InfoCard` retheme** — bench card surface + mono eyebrow + mono tabular
      value, unifying the page's numbers with the scaling feature.
- [x] **`formatDuration` dedup** — `common/util/formatDuration.ts`
      (`Long`/`Compact`); `TimelineStrip` extracted to `common/components`
      (`CompactTimeline` a thin wrapper, hero byte-identical).
- [x] **Print stylesheet** — shared `@media print` block in both apps'
      `globals.css` (schedule strip fills + checklist boxes survive print; no
      mid-item page breaks); screen chrome hidden via `print:` utilities.
- [x] **Tests + baselines** — reworked `timeline.spec`; sticky + print tests in
      `recipe.spec`; regenerated the 4 detail-page baselines, each visually
      confirmed. Full e2e+mobile green, editor `tsc` clean.

### PR 7 — A11y + motion `ui/07-a11y-motion` ✅ done

Visible focus rings (`--ring`), `prefers-reduced-motion` on animations, WCAG
contrast check across palette **and custom themes** in both modes, keyboard nav.
Exploration found the app already in good shape (most `ui/*` primitives carry the
house `focus-visible:ring-ring/50 ring-[3px]`; widgets are real buttons), so this
was a targeted gap-closing pass, not a sweep.

- [x] **Focus rings** — the two recipe-website buttons that rendered a Badge with
      no focus indicator: `SearchForm/TagFilterRail` filter chips and `Form/Tags`
      suggestion chips got the house ring (+ `rounded-md`). The TagFilterRail
      Badge's `ring-primary` is a _selected-state_ marker, left alone.
- [x] **Keyboard — Timeline offset** — `View/Timeline` OffsetBlock's
      `role="button"` grip had `onClick`/`tabIndex` but no key handler; added
      `onKeyDown` (Enter/Space, `preventDefault` on Space) reusing the click
      handler. Kept as a `role="button"` div (a native `<button>` would create an
      ambiguous label association inside its `<label>` wrapper).
- [x] **Reduced-motion kill-switch** — one `@media (prefers-reduced-motion:
reduce)` guard beside the print block in **both** app `globals.css` (kept in
      sync), collapsing every animation/transition to `0.01ms`. One global
      guarantee, not per-component `motion-reduce:` variants; `0.01ms` (not `0`)
      keeps `*end` events firing. Not in shared `theme.css` (app-globals precedent
      keeps blast radius local + visible to this app's reviewers).
- [x] **Shared-kit convergence** (separately-revertable) — `ui/dialog.tsx` dropped
      the hardcoded `dark:bg-slate-900` (a real dark-theming bug; `bg-background`
      is mode-aware); `ui/sheet.tsx` close `focus:` → `focus-visible:` + house
      ring; `ui/slider.tsx` thumb `ring-4` → house `ring-[3px]`. None alter the
      default light render.
- [x] **Dark + custom-theme axe sweep** — `seedTheme()` helper; every preset
      (working-bench included) × light/dark across `/`, `/recipe/recipe-6`,
      `/search`, plus 2 off-preset custom themes (berry 320, amber 25) × light/dark
      on `/`. `expectMode()` asserts the mode class took before axe. This is the
      "contrast across palette + custom themes in both modes" deliverable.
- [x] **Dark `--destructive` AA fix** — the sweep flagged the `bg-destructive
text-white` Delete button in dark at **2.92:1** (needs 4.5). Darkened the
      dark `theme.css` `--destructive` from `L=0.70` to `L=0.577` → 4.78:1.
      Surgical single-token nudge (no curve redesign); dark-only so light visual
      baselines are untouched; applies to all presets (shared fall-through token).
- [x] **Tests** — new `reduced-motion.spec` (computed transition-duration
      collapses under emulation) and `timeline.spec` keyboard-activation test, plus
      the axe expansion above.

**Known follow-up (out of PR 7 scope):** the expanded sweep also revealed the
light-mode accent curve (`deriveAccent`, `oklch(0.53 0.16 h)`) dips just under AA
in the cyan/teal band (~hue 165–215, worst ~4.31:1 at 190) against the near-white
`--primary-foreground`. Closing it means darkening the light accent `L`, which is
a **contrast-curve redesign** that would shift light visual baselines — deliberately
deferred (PR 7 = surgical dark-token nudges only). Built-in presets (hues 50/150/
250/265) and the two custom hues all sit outside the band, so nothing ships under
AA today; a teal _custom_ accent is the only way to hit it.

## Verification (Playwright-first)

Verify UI changes with Playwright; open a real browser only to diagnose
failures. Existing specs: `visual.spec.ts` (regenerate baselines on intentional
change), `paste-replace.spec.ts`, `ingredient-preview.spec.ts`, `git.spec.ts`.
Run the editor suite after each PR; keep both editor + export apps building with
the shared theme.

**Snapshot-owning specs (regenerate ALL on a theme change).** Visual baselines
live in two places, and a theme change invalidates both. The `@visual`-tagged
specs — `visual.spec.ts` and `mobile.spec.ts` — are covered by `e2e-dev:visual`
(`--grep @visual`, which also spawns `-mobile.png` variants). But several
**functional** (non-`@visual`) specs embed their own screenshots and are _not_
touched by `e2e-dev:visual`: `empty-state.spec.ts`, `featured-recipes.spec.ts`,
`recipe.spec.ts`, `ingredient-preview.spec.ts`, `menus.spec.ts`, `yield.spec.ts`,
and `paste-replace.spec.ts`. Regenerating only the `@visual` set (as PR 1 did)
leaves these functional baselines stale against the new theme. Regenerate them
with `e2e-dev:update-functional-snaps` (`--project=e2e --update-snapshots` against
exactly those specs — no mobile project, so no unwanted `-mobile.png` variants).
Historically `e2e-dev:update` wholesale was unsafe while the TanStack-form
migration was in flight (it would enshrine broken new-recipe/edit/markdown-source
renders). **PR 4.2 repaired that migration and greened the suite**, so wholesale
regen is no longer a landmine — but still prefer targeted regen (only the specs a
change actually touches) to keep diffs reviewable. When regenerating a form
baseline, gate on hydration first (`markdownEditorReady`) so a mid-hydration frame
isn't captured.
