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

## Stacked-PR roadmap

Each branch is off the previous. Rebase children after a parent merges.

| PR  | Branch (← parent)               | Status         | Scope                                                                                                                  |
| --- | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | `ui/01-foundation` ← `overhaul` | 🚧 in progress | This doc, central palette, typography, 3-way theme, shadcn dedup, primitives                                           |
| 2   | `ui/02-theming` ← 01            | ⬜ not started | Full end-user theming: runtime tokens, Settings editor + live preview, presets, import/export, per-component overrides |
| 3   | `ui/03-search-tags` ← 02        | ⬜ not started | Tall-card fix, tags taxonomy as priority filters, search-page redesign, browse facets                                  |
| 4   | `ui/04-homepage` ← 03           | ⬜ not started | Working Bench homepage + live hero                                                                                     |
| 5   | `ui/05-paste` ← 04              | ⬜ not started | Smarter paste, header/section detection, interactive review                                                            |
| 6   | `ui/06-detail-timeline` ← 05    | ⬜ not started | Timeline first-class + recipe-detail polish                                                                            |
| 7   | `ui/07-a11y-motion` ← 06        | ⬜ not started | Accessibility + motion pass                                                                                            |

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

- [ ] **1a** Durable plan doc (this file)
- [ ] **1b** Central palette + typography: extract token blocks from editor
      `globals.css` into `packages/component-library/styles/theme.css`, imported
      by editor + export `globals.css`. Apply Working Bench values. Load 3 fonts
      via `next/font`, expose `--font-display/-body/-mono`. Design the full token
      list so PR 2 can override at runtime.
- [ ] **1c** 3-way theme control: `next-themes` provider replacing hardcoded
      `<html className="dark">` in `AppLayout`; `ThemeToggle` on the
      already-installed `ui/toggle-group` (System/Light/Dark).
- [ ] **1d** Retire duplicate primitives → Radix: native `Form/inputs/Select`
      /`Checkbox` → `ui/select`/`ui/checkbox`; rebind `ui/button.tsx` variants
      from `bg-slate-700/bg-red-700` to `bg-primary/bg-destructive`.
- [ ] **1e** Replace off-system UI & hardcoded colors: raw `<button>`s → `Button`
      in `editor/src/app/layout.tsx`, `git/CommitLog.tsx`,
      `SearchForm/SearchResultsModal.tsx`; `Homepage` "More" `bg-slate-700` and
      `.markdown-body a` purple/cyan → tokens.
- [ ] **1g** Add `ui/card` (rebuild `List/shared.tsx` `RecipeCard` on it) and
      `ui/badge` (browse + tag chips).
- ~~1f git-cluster dedup~~ — **deferred** (see Decisions log).

### PR 2 — Full end-user theming `ui/02-theming`

Lives in `packages/component-library` so every content-engine site inherits it.

- Runtime-overridable tokens: a theme = JSON of token values (accent, neutral,
  radius, font pairing, per-mode + per-component overrides) serialized to CSS
  custom properties on `<html>` at SSR + a pre-paint inline script (flash-free),
  layered under the light/dark class.
- Persistence: **site default** (owner config via `getSiteConfig()`/
  `@discontent/cms`) and **end-user** selection (localStorage, switchable);
  reset-to-default.
- Settings editor (`/settings`): accent/neutral/radius/font/mode controls with
  live preview; save named preset; import/export JSON; advanced per-component
  overrides behind a disclosure.
- Presets: switchable built-ins (Working Bench default + alternates).

### PR 3 — Search + tags `ui/03-search-tags`

- `tags?: string[]` on `Recipe` (model allows extra keys) + tags form field;
  index it (`RecipeEntryValue`, `buildIndexValue.ts`, FlexSearch `Document`).
  Priority filtering via field boosting; tag filter chips constrain results.
- Fix tall cards in `SearchList/index.tsx`: cap matches (first N + "+X more"),
  `max-h`/`line-clamp`, compact chips → uniform row height.
- Search page redesign: filter-chip rail + query.

### PR 4 — Homepage `ui/04-homepage`

Rebuild `common/components/Homepage/index.tsx`: bench hero (featured photo +
live scaler/timeline panel), browse-chips row backed by PR-3 tag filters, then
Featured / Latest grids on the new Card.

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
