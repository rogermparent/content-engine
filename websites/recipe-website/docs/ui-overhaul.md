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

| PR  | Branch (← parent)               | Status         | Scope                                                                                                                                                  |
| --- | ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `ui/01-foundation` ← `overhaul` | ✅ done        | This doc, central palette, typography, 3-way theme, shadcn dedup, primitives                                                                           |
| 2a  | `ui/02a-theming-engine` ← 01    | ✅ done        | Theming engine + owner theme editor + built-in presets + live preview (editor app); site default in `settings.json`                                    |
| 2b  | `ui/02b-theming-export` ← 2a    | ✅ done        | Bake site default into the static export build (`SITE_THEME` env), import/export theme JSON, owner-saved named presets                                 |
| 2c  | `ui/02c-theming-overrides` ← 2b | ⏸️ deferred    | Per-component raw-token overrides (`--destructive`, `--chart-*`, …) behind a disclosure; expose owner presets to public visitors — **skipped for now** |
| 3   | `ui/03-search-tags` ← 2b        | 🟡 in progress | Tall-card fix, tags taxonomy as priority filters, search-page filter-chip rail (AND/OR), tag display on detail/cards                                   |
| 4   | `ui/04-homepage` ← 03           | 🟡 in progress | Working Bench homepage + live hero                                                                                                                     |
| 5   | `ui/05-paste` ← 04              | ⬜ not started | Smarter paste, header/section detection, interactive review                                                                                            |
| 6   | `ui/06-detail-timeline` ← 05    | ⬜ not started | Timeline first-class + recipe-detail polish                                                                                                            |
| 7   | `ui/07-a11y-motion` ← 06        | ⬜ not started | Accessibility + motion pass                                                                                                                            |

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

### PR 5 — Paste `ui/05-paste`

Shared `detectHeading(line)` util (trailing-`:`, ALL-CAPS, `For the …`,
`Step N`, lettered) for both parsers; upgrade `parseInstructions`
(`Form/Instructions/index.tsx`) to emit `InstructionGroup`s; interactive review
in `Form/PasteField/index.tsx` (headers highlighted, per-line header↔item toggle
before `onImport`).

### PR 6 — Detail + timeline `ui/06-detail-timeline`

Render `timelines[].events` as a compact visual cook-schedule on
`/recipe/[slug]` (`common/components/View/*`); two-column ingredients+steps,
sticky scale control, print styles.

### PR 7 — A11y + motion `ui/07-a11y-motion`

Visible focus rings (`--ring`), `prefers-reduced-motion` on animations, WCAG
contrast check across palette **and custom themes** in both modes, keyboard nav.

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
Do **not** use `e2e-dev:update` wholesale while the TanStack-form migration is in
flight — it would enshrine the currently-broken new-recipe/edit/markdown-source
renders.
