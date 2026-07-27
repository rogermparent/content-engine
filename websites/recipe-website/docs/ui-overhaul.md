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
- **Improvement Tour (PR 9–12) framing.** With the overhaul on screen, three
  shipped surfaces read as unfinished (masthead, homepage hero, detail scale
  bar). PRs 9–12 are a _tour back_ through those surfaces to raise them toward
  proven recipe-site conventions (NYT Cooking / Serious Eats / King Arthur) —
  layout/component/hierarchy work only. **Working Bench tokens, fonts, and the
  theming engine are kept verbatim; no palette change.** The paste review UI
  (PR 5) is explicitly kept as-is (the reference "review" pattern). Search/tag
  depth (FlexSearch features + tags surfaced in more places) folded into PR 12
  per user request.
- **PR 9 — Header refit (`ui/09-header` ← `test/editor-server-isolation`).**
  Rebuilt the two-row centered masthead into one sticky row: wordmark + a
  lightweight ember-square mark on the left, `Bookmarks` / `Search` / a single
  `Appearance` control on the right. The two chunky appearance eyesores (the
  empty-looking preset `Select` and the triple outlined theme toggle) are
  consolidated into **one ghost icon button → new `ui/popover`** holding a
  labeled "Theme" segmented control + "Preset" select; the mobile hamburger
  `Sheet` hosts the same `AppearanceControls`. New `ui/popover.tsx`
  (`@radix-ui/react-popover`) matches the dialog/tooltip house styling.
  - **Wordmark stays an `<h1>`.** The plan objected to a _centered h1 on its own
    row_, not to the heading semantics. Every index page (Homepage, Bookmarks,
    Featured, All Recipes, Search) uses `PageHeading` at `h2` and relied on the
    masthead for its page `h1`; de-semanticizing the wordmark would open an a11y
    gap across all of them (out of PR 9 scope). So the wordmark is now
    left-aligned and inline but remains the `h1` — zero blast radius into content
    pages, and `navigation.spec`'s "click the site title" + the homepage
    `heading level 1` assertions stay valid.
  - **ThemeToggle de-chunked.** Same 3-way `ToggleGroup` (roles unchanged:
    `role="group"` "Color mode" + `role="radio"` items), restyled from three
    outlined squares into a segmented control on a muted track with the active
    option lifted onto the card surface.
  - **`--header-height` var** added to `theme.css` `:root` (a layout constant,
    not a themeable color). The sticky masthead reserves it; the detail page's
    still-present scale bar was offset `top-0` → `top-[var(--header-height)]` so
    the two stickies don't overlap (that bar is fully removed in PR 11).
  - **Root-caused an app-wide icon-size bug.** Adding icons to the masthead
    surfaced that `globals.css` carried an **unlayered** `svg { width:100%;
height:100% }` (a Lighthouse-era tweak, #27). An unlayered rule beats every
    Tailwind `@layer utilities` declaration, so `size-4` / `w-6` lost and every
    icon silently inflated to fill its parent — invisible inside fixed-size
    buttons, catastrophic (~100px) in the new flex nav anchors. Fix: wrap the
    rule in `@layer base` in **both** apps' `globals.css` so utility sizing wins;
    unsized SVGs still stretch. This corrects icon rendering across the whole app
    (buttons, the oversized BookmarkButton, the schedule chevron) and pre-pays
    part of PR 12's BookmarkButton shrink. _Gotcha logged: the dev server can
    serve a stale compiled `globals.css` after this kind of edit — verify against
    a Playwright-managed server (or `rm -rf .next`), not a hot-reloaded one._
  - **Global chrome → all baselines regenerated.** The masthead + the icon-size
    fix touch every page, so every full-page baseline shifted. PR 9 regenerates
    the whole e2e+mobile snapshot set (not just the masthead) to stay green;
    PR 10/11 further update their content-specific baselines on top.
- **PR 10 — Homepage hero, timeline-led (`ui/10-homepage` ← `ui/09-header`).**
  The hero led with a lone **Multiply** control floating in an empty card — a
  scaler is useless on an index page. Reworked it into a conventional
  featured-recipe hero: the **cook timeline** (the app's signature) is the
  centrepiece, with a clamped description, a Prep·Cook·Total·Yield meta strip,
  and a "View recipe" CTA. Scaling moved off the homepage entirely (it lands in
  the Ingredients header in PR 11). `HeroLivePanel` de-clientised to a plain
  server component; a `StaticMultiplyable` passthrough keeps `<Multiplyable>`
  yield/ingredient markup rendering at base scale without a provider. A
  never-bare fallback ladder (timeline → description+meta → ingredient teaser)
  fixes the empty-hero look on sparse fixtures. `TimelineStrip` grew a
  backward-compatible `size="lg"`/`legend` so the detail page's strip is
  untouched.
- **PR 11 — Detail meta bar + scaler's new home (`ui/11-detail-scaler` ←
  `ui/10-homepage`).** Killed the full-width sticky "MULTIPLY" bar that sat in an
  empty band, gave the hero a canonical **Prep · Cook · Total · Yield** meta strip
  (new `MetaBar` in `View/shared.tsx`; zero-valued prep/cook dropped rather than
  shown as "0 min"; Yield relocated here and still scales in place), and moved the
  scaler into the **Ingredients header** as a segmented **½× · 1× · 2× + custom**
  control (clicking a preset writes its value into the custom field — one source
  of truth via the multiplier `input`). The custom field keeps the accessible
  name "Multiply" so existing scale-by-typing flows/specs hold. The scaler's
  header is `position: sticky` within the column (contained, not page-wide), so
  it stays reachable without the empty band.
  - **Scaler now requires ingredients.** It lives in the Ingredients section, so
    a recipe with **no ingredients** has no scaler (the yield.spec's yield-only
    recipe grew an ingredient; the featured-recipe fixture, being empty, simply
    shows no scaler — correct, nothing to scale).
  - **Label shortening rippled into specs.** `Prep Time`/`Cook Time`/`Total Time`
    → `Prep`/`Cook`/`Total` on the detail page broke `getByText("… Time")`
    detail assertions in `new-recipe`/`edit` specs (form-field `getByTitle("…
Time Minutes")` were left alone); updated them, and the "only total time"
    test now asserts prep/cook are _absent_ (no "0 min").
  - **Gotcha: `--update-snapshots` won't rewrite a sub-tolerance diff.** Removing
    the small "MULTIPLY" box from the empty featured-recipe page was under the 2%
    `maxDiffPixelRatio`, so `--update-snapshots` left the stale baseline in place
    (it still showed the old bar). Fix: **delete the baseline file** and let the
    run recreate it. A `rm -rf .next` between builds also proved necessary to
    dodge stale compiled output.
- **PR 12 — Site-wide polish + search/tags (`ui/12-polish` ←
  `ui/11-detail-scaler`).** The "improve all around" sweep once the three
  headline surfaces were fixed. Recipe cards (`List/*`, `ClientList`,
  `SearchList`) got the display face on names, mono/tabular `<time>` dates, a
  bench-toned monogram placeholder for image-less cards (replacing the flat gray
  box), a quiet linked tag hint (`RecipeCardTagHint`), and a slightly roomier
  grid. `BookmarkButton` shrank to a `size-5` glyph in an `icon-sm` ghost button
  on a token backing (dropped the hardcoded `bg-slate-400/25` and
  `text-yellow-500` → `bg-background/80` + `text-primary`). Empty states
  (featured, search-no-results, homepage) converged on the shared `EmptyState`
  with house-voice copy + a clear action, retiring a hardcoded `bg-slate-700`
  link. **Search/tags fold-in (user request):** the client re-rank became a
  stable **name > tag > ingredient** tiering over FlexSearch's merged results
  (tags earn priority; name hits lead), and tags now surface on the plain cards,
  not just search cards.
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
- **Owner-chrome pass = PR 13–15 (2026-07-26).** Confirmed scope for the footer
  rethink: **columns + colophon + social/contact** (the "go further" option, not
  a minimal tidy). Status colors → **real `--success/--warning/--info` tokens**
  (not one-off retokens), needing a light+dark axe pass. Settings → **a page per
  area** behind a **sidebar** (instrument-rack styling on the existing
  `--sidebar*` tokens; no shadcn sidebar primitive), Theme on its own route. Ship
  as **3 stacked PRs** off `ui/12-polish`.
- **Footer plumbing rendered in PR 13, edited in PR 14 (2026-07-26).** The footer
  note + contact fields are wired end-to-end now (settings → editor layout,
  env-baked → export layout) but the owner-facing edit form is deferred to the
  PR 14 settings work, so PR 13 stays a pure footer/layout change.

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
| 8   | `test/editor-server-isolation`  | ✅ done        | Isolate the editor test server off port 3010; guard specs against foreign DOM                                                                                                                                                                       |
| 9   | `ui/09-header` ← 08             | ✅ done        | Single sticky masthead (wordmark+ember mark left; Bookmarks/Search/Appearance right); new `ui/popover` primitive; consolidate ThemeToggle+PresetPicker into one Appearance popover / mobile sheet; `--header-height` var                            |
| 10  | `ui/10-homepage` ← 09           | ✅ done        | Timeline-led homepage hero (drop the scaler; TimelineStrip as the signature; meta line; never-bare fallback)                                                                                                                                        |
| 11  | `ui/11-detail-scaler` ← 10      | ✅ done        | Detail hero meta bar (Prep\|Cook\|Total\|Yield); kill the standalone sticky scale bar; scaler → Ingredients heading (½·1·2 + custom)                                                                                                                |
| 12  | `ui/12-polish` ← 11             | ✅ done        | Uniform image-forward cards, BookmarkButton shrink, house-voice empty states, FlexSearch/tag-driven search polish, instrument consistency                                                                                                           |
| 13  | `ui/13-footer` ← 12             | ✅ done        | Rethink the shared site footer: colophon plate (brand block + social/contact icons + menu-driven columns + colophon bar); fix Sign In/Out to a link-styled control; owner "Manage" column (editor-only); footer note + contact plumbing (both apps) |
| 14  | `ui/14-settings` ← 13           | ⬜ todo        | Replace the hardcoded sub-footer with a settings sidebar (instrument rack); a page per area; Theme → its own `/settings/theme` route; mobile drawer                                                                                                 |
| 15  | `ui/15-tokens` ← 14             | ⬜ todo        | Semantic status tokens (`--success/--warning/--info`); retokenize ~15 hardcoded-color files; fixed-width instruction step numbers; card-ify menus/pages tiles; light+dark axe sweep                                                                 |

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

## Improvement Tour (PR 9–12)

A tour back through the shipped surfaces to raise them toward proven recipe-site
conventions (NYT Cooking / Serious Eats / King Arthur). **Layout / component /
hierarchy only** — Working Bench tokens, fonts, and the theming engine are kept
verbatim. The paste review UI (PR 5) is kept as-is (the reference "review"
pattern). Base of the stack: `ui/09-header` off `test/editor-server-isolation`
(PR 8), so new specs inherit the isolated test port + served-app guard.

**Follow-up backlog (surfaced by the tour — not built here):**

- **Select/Checkbox → Radix consolidation** — punted across PRs 1/3/5/6; the
  native `name`-submitting controls still bypass the Radix `ui/*` primitives. A
  real cleanup PR (don't let the PR-1 note overstate it).
- **Light-mode teal-band contrast gap** — the accent curve dips ~4.31:1 at hue
  ~165–215 (from PR 7's deferred note); an accent-curve redesign that would shift
  light baselines.
- **Export search parity** — `/search/all` + `/search/version` are editor-only,
  so the FlexSearch filter/browse experience is missing in the static export.
- **PR 2c** — per-component raw-token overrides + exposing owner presets to
  public visitors (deferred).
- **"Jump to recipe / ingredients"** anchor buttons on long detail pages
  (conventional, optional).
- **Hero/Featured overlap** — the hero shows `featured[0]`, which also appears in
  the Featured grid; accepted trade-off, revisit only if it grates.

### PR 9 — Header refit `ui/09-header` ✅ done

Rebuilt the fugly two-row centered masthead into one sticky row and consolidated
the two chunky appearance controls into a single popover. Header is fully shared
(`common/AppLayout`), so this changes both apps.

- [x] **`ui/popover.tsx` primitive** — thin `@radix-ui/react-popover` wrapper in
      `packages/component-library/components/ui/`, matching the dialog/tooltip
      house styling (mode-aware `bg-popover`, house border, shared enter/exit
      motion). First Popover/Dropdown primitive in the kit.
- [x] **Single sticky row** (`SiteHeader` + `HeaderNav`) — a flex
      `justify-between` row, `sticky top-0 z-40` at `h-[var(--header-height)]`
      over a `bg-card/80 backdrop-blur` surface. **Left:** wordmark `Link` to `/`
      in
      `font-display` with a small ember-square glyph (identity without a logo
      asset), kept as the page `<h1>` (see Decisions log). **Right cluster:**
      `Bookmarks` + `Search` nav links (`size-4` lucide icons + label, injected
      by href so menu data stays icon-free) and one **Appearance** control.
- [x] **Appearance popover** (`AppLayout/Appearance.tsx`) — a single ghost
      icon `Button` (sliders icon) opens the popover with the shared
      `AppearanceControls`: a labeled "Theme" segmented control (the
      de-chunked 3-way `ThemeToggle`) + a "Preset" select (`PresetPicker` full
      width). Removes both the empty-looking preset box and the triple outlined
      toggle from the bar.
- [x] **De-chunked `ThemeToggle`** — same 3-way `ToggleGroup` (roles unchanged:
      `role="group"` "Color mode", `role="radio"` items), restyled from three
      outlined squares into a segmented control on a muted track, active option
      lifted onto the card surface with a shadow.
- [x] **Mobile** — the existing hamburger `Sheet` now hosts the same
      `AppearanceControls` below the nav links; no new mobile pattern (the mobile
      header was already the better wordmark-left/one-control-right shape).
- [x] **`--header-height`** — added to `theme.css` `:root` (`3.5rem`). The detail
      page's still-present sticky scale bar offsets `top-0` →
      `top-[var(--header-height)]` so the two stickies don't overlap (bar fully
      removed in PR 11).
- [x] **Tests + baselines** — new `header.spec.ts` (single sticky row, wordmark
      returns home, Appearance popover exposes Theme + Preset, Dark takes effect,
      mobile sheet still lists nav + appearance) with a `masthead-signed-out`
      locator baseline. Because the masthead is global chrome, the whole
      e2e+mobile snapshot set was regenerated; axe WCAG2AA sweep (light + dark)
      stays green; editor + export `tsc` clean.

### PR 10 — Homepage hero, timeline-led `ui/10-homepage` ✅ done

Turn the bare, mis-focused hero into a conventional featured-recipe hero whose
live element is the **cook timeline** (the app's signature), and drop the
scaler — scaling belongs on the recipe page, per every real recipe site.

- [x] **Scaler removed from the hero.** `HeroLivePanel` no longer wraps a
      `MultiplierProvider` and drops `MultiplierInput` / `MultipliedServings`;
      it's now a plain server component. A tiny `StaticMultiplyable` passthrough
      renders `<Multiplyable>` markup in yield/ingredient text at its base number
      so provider-free rendering never throws.
- [x] **Timeline promoted to centrepiece.** `TimelineStrip` gained an optional
      `size="lg"` (taller bar) + `legend` (hands-on/rest key); `CompactTimeline`
      forwards both. The hero renders the first timeline as the prominent
      `size="lg" legend` strip — larger than the 44px detail preview. Defaults
      are unchanged, so the detail page's strip and baselines don't move.
- [x] **Panel content (top→bottom):** mono eyebrow (`Featured`/`Latest`, in
      `HeroBench`) → `font-display` title (`<h2>`, masthead still owns the
      `<h1>`) → clamped `recipe.description` → prominent timeline strip →
      `font-mono tabular-nums` meta line (Prep · Cook · Total · Yield, the `Stat`
      helper) → ember "View recipe" CTA.
- [x] **Never-bare fallback ladder:** description leads when present; a short
      static **ingredient teaser** fills in only when there's no description; the
      timeline and meta strip render whenever their data exists. A no-image
      recipe degrades to a balanced panel-only card (not the old empty look).
- [x] **Tests + baselines** — `homepage-hero.spec` reworked: the rich hero shows
      description + timeline + yield meta with **no** `Multiply` control (and the
      teaser suppressed under a description); a second test seeds a
      description-less recipe and asserts the ingredient-teaser fallback. Both
      stay WCAG2AA-clean. Regenerated `homepage-three-recipes` /
      `homepage-two-pages` / `homepage-mobile`; homepage/featured/accessibility/
      mobile specs green; editor + export `tsc` clean.

### PR 11 — Detail: meta bar + scaler's new home `ui/11-detail-scaler` ✅ done

Kill the standalone sticky scale bar; give the hero a canonical meta bar; move
the scaler into the Ingredients header as a ½× · 1× · 2× + custom control.

- [x] **Hero meta bar** — new `MetaBar` (`View/shared.tsx`): a horizontal
      **Prep · Cook · Total · Yield** strip in `font-mono tabular-nums`, hairline
      dividers via a `bg-border` grid gap (4-across desktop, 2×2 mobile). Fills
      the hero's formerly-dead right column. Zero-valued prep/cook are dropped
      (no "0 min"); Yield relocated from the old bar and still scales in place via
      a new `ScaledYield`. Prints (times belong on paper).
- [x] **Standalone sticky bar removed** — the full-width `sticky … backdrop-blur`
      scale band between the hero and the columns is gone (`View/index.tsx`).
- [x] **Scaler → Ingredients heading** (`Ingredients/index.tsx`,
      `Multiplier/index.tsx`) — `MultiplierInput` reworked into a segmented **½× ·
      1× · 2×** preset group (`role="group"` "Scale", `aria-label`ed "Half/Single/
      Double batch" buttons) **+ a custom numeric field** that keeps the
      accessible name **"Multiply"**. Clicking a preset writes its value into the
      field — the multiplier `input` is the single source of truth (`fraction.js`
      parses `1/2`). Default 1×. Reuses the view-wide `MultiplierProvider`.
- [x] **Contained sticky** — the Ingredients heading + scaler pins to
      `top-[var(--header-height)]` _within its column_ (not page-wide), so it
      stays reachable while scrolling the ingredients; `print:static`.
- [x] **Tests + baselines** — `recipe.spec`: presets scale (`1 1/2 tsp`→`3 tsp`
      at 2×, `→ 3/4 tsp` at ½×) and write the custom field; a sticky-header test
      (asserts `position: sticky`, robust to short fixtures); a new meta-bar test
      on the timed `baked-potatoes` fixture. `new-recipe`/`edit`/`yield` detail
      assertions updated for the short labels + ingredient-hosted scaler.
      Regenerated `recipe-6-multiplied`, `recipe-detail-signed-out`/`-in`,
      `featured-recipe-detail-signed-in` (delete-to-regen), `recipe-mobile`,
      `yield-multiplied-half`. Full e2e+mobile green; editor + export `tsc` clean.

### PR 12 — Site-wide polish + search/tags `ui/12-polish` ✅ done

The all-around sweep. Cards, bookmark control, empty states, and the search
ranking, plus the folded-in tag/FlexSearch work.

- [x] **Recipe cards** (`List/shared.tsx` + `List/index.tsx`, `ClientList`,
      `SearchList`) — `font-display` name, `font-mono tabular-nums` `<time>`
      date, a bench-toned monogram `RecipeCardPlaceholder` for image-less cards
      (was a flat gray box), a linked `RecipeCardTagHint` (server-safe, the plain
      counterpart to search's interactive `CardTags`), and a roomier `gap-3`.
- [x] **BookmarkButton** — `size-5` glyph in an `icon-sm` ghost button on a
      `bg-background/80 backdrop-blur` backing; dropped hardcoded
      `bg-slate-400/25` and swapped the active `text-yellow-500` → `text-primary`
      ember. (The PR-9 `@layer base` svg fix is what lets `size-5` actually take.)
- [x] **Empty states** — `FeaturedRecipesPage`, search-no-results, and the
      homepage "Latest" empty converged on the shared `EmptyState` with a title,
      one house-voice line, and a clear action (Browse / Clear search). Retired a
      hardcoded `bg-slate-700` link.
- [x] **Search ranking + tags** (user fold-in) — the client re-rank is now a
      stable **name > tag > ingredient** tiering over FlexSearch's merged results
      (`SearchContext`), so a name hit leads and tags earn priority above
      ingredient-only hits. Tags now show on the plain recipe cards too, not just
      search cards — reinforcing the by-name search specs (name matches float
      first) while keeping the tag-priority guarantee.
- [x] **Tests + baselines** — functional specs (empty-state, search, search-tags,
      bookmarks, featured, homepage, navigation, accessibility) green; regenerated
      the card/empty/search baselines across the e2e+mobile snapshot set (delete-
      to-regen where a change fell under the 2% tolerance). Editor + export `tsc`
      clean.

## Owner-chrome pass (PR 13–15)

With the reader surfaces done (PR 9–12), the **owner chrome** and a
**hardcoded-color debt** read as unfinished. Three stacked PRs off `ui/12-polish`
rethink the footer (13), give settings a real sidebar + a page per area (14), and
add semantic status tokens + retokenize the remaining hardcoded colors (15).

### PR 13 — Rethink the site footer `ui/13-footer` ✅ done

The old footer was one wrapping link row: the `/search` item's icon wrapped to a
broken line, and Sign In/Out was a boxed `<Button>` misaligned with the text
links. Rebuilt as a structured colophon plate, shared `common/` so it ships to
editor + export.

- [x] **Colophon plate** (`AppLayout/index.tsx` `SiteFooter`) —
      `border-t border-border bg-card`, `max-w-6xl` centered like the masthead. A
      4-col grid: brand block (ember mark + `font-display` wordmark + clamped
      description + a social/contact icon row) then the menu columns, over a
      hairline colophon bar (`© {year} {title}` + optional owner note + a mono
      "Built on Content Engine" credit).
- [x] **Menu-driven columns** (`AppLayout/nav.tsx` `FooterNav`) — a top-level
      footer `MenuItem` **with `children`** becomes a titled column (name =
      mono-uppercase heading); flat items collect under a default **"Browse"**
      column. Reuses the menus collection's nested `children` — columns are an
      owner customization with no model change. Columns are vertical block links
      (`inline-flex items-center gap-1.5`), so the search icon can no longer wrap
      mid-item — the broken line is gone by construction.
- [x] **Owner "Manage" column** (editor-only) — new `OwnerFooterLinks` server
      component (New Recipe, Settings, Content Sync, Sign In/Out), passed to
      `AppLayout` as `footerNavItems` and rendered only when present, so the
      export footer stays reader-only. **Sign In/Out** is now a form submit styled
      with `buttonVariants({ variant: "link", className: "h-auto p-0 …" })` — a
      text link aligned with the column, not a boxed button. (`NavLink` stays
      internal to keep its `onNavigate` function prop off the boundary; a
      serializable `FooterLink` wrapper is what the server column imports.)
- [x] **Customization plumbing** — `AppLayoutProps.footer?: { note?; contact? }` + a `ContactLinks` type (known keys → known lucide icons) in
      `common/config/site.ts`. Editor `layout.tsx` reads `readSettings()` →
      `footer`; export `layout.tsx` reads a new env-baked `getSiteFooter()`
      (mirrors `getSiteTheme()`), fed by `exportAction` baking
      `SITE_FOOTER_NOTE` / `SITE_CONTACT`. `Settings` gains `footerNote` +
      `contact` (edit UI lands in PR 14).
- [x] **Tests + baselines** — new `footer.spec.ts` (columns, link-styled Sign
      In/Out, inline search icon, colophon, configured note + contact icons,
      mobile stacking). Regenerated the 20 `@visual` baselines + the functional
      snapshot set (footer sits in every full-page shot). Editor + export `tsc`
      clean.

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
