# Pagination indexes for the content engine

This is a **durable roadmap**, not a one-shot plan. It is kept accurate as each PR lands — the
same discipline as `docs/ui-overhaul.md` and `websites/portfolio/docs/rebuild.md`, where a
closing PR existed purely to make the record true.

---

## 0. How this document is used

**Plan mode is re-entered between every phase.** Each PR in §8 and each follow-up in §9 gets
its own planning pass before any code is written; this document is the bootstrap for that pass,
so the next phase starts from written context rather than from re-reading the codebase and
re-deriving decisions already made.

That places an obligation on each PR: **leave this document true.** Concretely, a phase is not
finished until it has

- moved its row in §8 or §9 to done, with anything discovered that changed the shape of later
  phases written into them;
- recorded decisions that were _made_ rather than merely proposed — especially where the
  implementation diverged from what was planned here, and why;
- added any new follow-up the work surfaced to §9, so the map stays the complete picture rather
  than the original guess.

The failure mode this guards against is a roadmap that describes the plan instead of the
system. When those drift, the next planning pass bootstraps from fiction — which is what made a
closing "make the record true" PR necessary in the portfolio stack. Keeping it true as you go
is cheaper than a reconciliation PR at the end.

Two things worth stating plainly for whoever picks this up cold: §2 is _why_, not just _what_ —
several of its choices (ascending storage, stable-end anchoring, direction baked into the PAGED
key) look arbitrary until you see the alternative they rejected, and each records that. And §9
is deliberately over-complete: it is a survey of the whole repo, not a commitment to build all
of it.

---

## 1. Context

LMDB has no query planner — it has one thing, natural key order. The working model is to
**pre-bake a query as a keyspace**: pick the field to sort on, make it the key, and read the
result by iterating in natural order. Nothing is ever re-sorted at read time. A pagination
index is that materialization plus a page decoration.

Pagination today has none of it. Each `[page]` route calls
`getRecipes({ offset: (n-1)*PER_PAGE, limit: PER_PAGE })` → `db.getRange({ offset, limit })`,
an O(offset) cursor walk recomputed against the whole DB on every read; and every
`generateStaticParams` loads the **entire** index into an array just to count it. Three
consequences:

1. Reads recalculate pagination against the whole DB every time.
2. Nothing knows _which_ pages changed after an edit, so every consumer — revalidation, cache
   purge, future incremental builds — must assume all of them did.
3. There is exactly one ordering per content type, so "the same content, ordered or filtered
   differently" has nowhere to live.

The goal: pay pagination cost once at **write** time, make reads O(page), allow any number of
pre-baked queries per content type, and emit a precise dirty-page diff. Next's
`output: "export"` cannot rebuild a subset of pages today, so the diff is groundwork — a
future Vite export would consume the same diff for true incremental builds.

**Design constraint:** the core imports nothing from Next. A thin adapter wraps it in Next's
own caching and invalidation primitives; nothing Next already does gets hand-rolled.

---

## 2. Design

### 2.1 Anchor pages at the stable end

Ordinary pagination numbers pages from the newest item, so the _common_ write — creating
content, which lands at the newest end — shifts every position by one and changes the contents
of **every** page. It is the worst possible arrangement for incremental rebuilds.

Instead, rank from the oldest item and let the head page be partially built:

```
oldest ─────────────────────────────────────────────────► newest
[ page 0: 10 ][ page 1: 10 ][ page 2: 10 ][ page 3: 4 ← head, partial ]
                                                  ▲ new items land here
```

The index is stored in **plain ascending order, oldest first**, so an item's rank is simply its
position in the walk and `pageIndex = floor(position / perPage)`. No arithmetic, no global
quantity: an append lands at the natural end of the keyspace and no existing position moves.
Sealed pages are immutable by construction, so a create dirties only the head page.

Storage order is load-bearing, not cosmetic. Storing newest-first would mean deriving
position-from-the-stable-end as `total - 1 - d`, dragging in a `total` that must be maintained,
can drift, and needs a repair path — all to describe something the key order can just _be_.

Rarer writes behave correctly for the same reason: a backdated insert or an old delete shifts
positions only _after_ it, dirtying that page through the head and never the deep history.
Change propagates toward the volatile end.

**This only pays off if page identity is anchored at the stable end too.** If URLs counted from
the newest, then each time the head seals every numbered page would shift by one and everything
would be dirty again — the cascade reduced from every-insert to one-in-`perPage`, not
eliminated. So `pageIndex` counts from the oldest item and page 0 is the oldest content. This
inverts URL numbering relative to today; accepted.

The resulting invariant: **once a page is sealed, its content never changes** unless one of its
own items is edited or deleted.

### 2.2 The head fold

The head page holds 1…`perPage` items, so it is a poor landing page alone. `readHead` returns
pages `headPage` and `headPage - 1` together — two bounded range seeks, constant time —
yielding `perPage + 1` to `2 * perPage` items.

- `/recipes` — the landing page, `readHead()`. Volatile by nature; it is the newest content.
- `/recipes/<pageIndex>` — numbered routes for `0 … headPage - 2` only, so the head and the
  folded-in page are never duplicated across two URLs.

When the head seals and `headPage` increments, exactly one new numbered route appears — the
page previously folded into the landing, whose content was already final. **No existing
numbered page changes.** Navigation is relative: older is `pageIndex - 1`, newer is
`pageIndex + 1`, and the landing's "older" link points at `headPage - 2`.

Small corpora need no special case: under `perPage` items means `headPage` is 0, nothing to
fold, and the landing is the whole corpus; at `headPage` 1 the fold covers everything and the
numbered range is empty.

Accepted trade: URLs are stable, human-facing _labels_ are not — "page 3 of 12" counted from
the newest is `headPage - pageIndex + 1` and moves as the corpus grows. Label relatively
("Older recipes") or accept the shift. Stable URLs are the more valuable half.

### 2.3 Each keyspace is keyed for how it is read

The config supplies `key(entry)` in **ascending stable order** — for recipes, plain
`[date, slug]`. Display direction is separate, declared once as `newestFirst` and baked into
the PAGED key at _write_ time.

Both keyspaces are therefore read **forward**, each in its own natural order, and neither is
ever re-sorted:

- **SORTED** `[...sortKey, id]` ascending — walked forward by the pagination phase, where
  position _is_ rank; new items append at the end.
- **PAGED** `[pageIndex, displayRank, id]` — `pageIndex` ascends from the oldest page while
  `displayRank` descends within a page, so reading one page forward yields newest-first.

Two keys per item, each pointing the way its reader travels. The only reverse read anywhere is
the mid-page cursor resume in `readAfter`, bounded by `limit`.

An index whose display order _is_ ascending (alphabetical A–Z) sets `newestFirst: false` and
the two orders coincide. Such an index gets no stability benefit — alphabetical inserts land
anywhere, no end is stable — and degrades gracefully to ordinary pagination.

> **Decided in P1 — `displayRank` is the signed walk position, not a negated sort key.**
>
> The original plan wrote the PAGED key as `[pageIndex, ...negatedDisplaySortKey, id]`. That
> only works when every sort component is numeric: `-date` is fine, but a sort key of
> `[date, slug]` has a string component and there is nothing to negate it with, so ties within
> a date would have come back _ascending_ inside an otherwise descending page.
>
> The walk position is a single integer that already ranks the whole index in sort order, so
> negating _it_ reverses exactly, is independent of the sort key's component types, and keeps
> the key short. `displayRank = newestFirst ? -(position + 1) : position`.
>
> The `+ 1` is not cosmetic. `ordered-binary` does not encode negative zero as a number at all
> — `[1, -0, "b"]` round-trips as `[1, "", null, null, null, "b"]` and sorts _after_
> every other key in the environment. Any future key component that can go negative has to
> avoid producing `-0`.

### 2.4 Covering: the index carries what the list renders

Each entry stores a `project(entry)` payload — a link plus just enough fields for a list item —
inline in PAGED. Iterating a page yields render-ready items with **zero** reads of the content
index or the JSON data files. This is what `data/read.ts`'s `map` does today at read time,
moved to write time and materialized.

The projection is sourced from the content index value plus the id, synchronously. It
deliberately does not read data files: the pass runs on every content update and reading N JSON
files would stop it being quick. The rule — **if a list item renders it, it belongs in
`buildIndexValue`**, and the projection selects from there.

### 2.5 Diffing on projected content

Key-diffing misses the most common edit: retitling an item changes neither its key nor its
page, but the rendered page _is_ different. Each page stores a hash over its ordered
`(id, fingerprint)` sequence, and `fingerprint` defaults to **the projected payload** — so a
page is dirty exactly when what it renders changed, and a field nobody projects can never dirty
anything.

> **Decided in P1 — the page hash is also the write-amplification bound.** A page whose new
> hash matches its stored hash is skipped entirely: no keys read, none written. A page whose
> hash differs is rewritten _whole_ — its paged range is deleted and re-put, at most `perPage`
> entries. This is simpler than tracking each item's previous position, and gives the same
> bound the plan asked for, because a clean page's item positions are provably unchanged: an
> item's position is a function of `(pageIndex, offset within page)`, and both are fixed by an
> unchanged id sequence. (The one way that could break — `perPage` changing — forces a full
> rebuild through the spec hash.)

### 2.6 Page assignment is one pluggable function

Everything else — the keyspaces, the projection, the hashing, the diff — is independent of
_how_ a page is chosen. Keeping assignment behind a single `assignPage(position, perPage)` seat
makes the choice reversible:

| Strategy                                     | Append              | Backdated insert / old delete | Page size          |
| -------------------------------------------- | ------------------- | ----------------------------- | ------------------ |
| **Fixed size from the stable end** (default) | head only           | insertion page → head         | exactly `perPage`  |
| Key buckets (`/2026/03`)                     | current bucket only | that bucket only              | unbounded, uneven  |
| Content-defined chunking                     | one page only       | one page only                 | ~`perPage`, ragged |

Fixed-size-from-the-stable-end is the right default: it optimises the common write and keeps
uniform page sizes and honest "page N of M" arithmetic. It ships as
`fixedSizeFromStableEnd` in `updatePaginationIndex.ts`, the only value the `assignPage` seat
currently takes.

Content-defined chunking is the one to remember. Cut a boundary wherever
`hash(id) mod perPage === 0` (with min/max clamps) and boundaries become a property of content
rather than position, so _any_ insert dirties exactly one page, backdated or not — the trick
rsync and borg use. The cost is ragged page sizes. Not worth it while backdated writes are
rare, but it drops into the same slot.

### 2.7 Parallelism

Assigning a page needs a global position, so a chunk can't start until everything before it is
counted — and that count is the walk. Chunking the walk buys ~nothing, and LMDB serializes
writers within an env anyway, so parallel chunk writers would contend. The walk is keys-ordered
plus a hash: milliseconds at this corpus size. **The real parallelism is across indexes and
across content types** — independent envs, no contention, `Promise.all`.

---

## 3. Storage layout

One LMDB environment **per pagination index**, at
`<contentDir>/<dirname(config.indexDirectory)>/pagination/<name>/` (e.g.
`recipes/pagination/by-date/`). Separate envs rather than named sub-databases because the
existing content index stores entries in the **root** database, and lmdb's README
(`node_modules/lmdb/README.md:317`) warns against mixing the two in one env. Separate envs also
mean zero migration of existing `*.mdb` files and independent parallel writers.

| Key                               | Value                                                                  | Purpose                                                               |
| --------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `[0, ...sortKey, id]`             | `{ item, fingerprint }`                                                | **SORTED**, oldest-first — the pre-baked query; walk position is rank |
| `[1, pageIndex, displayRank, id]` | `item`                                                                 | **PAGED** — one forward range seek returns a page, newest-first       |
| `[2, pageIndex]`                  | `{ hash, count }`                                                      | per-page hash — the diff source                                       |
| `[3, id]`                         | `{ sortKey, pageIndex? }`                                              | reverse lookup: where does this item sort, and what page is it on?    |
| `[4]`                             | `{ total, headPage, perPage, specHash, updatedAt, rebuildInProgress }` | meta; O(1) `generateStaticParams` and head reads                      |

`item` is the `project(entry)` payload, carried inline in PAGED so a page read is a single
sequential scan. That duplicates the projected payload per item — the intended trade, since a
projection is a link plus a handful of fields, not the whole record. If one grows large enough
to hurt, PAGED can hold ids and pay O(log n) per item.

`fingerprint` is stored as a hash of the fingerprint value rather than the value itself, so the
per-page hash is computed over fixed-width strings and the sorted keyspace does not carry a
second copy of the projection.

The lookup is written by both phases and each owns a field: phase 1 owns `sortKey` (it is how
an update finds the _old_ sorted key to delete), phase 2 owns `pageIndex`. Phase 2 rewrites
lookups only for dirty pages, which is sound for the same reason the whole-page rewrite is: a
clean page's items did not move.

`total` is an _output_ of the pass, recomputed from the walk and rewritten each time rather
than incrementally maintained, so it serves "N of M" in O(1) and cannot drift.

`specHash` covers `{ name, perPage, newestFirst }` plus `key`/`project`/`filter`/`fingerprint`/
`getId` via `fn.toString()`, so editing a projection and forgetting to bump a version can't
leave a stale index claiming to be current — precisely the `3cec4e17` failure, where a marker
outlived the thing it vouched for. A mismatch forces a rebuild. The automatic form risks
occasional spurious rebuilds if a bundler renames variables; that is cheap and the safe
direction to err. An explicit `version` overrides it. `perPage` matters especially: changing it
re-cuts every boundary, so every page is dirty and that must be a detected rebuild, not a
silent reshuffle.

---

## 4. The two phases

**Phase 1 — item operations** (`createContent` / `updateContent` / `deleteContent`): write,
move or delete the item's SORTED entry and its lookup. No page is computed. Independent per
item and per index, so they parallelize freely.

> **Decided in P1 — `filter` runs in phase 1, not phase 2.** The plan had phase 2 apply it
> during the walk, but phase 2 reads only `{ item, fingerprint }` and no longer has the content
> index value a filter predicate needs. Filtering at write time means the sorted keyspace
> contains _exactly_ the included entries, so the walk position is the rank with no further
> qualification. A filtered-out item has its sorted entry and lookup removed, the same as a
> delete. Changing `filter` changes the spec hash and forces a rebuild, which re-applies it to
> the whole corpus.

**Phase 2 — `updatePaginationIndex({ config, paginationConfig, contentDirectory })`:**

0. If there is no meta record, the spec hash does not match, or `rebuildInProgress` is set:
   set the flag, drop keyspaces 0–3, re-run phase 1 over the whole content index, and continue.
   This makes the pass self-healing — the first call on a fresh index materializes it, and no
   caller ever needs a separate "build" entry point.
1. Read old meta + all `[2, page]` hashes into memory (page count is small).
2. Walk SORTED forward from the start, count position,
   `pageIndex = floor(position / perPage)`. Accumulate a rolling per-page hash, buffer the
   entries of dirty pages only. LMDB read transactions are snapshots, so iterating while
   buffering mutations is safe.
3. At each page boundary compare new hash to old → clean pages cost nothing; dirty pages push
   to `dirtyPages`.
4. Pages that had a stored summary and no longer appear in the walk are `removedPages`.
5. Apply buffered page rewrites, page summaries, lookups and meta inside one
   `db.transaction(...)`, so a crash can't leave a half-assigned index. A full rebuild of a
   large corpus should chunk into bounded transactions; that reintroduces a crash window, so
   meta carries `rebuildInProgress`, set at the start and cleared at the end. An index found
   with the flag set is rebuilt rather than trusted — the same rule as `specHash`.

```ts
interface PaginationUpdateResult {
  name: string;
  total: number;
  headPage: number;
  previousHeadPage: number;
  dirtyPages: number[]; // stable ids, content changed
  removedPages: number[];
  unchanged: boolean;
  rebuilt: boolean;
}
```

For the common create, `dirtyPages` is `[headPage]` and nothing else. That is the thesis.

> **Decided in P1 — a no-op pass writes nothing at all, including meta.** `updatedAt` feeds
> the `version` string that §5's cache tags and §6's client backstop are keyed on. If every
> pass bumped it, an edit to an unprojected field would invalidate every cached page while
> changing none of them — which is the exact failure the projected-content diff exists to
> avoid. The pass therefore skips the transaction entirely when nothing is dirty, nothing is
> removed, and meta already agrees.

**Designed for, not built yet — resume from the last sealed page.** Step 2 is O(N) per update,
irrelevant at this corpus size, and a full walk is much easier to get right, so v1 does exactly
that. But ascending storage makes the optimisation nearly trivial later: sealed pages are a
prefix of the walk and `headPage` is in meta, so the pass can seek to `headPage * perPage` and
reconcile only from there — one page instead of N, without needing to know what changed. Two
writes fall outside it (a backdated insert/delete shifts later positions; a deep in-place edit
changes a hash without moving anything), so phase 1 would record the lowest sort key it touched
in a pending-changes keyspace, which phase 2 starts from and clears on success. Nothing above
forecloses this.

---

## 5. Next integration

Verified against this repo's Next 16.1.6 (`next/cache.js` exports `unstable_cache`,
`revalidateTag`, `cacheTag`, `cacheLife`):

- **`React.cache` for per-render dedupe.** Every read today opens and closes an LMDB env
  (`readContentIndex.ts:41-58`), so a page rendering a list _and_ its pagination controls opens
  it twice — the same problem `CommandPalette/index.tsx:35` already documents. `cache()`
  collapses that to one open per render pass, as at
  `websites/portfolio/editor/src/settings/index.ts:1`. (The pagination envs themselves are
  already process-cached as of P1; this is about the per-render call graph.)
- **`unstable_cache` + `revalidateTag`.** Tags `pagination:<type>:<name>:page:<n>`, `…:head`,
  `…:meta`. This is the payoff for the diff: `handleContentSuccess` currently fires blanket
  `revalidatePath(listPath)` for every configured list path plus `revalidatePath("/")`
  (`genericActions.ts:20-26`); it instead revalidates the dirty tags — for a create, just the
  head. Blanket `revalidatePath` remains the fallback for content types with no indexes.
- **`generateStaticParams` from meta** (`readPaginationMeta().numberedPages`), not from loading
  the corpus.
- **`force-static` route handlers** for anything new on the export side, per the convention
  documented at `search/version/route.ts`.
- **Forward path:** `cacheComponents` is not enabled in either editor's `next.config.mjs`, so
  `"use cache"` + `cacheTag` isn't usable today. Keeping every cache call inside the adapter
  makes adopting it a one-file change later.

---

## 6. TanStack Query infinite scroll

`@tanstack/react-query` is already mounted at
`websites/recipe-website/common/context/QueryClientContext.tsx` (used by
`SearchForm/SearchContext.tsx`), so this needs no new wiring — only a payload shaped for
`useInfiniteQuery`. `readPage` / `readHead` / `readAfter` all return it:

```ts
interface PaginationPage<TItem> {
  items: TItem[];
  pageIndex: number | null; // null for a cursor read
  headPage: number;
  total: number;
  olderPage: number | null; // -> getNextPageParam
  newerPage: number | null; // -> getPreviousPageParam
  nextCursor: Key[] | null; // [...sortKey, id] of the last entry
  version: string; // specHash + updatedAt
}
```

Scrolling down walks toward older content, so
`getNextPageParam: (last) => last.olderPage ?? undefined` for page-based reads, or
`last.nextCursor ?? undefined` for cursor-based ones. Stable-end anchoring is a real gift here:
pages a reader has already scrolled past cannot change under them, which is the usual failure
mode of infinite scroll over freshly-inserted content.

`nextCursor` covers the one case ids can't — a backdated insert between fetches shifts later
positions, so a bounded reverse read of SORTED from the last item's own key is exact where a
page id would be approximate. It is the _full_ sorted-key suffix `[...sortKey, id]`, not just
the sort key: two items sharing a sort key would otherwise both be skipped on resume.
`version` is the backstop: it changes when the config or corpus changes, letting the client
drop an in-flight query rather than stitch two incompatible snapshots.

---

## 7. Core API

All functions take one options object with `config`, `paginationConfig` and an optional
`contentDirectory` — the same shape as `readContentIndex({ config, limit, offset, … })` and
`rebuildIndex({ config, contentDirectory })`.

```ts
interface PaginationIndexConfig<
  TIndexValue,
  TKey extends Key,
  TItem = TIndexValue,
> {
  name: string;
  perPage: number;
  /** Ascending / stable order — oldest first. Page assignment walks this. */
  key: (entry: { key: TKey; value: TIndexValue; id: string }) => Key;
  /** Display direction, baked into the PAGED key at write time. Default true. */
  newestFirst?: boolean;
  project?: (entry: { key: TKey; value: TIndexValue; id: string }) => TItem;
  filter?: (entry: { key: TKey; value: TIndexValue; id: string }) => boolean;
  fingerprint?: (item: TItem) => unknown; // defaults to the whole projected item
  version?: string; // overrides fn.toString() hashing
  /** Item id from its content index key. Defaults to the last tuple component. */
  getId?: (key: TKey) => string;
}
```

`packages/cms/pagination/` (core, no Next imports):

| File                         | Contents                                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                   | the config above, plus `ReadPageOptions`, `ReadHeadOptions`, `ReadAfterOptions`, `ReadPaginationMetaOptions`, `UpdatePaginationIndexOptions`, `WriteSortedEntryOptions`, `PaginationPage`, `PaginationUpdateResult` — mirroring how `content/types.ts` collects its options interfaces |
| `hash.ts`                    | `stableStringify` + `hashValue`; key-sorted so a hash depends on a projection's content, not on the order its fields were written                                                                                                                                                      |
| `database.ts`                | keyspace prefixes, directory resolution, the module-level env cache, `displayRank`/`pagedKey`/`sortedKey`, `computeSpecHash`                                                                                                                                                           |
| `writeSortedEntry.ts`        | phase 1: put/move/delete one item's SORTED entry and lookup                                                                                                                                                                                                                            |
| `updatePaginationIndex.ts`   | phase 2 + the rebuild path, one index; exports the `assignPage` seat                                                                                                                                                                                                                   |
| `updatePaginationIndexes.ts` | all declared indexes via `Promise.all`                                                                                                                                                                                                                                                 |
| `readPage.ts`                | `readPage` (one forward seek), `readHead` (head folded with `headPage - 1`), `readAfter` (keyset), `readItemPage`                                                                                                                                                                      |
| `readPaginationMeta.ts`      | O(1) `{ headPage, total, numberedPages, version }`                                                                                                                                                                                                                                     |
| `readAllIds.ts`              | keys-only walk of SORTED — for `generateStaticParams` over slugs (§9.4)                                                                                                                                                                                                                |

`packages/cms/pagination/next/` (the only place Next is imported): `tags.ts` (one owner of the
tag format), `cachedReads.ts`, `revalidate.ts`, `createPaginatedIndexRoute.ts`. **Not built
yet — P2.**

Pagination configs live in their own module (e.g. `controller/paginationConfigs.ts`) and are
listed on the content config via the optional `paginationIndexes` field; they do not import it
back, so there is no cycle. Key negation for `newestFirst` is internal — authors write the
plain ascending key and never think about it.

> **Decided in P1 — `paginationIndexes` is loosely typed on `ContentTypeConfig`.** Naming the
> config's own `TIndexValue`/`TKey` there puts `TKey` in a function _parameter_ position, which
> makes the whole interface invariant and breaks every `config as ContentTypeConfig` cast in
> the package (nine call sites). It is declared `PaginationIndexConfig<any, any, any>[]`, the
> same escape `referencedBy: ReferenceSpec[]` already uses. The precise types live at the
> declaration site, and `updatePaginationIndex({ config, paginationConfig })` still checks the
> pair when called directly.
>
> Relatedly, `getIndexDirectory` and `getContentDatabase` were narrowed to
> `Pick<ContentTypeConfig, "indexDirectory">` — they only ever read that one field, and naming
> the whole interface pinned them to its _default_ instantiation. Same narrowing, and for the
> same reason, as the one `getUploadsDirectory` already carries a comment about.

---

## 8. Rollout

Each PR on its own branch, fast-forward merged into the working branch, per project convention.
Plan mode is re-entered before each one (§0), and each one leaves this table current.

| PR     | Scope                                                                                                                                                                                                                                            | Done when                                                       | Status                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| **P1** | The core module (§7) + env cache + `packages/cms/docs/pagination.md` (this document). No consumers.                                                                                                                                              | `test/pagination.test.ts` green (§10.1)                         | **Done** — 26 tests, branch `pagination/01-core` |
| **P2** | Wire into the write path: `createContent`/`updateContent`/`deleteContent`/`rebuildIndex`, `paginationIndexes` on `ContentTypeConfig`, the Next adapter, `genericActions` tag revalidation, dirty-page artifact                                   | `packages/cms/demo` pagination spec green (§10.2)               | Not started                                      |
| **P3** | Recipe index adopts it: `paginationConfigs.ts`, `getRecipesPage`/`getRecipesHead`, landing + numbered routes via `createPaginatedIndexRoute`, `Pagination` component on stable ids. Includes the URL renumbering and the empty-trailing-page fix | add-a-recipe rebuild diff touches only the landing page (§10.3) | Not started                                      |
| **P4** | Featured recipes adopts it — the same shape, second config, proving the N-indexes-per-type path                                                                                                                                                  | featured-recipe suites green                                    | Not started                                      |
| **P5** | Per-page + head JSON route handlers, `useInfinitePagination` hook                                                                                                                                                                                | infinite-scroll Playwright spec green (§10.4)                   | Not started                                      |

**What P1 left for P2.** The type field `paginationIndexes` landed in P1 (it is inert without
callers) and `updatePaginationIndexes` reads it, so P2's wiring is: call `writeSortedEntryTo`
for each index inside `createContent`/`updateContent`/`deleteContent`, then
`updatePaginationIndexes` once; call it from `rebuildIndex` too. Two ordering constraints the
P1 work surfaced:

- The rebuild path opens the **content** environment to re-read the corpus, so pagination must
  be updated _after_ the content index env is closed, not inside its `try` block.
- Phase 1 and phase 2 are separate calls on purpose. Batching several item writes before a
  single phase 2 is correct and cheaper; calling phase 2 per item is also correct, just
  wasteful.

The dirty-page artifact is P2's; `updatePaginationIndexes` returns the results it needs and
writes nothing itself.

Everything below is a follow-up, sequenced but not scoped here.

---

## 9. Follow-up map

A survey of every surface in the repo that is paginated, or reads a whole corpus and shouldn't.
Each is a candidate PR; none block the rollout above. Each gets its own planning pass when
picked up (§0), and anything a phase discovers gets added here rather than lost.

### 9.1 Cheap wins inside the engine

**F1 — cache LMDB envs everywhere.** Every read opens an env and closes it in a `finally`
(`readContentIndex.ts:41-58`, same in `createContent`/`updateContent`/`rebuildIndex`). During a
static export that is one open+close per `generateStaticParams` _and_ per rendered page —
hundreds of map/unmap cycles for data that never changes mid-build, multiplied by the number of
indexes. `CommandPalette/index.tsx:35` already documents this cost from the other side. P1
added the cache for pagination envs (`pagination/database.ts`, with
`closePaginationDatabases()` for tests); F1 mirrors it back into `content/database.ts`. Note
that the pagination rebuild path opens and closes the content env itself, so F1 has to keep
that call working.

**F2 — fix `readContentIndex`'s `more`.** `more = (offset||0) + (limit||0) < total` evaluates to
`0 < total` for an unlimited read, so it is always `true`. Page reads derive `more` from meta
and sidestep it; the shared helper should still be correct.

**F3 — derive the search version from pagination meta.** `search/version/route.ts` builds its
version from `data.mdb`'s mtime and size — a proxy for "did the corpus change" that moves when
nothing semantic did and stays put when the index _shape_ changed, which is how `3cec4e17`
happened. `specHash + updatedAt` is a direct answer instead of a proxy, and P1's no-op-writes-
nothing rule means it does not move when nothing did.

**F14 — `updateContent.ts:25` has an unused `slug` parameter** that fails `eslint` today. It
never surfaces because `lint-staged` only lints changed files. P2 edits this file; fix it then.

### 9.2 Whole-corpus JSON shipped to clients

**F4 — chunk the search corpora.** Four route handlers each serialize an entire corpus into one
JSON: `recipe-website/{editor,export}/…/search/all/route.ts` and
`portfolio/{editor,export}/src/app/search/all/route.ts`. Paginated chunks are individually
cacheable and individually invalidated, and stable-end anchoring makes this markedly better than
it would have been — a client's cached chunks stay valid as new content arrives, since only the
head chunk ever changes. This is the single largest payoff outside the index pages themselves.

**F5 — portfolio homepage loads every project.** `portfolio/common/components/Index/page.tsx:41`
calls `getProjects()` unlimited and hands the whole array to `IndexSearchProvider`. It has no
pagination of any kind — the same problem the recipe index has, one corpus-growth away from
mattering. Natural first adopter after recipes.

### 9.3 Unpaginated list UIs

All load their whole corpus; all are natural `readPage`/`readHead` consumers. Editor-side, so no
static-export concerns.

| Surface                           | Call site                                              |
| --------------------------------- | ------------------------------------------------------ |
| F6a Portfolio editor project list | `portfolio/editor/…/(settings)/projects/page.tsx:29`   |
| F6b Portfolio editor pages list   | `portfolio/editor/…/(settings)/pages/page.tsx:25`      |
| F6c Recipe editor pages list      | `recipe-website/editor/…/(settings)/pages/page.tsx:30` |
| F6d Resume builder resume list    | `resume-builder/src/controller/data/readIndex.ts:14`   |
| F6e Menus settings lists          | `(settings)/menus/page.tsx`, both sites                |

### 9.4 `generateStaticParams` full loads

**F7 — enumerate slugs without deserializing values.** Six routes load an entire corpus purely
to list slugs: `recipe/[slug]`, `featured-recipe/[slug]`, `project/[slug]`, and the `[...slug]`
pages routes on both export sites. A pagination index's SORTED keyspace _is_ the id list, so a
keys-only walk (`readAllIds`, shipped in P1) replaces a full value-deserializing read. Cheap and
mechanical.

### 9.5 New capability the machinery unlocks

**F8 — static per-tag pages.** `tagSearchHref` currently routes a tag to
`/search?q=tag:<tag>` (`queryLanguage.ts:539`), which needs the client search bundle to render
anything. With `filter` on a pagination config, each tag becomes its own pre-baked paginated
index and `/tags/<tag>` and `/tags/<tag>/<page>` become real static pages — indexable, no JS,
and dirty-tracked like any other. This is the first thing here that is a _feature_ rather than a
refactor, and it is the strongest argument for N-indexes-per-content-type. Needs a decision on
index-per-tag vs one index keyed `[tag, date, slug]`. Note that P1's filter-in-phase-1 decision
prices this: a per-tag index costs one sorted-keyspace write per matching item per tag on every
content write, so a corpus with many tags per item favours the single `[tag, date, slug]` index.

**F9 — infinite-scroll toggle on the recipe index.** P5 delivers the mechanism; this is the UX:
the control itself, where the preference persists, how it interacts with the numbered
`Pagination` component, and what a deep link to a numbered page does for a reader with infinite
scroll on. A UI decision set rather than a continuation of the engine work, so its planning pass
(§0) should expect to spend most of its time on the UX questions, not the data ones.

### 9.6 Adjacent, same idea, different shape

**F10 — `getAllTags` is a full corpus scan per call.** `data/read.ts:95-108` reads every recipe
and builds a `Set` on every render of the recipe form. The same materialize-at-write-time idea
applies, but an aggregate is not a pagination — it suggests generalising to _derived indexes_,
of which pagination is the first kind and aggregates the second. Worth its own design.

**F11 — alternative page-assignment strategies.** Key buckets for archive navigation
(`/recipes/2026/03`), or content-defined chunking if backdated writes become common. Both slot
into the `assignPage` seat (§2.6).

**F12 — early-exit reconciliation.** The O(changed suffix) optimisation in §4, plus the
pending-changes keyspace it needs. Worth doing only if the full walk shows up in a profile.

**F13 — incremental rendering.** Blocked on the export framework, not on this module. The
dirty-page artifact from P2 is the interface a Vite export would consume.

---

## 10. Verification

**10.1 `test/pagination.test.ts`** — **done, 26 tests green.** Vitest,
`// @vitest-environment node` (the repo default is jsdom and this opens real LMDB envs in a
tmpdir). The anchoring properties are the heart of it:

- **append dirties only the head**: `dirtyPages === [headPage]`, and every sealed page's stored
  hash is byte-identical.
- **sealing**: appending until the head reaches `perPage` increments `headPage`, exposes exactly
  one new numbered page, and changes no existing page.
- **write amplification**: the count of PAGED keys written on an append is measured (by wrapping
  `db.put`) and bounded by `perPage` over a 48-item corpus, not by N.
- **backdated insert** dirties the insertion page through the head and nothing older; **delete**
  of an old item populates `removedPages` and dirties from that page forward.
- `readHead` returns `perPage + 1` … `2 * perPage` items across five corpus sizes and never
  overlaps a numbered route; landing plus numbered routes cover the corpus exactly once; the
  small-corpus cases (`headPage` 0 and 1) produce no numbered routes.
- **covering**: `readPage` returns complete render-ready items after the _content_ index
  directory is renamed away.
- **projection precision**: editing a projected field dirties exactly one page; editing an
  unprojected field leaves every hash unchanged _and_ leaves `version` untouched; changing
  `project` or `perPage` changes `specHash` and forces a rebuild.
- **forward-only reads**: a page comes back newest-first from a plain forward seek, and
  `newestFirst: false` comes back ascending.
- `rebuildInProgress` set by hand ⇒ the index is rebuilt rather than read; and an index with no
  meta at all builds itself from the content index on first use.
- a second index with a different `key`, `project`, `perPage` and `filter` over the same content
  type stays independent — an edit that changes only the filtered index reports `unchanged` on
  the other.
- `readAfter` walks a 23-item corpus with no duplicate and no gap, and picks up an item inserted
  below the cursor between calls.
- page contents match a naive offset-based reference implementation over a 34-item corpus.

**10.2 `packages/cms/demo`** — a paginated notes list plus a fixture spanning several pages, and
`pagination.spec.ts` alongside the existing `read.spec.ts` using the `resetData` fixture.
End-to-end proof through real create/update/delete actions, and where to assert that creating a
note leaves older pages' caches intact — i.e. tag revalidation really is narrower than blanket
`revalidatePath`.

**10.3 The thesis check.** Build `websites/recipe-website/export`, add a recipe, rebuild, and
diff the two `out/` trees. Only the landing page and the head JSON should differ. Run this by
hand at P3; it is the claim the whole design rests on.

**10.4 Infinite scroll** — a Playwright spec that scrolls the recipe list and asserts each fetch
appends items with no duplicate slug across pages, per the project convention of verifying UI
through Playwright rather than a browser.

**10.5 Regression** — existing Playwright suites for recipe-website and portfolio stay green
(the container suite noted in the project memory), since the write path changes. Not yet
relevant: P1 has no consumers, and the full vitest suite (122 tests) is green.

---

## 11. Migration

Page numbering inverts, so existing `/recipes/2`-style URLs change meaning — accepted. Nothing
else migrates: pagination indexes are derived state built fresh beside the existing content
indexes, no `*.mdb` file changes format, and a rollback is deleting a directory. An index that
is deleted, or that predates a config change, rebuilds itself on the next
`updatePaginationIndex` call with no operator action.
