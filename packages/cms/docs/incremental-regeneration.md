# Incremental regeneration for the content engine

This is a **durable roadmap**, not a one-shot plan. It is kept accurate as each PR lands — the
same discipline as `docs/ui-overhaul.md` and `websites/portfolio/docs/rebuild.md`, where a
closing PR existed purely to make the record true.

---

## 0. How this document is used

**Plan mode is re-entered between every phase.** Each PR in §10 and each follow-up in §11 gets
its own planning pass before any code is written; this document is the bootstrap for that pass,
so the next phase starts from written context rather than from re-reading the codebase and
re-deriving decisions already made.

That places an obligation on each PR: **leave this document true.** Concretely, a phase is not
finished until it has

- moved its row in §10 or §11 to done, with anything discovered that changed the shape of later
  phases written into them;
- recorded decisions that were _made_ rather than merely proposed — especially where the
  implementation diverged from what was planned here, and why;
- added any new follow-up the work surfaced to §11, so the map stays the complete picture rather
  than the original guess.

The failure mode this guards against is a roadmap that describes the plan instead of the
system. When those drift, the next planning pass bootstraps from fiction — which is what made a
closing "make the record true" PR necessary in the portfolio stack. Keeping it true as you go
is cheaper than a reconciliation PR at the end.

That obligation is also what produced **this** document. The stack's first three PRs were
organized around pagination, because pagination is where the work started; planning the fourth
surfaced that pagination is one _kind_ of derived artifact rather than the deliverable, and that
the actual thesis was sitting at the bottom of the old document as a deferred follow-up. The
record was mis-framed rather than untrue, which §0 covers just as much. Renaming and
re-sequencing was cheaper than planning a second phase from a frame that had already been
outgrown.

Two things worth stating plainly for whoever picks this up cold: §3 is _why_, not just _what_ —
several of its choices (ascending storage, stable-end anchoring, direction baked into the PAGED
key) look arbitrary until you see the alternative they rejected, and each records that. And §11
is deliberately over-complete: it is a survey of the whole repo, not a commitment to build all
of it.

---

## 1. The goal: minimum-page regeneration

**This project is a content layer for static site generators: pagination and invalidation logic
precise enough that a build regenerates the minimum number of pages for any individual content
update.**

A write to one content item produces a **regeneration set** — the identified artifacts a static
build must re-render, and nothing else. Content files are the only source of truth; everything
else is derived, and each derived kind declares how a content change maps to the artifacts it
invalidates. The engine's job is to keep that set minimal and correct. The export framework's
job is to consume it.

Pagination is the first and most developed instance of that idea, not a separate project. Its
dirty-page diff (`PaginationUpdateResult.dirtyPages`) is the only precise regeneration set the
engine currently produces, which is why so much of this document is about it.

**What there was before.** Pagination had none of it. Each `[page]` route called
`getRecipes({ offset: (n-1)*PER_PAGE, limit: PER_PAGE })` → `db.getRange({ offset, limit })`,
an O(offset) cursor walk recomputed against the whole DB on every read; and every
`generateStaticParams` loaded the **entire** index into an array just to count it. Three
consequences:

1. Reads recalculated pagination against the whole DB every time.
2. Nothing knew _which_ pages changed after an edit, so every consumer — revalidation, cache
   purge, incremental builds — had to assume all of them did.
3. There was exactly one ordering per content type, so "the same content, ordered or filtered
   differently" had nowhere to live.

Read against the goal, (1) and (3) are ordinary performance and flexibility problems, but (2)
is the structural one: those were symptoms of having no regeneration set at all, not of bad
pagination. Fixing (2) is what the rest of this document is for. Pay the cost once at **write**
time, make reads O(page), allow any number of pre-baked queries per content type, and emit a
precise diff.

**Design constraint:** the core imports nothing from Next. A thin adapter wraps it in Next's
own caching and invalidation primitives; nothing Next already does gets hand-rolled. Next's
`output: "export"` cannot rebuild a subset of pages today, so for now the diff feeds cache-tag
invalidation and a build-consumable artifact rather than a partial build. The export framework
that would consume it for a true incremental build is the follow-up (§11.3); the regeneration
set itself is not.

---

## 2. The model: sources, derived artifacts, and the dependency graph

Content files are the only source. Every other artifact the sites serve is derived from them,
and each derived kind is defined by how a content write maps to the artifacts it invalidates.
Naming the kinds is most of the work — once a surface has a name here, "what does a write to X
do to it" is a question with an answer rather than a shrug.

| Derived kind         | Examples in this repo                         | What a write invalidates today                                     |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| **Item pages**       | `/recipe/<slug>`, `/project/<slug>`           | precise for the written item; not modelled for pages that embed it |
| **Pagination pages** | `/recipes`, `/recipes/<n>`                    | **precise** — `dirtyPages` / `removedPages` (§3–§5)                |
| **Aggregates**       | `getAllTags`, the homepage's newest-six strip | nothing is derived at all — recomputed per render from the corpus  |
| **Corpus documents** | `search/all`, `search/version`                | one blob per corpus, rebuilt whole on any write                    |

Two consequences of that table are worth stating outright.

**A write should return a regeneration set, not a boolean.** `ContentWriteResult`
(`content/types.ts:20-22`) today carries `pagination: PaginationUpdateResult[]` and nothing
else, because pagination is the only kind that produces one. Everything else falls back to
blanket `revalidatePath` — which is exactly why `paginationOnly` is still off for recipes even
though the recipe index itself is fully precise (§10). The shape to grow toward is one result
per derived kind, per content type.

**Derivation crosses content types.** A derived artifact of type B can depend on the content of
type A, and this repo already has the case: a featured-recipe card renders the _referenced
recipe's_ name and image (`common/components/List/FeaturedRecipe/index.tsx:19-38`), while
`FeaturedRecipeEntryValue` holds only `{ recipe, note }`.

That gap is currently paid for twice, in both directions:

- **On read**, `getFeaturedRecipes` (`readFeaturedRecipes.ts:69-85`) enriches each entry with an
  `await getRecipeBySlug(...)` — an N+1 data-file read per page, wrapped in a `try`/`catch` that
  silently degrades to an unnamed, imageless card when the referenced recipe is gone. A
  pagination projection cannot do this at all: `project` is synchronous by contract, and
  deliberately so (§3.4).
- **On write**, the only content-to-content invalidation that exists is a rename-triggered full
  pagination rebuild of the referencing type (`updateContent.ts:170-205`), recorded as F15. It
  over-invalidates when it fires, and it fires only on rename — so an ordinary recipe edit that
  changes a name leaves every featured card that renders that name stale, with nothing anywhere
  aware of it.

The edge those two want already exists in the config. `ReferenceSpec` (`content/types.ts:28-54`)
declares that featured-recipes references recipes via `indexField: "recipe"`; it is simply only
ever read to rewrite slugs on rename. **The reference specs are the dependency graph — they are
just not read as one yet.** §6 is the design for reading them as one.

**Scope.** The substrate's first cut (D1) is content-to-content dependencies only, because that
is the case with a concrete consumer waiting on it (D2). Corpus documents (F4) and aggregates
(F10) are later derived kinds plugged into the same graph, not part of the first design — they
have a different shape, since they depend on the _whole_ corpus rather than on identified items,
and the interesting question there is chunking rather than dependency lookup.

---

## 3. Pagination: the first derived-index kind

Everything in this section is shipped (P1–P3). It is the most developed derived kind by a wide
margin, and the reference for what "precise" should mean for the others.

LMDB has no query planner — it has one thing, natural key order. The working model is to
**pre-bake a query as a keyspace**: pick the field to sort on, make it the key, and read the
result by iterating in natural order. Nothing is ever re-sorted at read time. A pagination
index is that materialization plus a page decoration.

### 3.1 Anchor pages at the stable end

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
inverts URL numbering relative to what recipes served before; accepted.

The resulting invariant: **once a page is sealed, its content never changes** unless one of its
own items is edited or deleted.

### 3.2 The head fold

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

> **Constraint P2 surfaced, binding on P3 — a numbered page must not render a global total.**
> The meta tag is deliberately separate from the page tags so that a changing `total` does not
> invalidate every page: `total` moves on almost every write, and folding it into the page tags
> would hand back the entire benefit of the dirty-page diff. That separation only holds if
> nothing a numbered page renders depends on meta. §3.2 already accepts that human-facing
> labels are unstable; this makes it a rendering rule rather than a preference. The landing page
> is free to print a total — it is invalidated by any write that changes one.

### 3.3 Each keyspace is keyed for how it is read

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
> — `[1, -0, "b"]` round-trips as `[1, "", null, null, null, "b"]` and sorts _after_
> every other key in the environment. Any future key component that can go negative has to
> avoid producing `-0`.

### 3.4 Covering: the index carries what the list renders

Each entry stores a `project(entry)` payload — a link plus just enough fields for a list item —
inline in PAGED. Iterating a page yields render-ready items with **zero** reads of the content
index or the JSON data files. This is what `data/read.ts`'s `map` does today at read time,
moved to write time and materialized.

The projection is sourced from the content index value plus the id, synchronously. It
deliberately does not read data files: the pass runs on every content update and reading N JSON
files would stop it being quick. The rule — **if a list item renders it, it belongs in
`buildIndexValue`**, and the projection selects from there.

That rule is what §2 runs into for featured recipes: a card renders a field that belongs to
_another_ content type, so no synchronous projection over this type's index value can cover it.
The fix keeps `project` synchronous and makes the content index value covering instead, by
resolving the borrowed fields at write time (§6) — which is the same rule, applied one level
earlier.

### 3.5 Diffing on projected content

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

### 3.6 Page assignment is one pluggable function

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
rare, but it drops into the same slot. It is also the natural chunking strategy for corpus
documents (F4), which is worth knowing before designing that kind.

### 3.7 Parallelism

Assigning a page needs a global position, so a chunk can't start until everything before it is
counted — and that count is the walk. Chunking the walk buys ~nothing, and LMDB serializes
writers within an env anyway, so parallel chunk writers would contend. The walk is keys-ordered
plus a hash: milliseconds at this corpus size. **The real parallelism is across indexes and
across content types** — independent envs, no contention, `Promise.all`.

---

## 4. Storage layout

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
outlived the thing it vouched for. A mismatch forces a rebuild. An explicit `version` overrides
it. `perPage` matters especially: changing it re-cuts every boundary, so every page is dirty
and that must be a detected rebuild, not a silent reshuffle.

> **Decided in P2 — `fn.toString()` hashing is not build-stable, and that is worse than
> "occasional".** P1 recorded the risk of a bundler renaming variables as a cheap, rare,
> safe-direction cost. It is neither cheap nor rare: a production build minifies the config's
> functions and a dev server does not, so an index written by one and read by the other
> mismatches **every time**. The demo hit this immediately — fixtures are generated against
> `next dev` and the suite runs against `next start`, so every pagination assertion saw a full
> rebuild instead of the one dirty page it expected.
>
> The automatic form stays the default: it is right for a single process, and it is the thing
> that catches an edited projection. But **any index whose keyspace outlives one build must set
> an explicit `version`** — which is every index in a real deployment, since the editor and the
> export site are separate builds sharing a content directory. `demo/lib/notePagination.ts`
> carries `version: "1"` and a comment saying why. Recorded as **F16**.

> **Decided in P2 — a cached environment is invalidated by inode, not trusted forever.**
> An open LMDB environment holds its data file mapped, and unlinking that file leaves the
> mapping valid and pointing at an inode nothing else can reach. P1's process-wide env cache
> would therefore keep answering from content that is no longer on disk, with writes vanishing
> into the unlinked copy. That is not hypothetical — a content directory is a separate
> repository replaced wholesale by a sync, and the demo's harness swaps one out between every
> test. `getPaginationDatabase` now records `dev:ino` of `data.mdb` at open time and reopens
> when it no longer matches. One `statSync` per lookup, against an LMDB open it already
> avoided.

---

## 5. The two phases

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

For the common create, `dirtyPages` is `[headPage]` and nothing else. That is the thesis — and
it is the shape every other derived kind's result should end up resembling (§2).

> **Decided in P1 — a no-op pass writes nothing at all, including meta.** `updatedAt` feeds
> the `version` string that §7's cache tags and §8's client backstop are keyed on. If every
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

## 6. Dependency-tracked invalidation

**Status: designed here, not built. This is D1's scope**, written down so D1's planning pass
(§0) starts from something concrete rather than re-deriving §2. Treat the specifics as a sketch
to be firmed up in that pass; treat the shape as decided.

The problem, restated from §2: a derived artifact of type B can render fields belonging to a
content item of type A, and the engine has no way to know it. `project` is synchronous and sees
only B's own index value (§3.4), so B's pagination index cannot cover such a field at all; and
the only invalidation crossing the type boundary is a rename-triggered full rebuild
(`updateContent.ts:170-205`).

### 6.1 Borrowed index-value fields

A content type may declare that its index value **borrows fields from a referenced type** — so
`FeaturedRecipeEntryValue` carries `recipeName` and `recipeImage` alongside `{ recipe, note }`.
Resolution is **async and engine-owned**: the engine reads the referenced item and hands the
already-resolved values to `buildIndexValue`, which stays a pure synchronous function of what
it is given.

That split is the whole point. It keeps phase 2 a pure walk over materialized values (§5), it
keeps `project` synchronous (§3.4), and it makes the **content** index covering rather than
only the pagination index — so `getFeaturedRecipes` stops doing its N+1 enrichment read
(`readFeaturedRecipes.ts:69-85`) whether or not featured recipes ever adopt pagination. The
capability is worth having on its own; pagination is one consumer of it.

Open for D1's pass: whether resolution reads the referenced content _index value_ (cheap, and
consistent with the rule that projections read index values) or its data file (expensive, but
reaches fields the index does not carry); whether a borrowed field may itself be borrowed, and
if so what bounds the depth; and what a dangling reference resolves to, since today's read path
silently degrades to an unnamed card inside a `catch`.

### 6.2 Dependent resolution on write

A write to X finds its dependents, rebuilds their index values, and syncs their pagination —
yielding **precise dirty pages for the dependent type** instead of a forced full rebuild.

Dependent lookup starts by reusing the existing `indexField` iteration that `updateReferences`
already performs: the scan exists, corpora are small, and it needs no new keyspace to maintain
or repair. A reverse-dependency keyspace (`[refType, refId] → dependents`) is the obvious later
optimisation — noted here, deliberately not specified, and not worth building before something
profiles slow.

This **subsumes F15**, which asked for exactly this narrowing and named the two ways to get it:
returning per-type results, or having `updateReferences` do precise per-item sync. §6.1 makes
the second viable, because a resolved index value is something the engine can rebuild from one
place instead of two.

### 6.3 Per-type write results

`ContentWriteResult` must grow to carry results **per content type**. Its current docstring
(`content/types.ts:15-19`) says results for other content types touched by a rename are
"deliberately not here… until F15" — and this is F15. Until then those results ride only on the
dirty-page artifact and the blanket `revalidatePath` fallback, which is one of the two things
keeping `paginationOnly` off (§10).

### 6.4 Make the trigger precise, not just narrower

Invalidation must fire on **any change to a borrowed field**, not only on rename. Note the
tension plainly, because it reads like a contradiction: F15 wants the rename rebuild _narrower_
(fewer pages per fire), while this wants the trigger _broader_ (more writes fire it). They are
the same fix. The trigger today is coarse in both directions at once — it fires for the wrong
reason (any rename, whether or not anything rendered changed) and misses the right one (a
borrowed field changing without a rename).

A borrowed-field declaration is what makes precision possible: it names exactly which fields of
A a dependent of B renders, so a write to A can compare old and new values of just those fields
and do nothing at all when none of them moved. A rename becomes an ordinary case of that — the
slug is a borrowed field like any other — rather than the one case with special handling.

---

## 7. Next integration

Verified against this repo's Next 16.1.6 (`next/cache.js` exports `unstable_cache`,
`revalidateTag`, `cacheTag`, `cacheLife`):

- **`React.cache` for per-render dedupe.** Every read today opens and closes an LMDB env
  (`readContentIndex.ts:41-58`), so a page rendering a list _and_ its pagination controls opens
  it twice — the same problem `CommandPalette/index.tsx:35` already documents. `cache()`
  collapses that to one open per render pass, as at
  `websites/portfolio/editor/src/settings/index.ts:1`. (The pagination envs themselves are
  already process-cached as of P1; this is about the per-render call graph.)
- **`unstable_cache` + `revalidateTag`.** Tags `pagination:<type>:<name>:page:<n>`, `…:head`,
  `…:meta`, plus a catch-all `pagination:<type>:<name>` on every entry. This is the payoff for
  the diff: `handleContentSuccess` fired blanket `revalidatePath(listPath)` for every configured
  list path plus `revalidatePath("/")`; it now also revalidates the dirty tags — for a create,
  just the head and the meta record. Blanket `revalidatePath` remains, and remains the default:
  see `paginationOnly` in §10's P2 notes.

  > **Decided in P2 — the tag is expired, not marked stale.** Next 16 made `revalidateTag`'s
  > second argument required. A named cache-life profile (`"max"`) means
  > stale-while-revalidate, and the implementation deliberately does _not_ mark the path
  > revalidated in that case, so the action that wrote the content would not read its own
  > write — the redirect after a create would land on a stale page. The adapter passes
  > `{ expire: 0 }`. `updateTag(tag)` means the same thing but throws outside a Server Action,
  > which would shut route handlers and scripts out of the adapter.

- **`generateStaticParams` from meta** (`readPaginationMeta().numberedPages`), not from loading
  the corpus.
- **`force-static` route handlers** for anything new on the export side, per the convention
  documented at `search/version/route.ts`.
- **Forward path:** `cacheComponents` is not enabled in either editor's `next.config.mjs`, so
  `"use cache"` + `cacheTag` isn't usable today. Keeping every cache call inside the adapter
  makes adopting it a one-file change later.

---

## 8. TanStack Query infinite scroll

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

## 9. Core API

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
| `readAllIds.ts`              | keys-only walk of SORTED — for `generateStaticParams` over slugs (§11.2/F7)                                                                                                                                                                                                            |
| `syncContentItem.ts`         | **P2** — `syncPaginationIndexes`: the one call the content layer makes after writing an item. Phase 1 for every declared index, phase 2 once, then records the artifact. Returns `[]` and does nothing for a config with no indexes                                                    |
| `changes.ts`                 | **P2** — the dirty-page artifact: `recordPaginationChanges` (merging), `readPaginationChanges`, `clearPaginationChanges`                                                                                                                                                               |

`packages/cms/pagination/next/` is the only place Next is imported, and holds four files:
`tags.ts` (one owner of the tag format), `cachedReads.ts` (`createCachedPaginationReads` →
`readPage`/`readHead`/`readMeta`) and `revalidate.ts` (`revalidatePaginationResults`), all from
**P2**; plus `createPaginatedIndexRoute.ts` from **P3**, deferred out of P2 because a route
factory with no consumer is guesswork. It returns `{ landing, numbered, generateStaticParams }`
from a `reads` object and a `render` function, which collapses an adopter's four route files
(landing and numbered, in the editor and the export) to one line each.

Its `firstPageNumber` option (default `1`) is the single seat where "URLs count from 1" lives.
Internally a page id is 0-based and anchored at the oldest item; the factory adds the offset on
the way out and subtracts it on the way in, so no adopter does that arithmetic and no two
adopters can disagree about it. The param name is fixed at `page`, because the directory name
`[page]` already fixes it. There is no separate `staticParams` helper —
`readPaginationMeta().numberedPages` already _is_ the list.

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

## 10. Rollout

Each PR on its own branch, fast-forward merged into the working branch, per project convention.
Plan mode is re-entered before each one (§0), and each one leaves this table current.

The P-series built the pagination kind end to end. The D-series builds the dependency substrate
underneath it, then takes the first consumer through both.

| PR     | Scope                                                                                                                                                                                                                                                 | Done when                                                       | Status                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| **P1** | The core module (§9) + env cache + this document. No consumers.                                                                                                                                                                                       | `test/pagination.test.ts` green (§12.1)                         | **Done** — 26 tests, `ab7a3994`                |
| **P2** | Wire into the write path: `createContent`/`updateContent`/`deleteContent`/`rebuildIndex`, the Next adapter, `genericActions` tag revalidation, dirty-page artifact                                                                                    | `packages/cms/demo` pagination spec green (§12.2)               | **Done** — 38 vitest + 82 demo e2e, `ae4eb8d9` |
| **P3** | Recipe index adopts it: `paginationConfigs.ts`, `readRecipePages.ts`, landing + numbered routes, `createPaginatedIndexRoute` (moved here from P2), `Pagination` component on stable ids. Includes the URL renumbering and the empty-trailing-page fix | add-a-recipe rebuild diff touches only the landing page (§12.3) | **Done** — `ec7cc2b3`, notes below             |
| **D0** | Reframe: rename this document to `incremental-regeneration.md`, add §1/§2/§6, re-sequence this table, re-bucket §11. Doc only, no code                                                                                                                | the record is true against the code; §12 unmoved                | **Done** — this PR                             |
| **D1** | The dependency substrate (§6): borrowed index-value fields, engine-owned async resolution, dependent lookup on write, per-type `ContentWriteResult`                                                                                                   | a recipe rename dirties only the featured pages that show it    | **Next**                                       |
| **D2** | Featured recipes adopt pagination _and_ borrowed fields — first consumer of both, and the N-indexes-per-type path                                                                                                                                     | featured-recipe suites green against an enlarged fixture        | Not started                                    |
| **D3** | Per-page + head JSON route handlers, `useInfinitePagination` hook                                                                                                                                                                                     | infinite-scroll Playwright spec green (§12.4)                   | Not started                                    |

**D2 carries the fixture work, and it is more than a fixture.** `many-featured-recipes` is 15
items at `perPage` 12 (`FeaturedRecipeIndexPage/constants.ts`), which under stable-end anchoring
gives `headPage` 1 — the fold covers the whole corpus and `numberedPages` is **empty**, so there
would be no numbered route left to test at all. It has to grow to ~40, matching `many-recipes`,
so the landing folds two pages and `/featured-recipes/1` and `/2` exist. The other fixtures were
checked: `many-recipes` (40) and the demo's `many-notes` (14 at `perPage` 4) already produce
numbered pages, and no other fixture backs a pagination test.

Two knock-ons D2's planning pass should expect:

- **Five specs share that fixture** — `featured-recipes`, `search`, `visual`, `accessibility`
  and `mobile` all `resetData("many-featured-recipes")`. Enlarging it changes what they see, and
  `visual.spec.ts` plus the page-2 pagination test take **snapshots**, so snapshot regeneration
  is part of the work (see the sub-2% regen note in the project memory).
- **`featured-recipes.spec.ts`'s five pagination tests assert the old semantics** —
  `aria-current="page"`, "Go to next page", and `/featured-recipes/1` redirecting to the
  landing. P3 deleted exactly those semantics for recipes (see its decision note below); the
  featured suite has to follow.

D2 will also need `editor/scripts/build-fixture-pagination.ts` re-run, for the reason P3 records
below.

**What P2 built, and what it left for P3.**

The write path has exactly five functions that touch the content index, all in
`packages/cms/content/`: `createContent`, `updateContent`, `deleteContent`, `rebuildIndex`,
`updateReferences`. That is the complete seam — no app code writes the index directly. Every
one of them now keeps pagination in step, and all of them do it _after_ the content index
environment is closed, because the rebuild path inside phase 2 opens that environment itself.

- `createContent` / `updateContent` / `deleteContent` call `syncPaginationIndexes`, and their
  return type changed from `Promise<void>` to `Promise<ContentWriteResult>`
  (`{ pagination: PaginationUpdateResult[] }`). Every pre-existing caller ignores the value, so
  this is non-breaking; `genericActions` needs it to know which tags to fire.
- `rebuildIndex` calls `updatePaginationIndexes({ force: true })`. This is what gives a fresh
  checkout its pagination indexes — its ~10 callers (`exportAction.ts`, `sync.ts`, the seed
  scripts) all inherit it unchanged.
- A slug rename forces a full pagination rebuild of each _referencing_ type — F15, now D1's §6.

**`force` is new API surface P2 had to add.** `rebuildIndex` drops and re-derives the content
index without touching the sorted keyspace, and `updateReferences` writes content index entries
directly. After either, meta still matches a spec hash that vouches for nothing, so phase 2
alone would walk stale entries. The caller knows the index is untrustworthy; the index does not.

> **Decided in P2 — `rebuilt` forces the meta write.** P1's rule that a no-op pass writes
> nothing at all held because every path to a rebuild also made meta stale. A _forced_ rebuild
> of an index that turns out to be current breaks that: `rebuildSortedKeyspace` raises
> `rebuildInProgress` and only the final transaction lowers it, so skipping the transaction
> would leave the index permanently mid-rebuild, rebuilding itself on every subsequent pass
> forever. Only an empty index actually reaches this — a rebuild drops the page summaries, so a
> non-empty one always reports every page dirty — but it is a real, reachable state.
>
> That last point is worth stating on its own: **a rebuild has no diff source, so it reports
> every page dirty.** This is exactly why `rebuilt` maps to the index's catch-all cache tag
> rather than to page tags.

**Safety property.** A content type that does not declare `paginationIndexes` gets `[]` back
from `syncPaginationIndexes` having opened nothing and written nothing. P2 is therefore a
behavioural no-op for every existing content type in the repo; the demo's notes are the only
thing that opts in, and the demo's bookmarks stay out precisely so the suite keeps proving it.

**`paginationOnly` is off by default.** `genericActions` now fires
`revalidatePaginationResults` alongside the existing blanket `revalidatePath` calls, and only
skips the blanket ones when `ContentSuccessConfig.paginationOnly` is set. Nothing sets it — and
P3 still does not, though it did narrow `listPaths` to empty for recipes; see the P3 notes
below. Narrowing revalidation is proven per content type, with each site's Playwright suite as
the safety net — not assumed, because a surface still reading through `readContentIndex` has no
tag to be told about. In §2's terms: `paginationOnly` can only go on once _every_ derived kind a
site serves produces a regeneration set, not just the pagination one.

**Phase 1 and phase 2 stay separate calls** on purpose. Batching several item writes before a
single phase 2 is correct and cheaper; calling phase 2 per item is also correct, just wasteful.

**What P3 built, and what it left.**

The recipe index is the first real adopter: `recipesByDate` in
`common/controller/paginationConfigs.ts`, `recipePages` in
`common/controller/data/readRecipePages.ts`, and all four route files reduced to a re-export of
`createPaginatedIndexRoute`'s output. The offset walk and the full-corpus
`generateStaticParams` are both gone.

> **Decided in P3 — URLs are 1-based, the number displayed is the stable id plus one, and the
> landing has no number.** Page ids count from the oldest item so a create moves nothing, but a
> URL starting at 0 is unidiomatic, so `firstPageNumber` (§9) offsets it once for everyone.
> `/recipes/1` is therefore the _oldest_ page rather than an alias for the landing, and the
> `pageNumber === 1 → redirect` branch is deleted. The landing prints no number at all: it sits
> on the head, whose id moves every time the head seals, and a number that moves would break the
> only promise the number makes. Relative "Newer"/"Older" controls are the prominent
> affordance. No surface prints a global total (§3.2's constraint).

> **Decided in P3 — the recipe projection carries five fields, not nine.** A list row renders
> `slug`, `date`, `name`, `image`, `tags`; `getRecipes` also drags `description`, `ingredients`
> and the three times through for the _search_ corpus. Only the projection is hashed (§3.5), so
> anything left out of it can never dirty a page — editing a description now moves no numbered
> page at all. Note the `date`: it lives in the content index _key_, not the value, so both
> `key` and `project` read it from `entry.key`.

**Recipes narrow `listPaths`, but do not set `paginationOnly`.** Both success configs drop
`/recipes` and `/recipes/[page]` to `listPaths: []`, handing those two surfaces to the
pagination tags. `revalidatePath("/")` still fires, because the homepage's newest-six strip and
the recipe form's tag cloud (`getAllTags`) both still read the whole content index and have no
tag to be told about. Flipping `paginationOnly` on is blocked on F10 (§11.1) — the aggregate
kind, of which those two readers are the repo's clearest examples.

**A test harness that rewinds content must expire pagination tags.** Same trap the demo hit
(§12.2): `resetData` rolls the content directory back to a fixture, which is not a write, fires
no tags, and leaves the server serving pages cached from the previous fixture.
`/settings/test-invalidate-cache` was `revalidatePath("/", "layout")` and nothing else —
`revalidatePath` does not touch `unstable_cache` tags — so it now also expires
`recipePages.tags.all`.

**Every existing fixture needed the keyspace built.** A Playwright fixture is a content
directory captured on disk, LMDB files and all, and reads do not self-heal an unbuilt index — so
the fixtures generated before recipes declared one served an empty `/recipes`. Only one test
caught it (the homepage's "more recipes" link), because the rest assert a 200 and a banner,
which an empty state satisfies. `editor/scripts/build-fixture-pagination.ts` walks the fixtures
and runs `updatePaginationIndexes({ force: true })` over each; the resulting `*.mdb` files are
committed exactly as `recipes/index` already was. Run it whenever a `paginationIndexes` entry is
added or changed — D2 will need it again. The same hazard applies to a live content directory,
which is what `rebuildRecipeIndex()` in `exportAction` and the Maintenance rebuild button cover.

**Content repositories gitignore the pagination directory.** `initializeContentGit` runs
`git.add(".")`, which would otherwise sweep the LMDB binaries and `.pagination-changes.json`
into the initial commit. Content _writes_ were never at risk: they stage explicit paths, and the
`git add "./*"` fallback does not match dotfiles (see `changes.ts`).

Everything below is a follow-up, sequenced but not scoped here.

---

## 11. Follow-up map

A survey of every surface in the repo that is paginated, or reads a whole corpus and shouldn't.
Each is a candidate PR; none block the rollout above. Each gets its own planning pass when
picked up (§0), and anything a phase discovers gets added here rather than lost.

The buckets are by **derived kind** (§2) rather than by where the code lives, because that is
what determines whether an item needs new design or just an adopter.

### 11.1 Derived kinds not yet modelled

These need design before code: each is a kind whose invalidation shape is undefined, so none of
them can produce a regeneration set today.

**F4 — chunk the search corpora (corpus documents).** Four route handlers each serialize an
entire corpus into one JSON: `recipe-website/{editor,export}/…/search/all/route.ts` and
`portfolio/{editor,export}/src/app/search/all/route.ts`. Paginated chunks are individually
cacheable and individually invalidated, and stable-end anchoring makes this markedly better than
it would have been — a client's cached chunks stay valid as new content arrives, since only the
head chunk ever changes. Content-defined chunking (§3.6) is the natural strategy here, since
chunk boundaries should not move when an item is inserted. This is the single largest payoff
outside the index pages themselves.

**F10 — `getAllTags` is a full corpus scan per call (aggregates).** `data/read.ts:95-108` reads
every recipe and builds a `Set` on every render of the recipe form; the homepage's newest-six
strip is the same shape. The materialize-at-write-time idea applies, but an aggregate's
invalidation is genuinely different: it depends on the whole corpus, so the useful question is
not "which pages" but "did the aggregate value actually change" — a tag cloud is unchanged by
most writes even though every write touches the corpus it is computed from. Blocks
`paginationOnly` for recipes (§10).

**F8 — static per-tag pages (filtered indexes).** `tagSearchHref` currently routes a tag to
`/search?q=tag:<tag>` (`queryLanguage.ts:539`), which needs the client search bundle to render
anything. With `filter` on a pagination config, each tag becomes its own pre-baked paginated
index and `/tags/<tag>` and `/tags/<tag>/<page>` become real static pages — indexable, no JS,
and dirty-tracked like any other. This is the first thing here that is a _feature_ rather than a
refactor, and it is the strongest argument for N-indexes-per-content-type. Needs a decision on
index-per-tag vs one index keyed `[tag, date, slug]`. Note that P1's filter-in-phase-1 decision
prices this: a per-tag index costs one sorted-keyspace write per matching item per tag on every
content write, so a corpus with many tags per item favours the single `[tag, date, slug]` index.
It also needs the tag list itself, which is F10.

### 11.2 Consumers of the existing machinery

No new design — these adopt what P1–P3 shipped.

**F5 — portfolio homepage loads every project.** `portfolio/common/components/Index/page.tsx:41`
calls `getProjects()` unlimited and hands the whole array to `IndexSearchProvider`. It has no
pagination of any kind — the same problem the recipe index had, one corpus-growth away from
mattering. Natural first adopter after featured recipes.

**F6 — unpaginated list UIs.** All load their whole corpus; all are natural
`readPage`/`readHead` consumers. Editor-side, so no static-export concerns.

| Surface                           | Call site                                              |
| --------------------------------- | ------------------------------------------------------ |
| F6a Portfolio editor project list | `portfolio/editor/…/(settings)/projects/page.tsx:29`   |
| F6b Portfolio editor pages list   | `portfolio/editor/…/(settings)/pages/page.tsx:25`      |
| F6c Recipe editor pages list      | `recipe-website/editor/…/(settings)/pages/page.tsx:30` |
| F6d Resume builder resume list    | `resume-builder/src/controller/data/readIndex.ts:14`   |
| F6e Menus settings lists          | `(settings)/menus/page.tsx`, both sites                |

**F7 — enumerate slugs without deserializing values.** Six routes load an entire corpus purely
to list slugs: `recipe/[slug]`, `featured-recipe/[slug]`, `project/[slug]`, and the `[...slug]`
pages routes on both export sites. A pagination index's SORTED keyspace _is_ the id list, so a
keys-only walk (`readAllIds`, shipped in P1) replaces a full value-deserializing read. Cheap and
mechanical, and it needs the content type to declare an index first.

**F9 — infinite-scroll toggle on the recipe index.** D3 delivers the mechanism; this is the UX:
the control itself, where the preference persists, how it interacts with the numbered
`Pagination` component, and what a deep link to a numbered page does for a reader with infinite
scroll on. A UI decision set rather than a continuation of the engine work, so its planning pass
(§0) should expect to spend most of its time on the UX questions, not the data ones.

**F11 — alternative page-assignment strategies.** Key buckets for archive navigation
(`/recipes/2026/03`), or content-defined chunking if backdated writes become common. Both slot
into the `assignPage` seat (§3.6).

### 11.3 Promoted or subsumed

**F13 — incremental rendering. Promoted into §1: it is the goal, not a follow-up.** What remains
a follow-up is the narrower thing it stood in for — **the export framework that consumes the
regeneration set.** Next's `output: "export"` cannot rebuild a subset of pages, so the
dirty-page artifact from P2 (`.pagination-changes.json`) currently accumulates for a consumer
that does not exist yet. A Vite-based export would read it, and the artifact is deliberately
shaped as its interface. Blocked on that framework, not on this module.

**F15 — a slug rename over-invalidates the referencing type. Subsumed by D1 (§6).**
`updateReferences` writes the referencing type's index entries directly
(`updateReferences.ts:164,262`), so its pagination would drift silently; P2 forces a full
rebuild of that type instead. That is correct but coarse — every page of the referencing type
reads as dirty, and the results are not returned from `updateContent` because they belong to a
different content type than the one whose tags the caller is holding. §6 fixes both halves:
per-type results (§6.3) and precise per-item sync via resolved index values (§6.2). §6.4 records
why "narrow the rename rebuild" and "fire on more than renames" are the same fix rather than
opposing ones.

### 11.4 Engine hygiene

**F1 — cache LMDB envs everywhere.** Every read opens an env and closes it in a `finally`
(`readContentIndex.ts:41-58`, same in `createContent`/`updateContent`/`rebuildIndex`). During a
static export that is one open+close per `generateStaticParams` _and_ per rendered page —
hundreds of map/unmap cycles for data that never changes mid-build, multiplied by the number of
indexes. `CommandPalette/index.tsx:35` already documents this cost from the other side. P1
added the cache for pagination envs (`pagination/database.ts`, with
`closePaginationDatabases()` for tests); F1 mirrors it back into `content/database.ts`, and
should carry P2's inode check (§4) across with it. Note that the pagination rebuild path opens
and closes the content env itself, so F1 has to keep that call working.

**F2 — fix `readContentIndex`'s `more`.** `more = (offset||0) + (limit||0) < total` evaluates to
`0 < total` for an unlimited read, so it is always `true`. Page reads derive `more` from meta
and sidestep it; the shared helper should still be correct.

**F3 — derive the search version from pagination meta.** `search/version/route.ts` builds its
version from `data.mdb`'s mtime and size — a proxy for "did the corpus change" that moves when
nothing semantic did and stays put when the index _shape_ changed, which is how `3cec4e17`
happened. `specHash + updatedAt` is a direct answer instead of a proxy, and P1's no-op-writes-
nothing rule means it does not move when nothing did.

**F12 — early-exit reconciliation.** The O(changed suffix) optimisation in §5, plus the
pending-changes keyspace it needs. Worth doing only if the full walk shows up in a profile.

**F14 — `updateContent.ts:25` had an unused `slug` parameter** that failed `eslint`. It never
surfaced because `lint-staged` only lints changed files. **Done in P2** — renamed `_slug`, with
a comment saying why it is unused (uploads are processed at the _current_ slug, before any
rename). P2 also fixed the global ignore list, which anchored `.next/**` at the repo root and so
linted build output under nested packages. One eslint error remains repo-wide, in
`packages/next-static-image/src/resizeImage.ts` — untouched by P2 and outside its scope.

**F16 — the automatic spec hash is not stable across builds.** See §4. Any index whose keyspace
outlives a single build needs an explicit `version`, which in practice is all of them. Worth
either making `version` required, or hashing something build-stable instead of `fn.toString()`
— neither is obvious, which is why P2 documented the trap rather than picking one. **Worth
re-reading now:** P3 hit the same trap in a second codebase, which is a second data point that
the default is wrong for real deployments rather than a demo-only quirk.

---

## 12. Verification

**12.1 `test/pagination.test.ts`** — **done, 38 tests green** (26 from P1, 12 added by P2).
Vitest,
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

P2 added: `force: true` re-derives an index whose meta says it is current, discarding an entry
the content index no longer has; a forced rebuild reports every page dirty (no diff source) and
clears `rebuildInProgress` even on an empty index, where it produces no dirty pages at all;
`syncPaginationIndexes` keeps the index correct across create / update / delete / **rename**,
and returns `[]` having written nothing for a config with no `paginationIndexes`; the artifact
unions dirty pages across two writes, keeps content types apart, writes nothing when handed no
results, and empties on `clearPaginationChanges`.

**12.2 `packages/cms/demo`** — **done, 82 e2e tests green** (11 new, 71 pre-existing). A
`/notes/browse` landing and `/notes/browse/[page]` numbered routes beside the untouched
homepage, a `many-notes` fixture of 14 notes at `perPage: 4`, and `pagination.spec.ts`. The
demo calls `createContent`/`updateContent`/`deleteContent` inline from `"use server"`
functions rather than through `createGenericActions`, so it verifies the core write path and
the Next adapter; `genericActions` gets its real exercise at P3.

The payoff assertion: creating a note reports `dirtyPages: [3]` and nothing else, and
`/notes/browse/0` and `/1` render **byte-identically** to before. Also covered: an edit dirties
only its own page, a rename follows the item with no orphan and no duplicate, deleting two old
notes shifts every later page and populates `removedPages` when the head collapses, the
artifact unions dirty pages across two writes, and a bookmark write records nothing at all.

Two things the harness needed, both worth knowing before writing a similar suite:

- **Specs clear the artifact _after_ `resetData`.** It is a dotfile inside the content
  directory and `copyFixtures` copies the directory whole, so a fixture carries whatever the
  generator's last write recorded.
- **`resetData` posts to `/test/reset-cache`.** Rewinding the content directory to a fixture is
  not a write, fires no cache tags, and leaves the running server with no way to learn the
  corpus went backwards — so a page cached by one test leaked into the next and results
  depended on run order. The route calls `revalidateTag(catchAll, { expire: 0 })`;
  `revalidateTag` rather than `updateTag` because the latter throws outside a Server Action.

**12.3 The thesis check — run at P3, passed.** Build `websites/recipe-website/export` against a
40-recipe content directory, add a recipe, rebuild, and diff the two `out/` trees. **No
`/recipes/N` file changed**, HTML or RSC payload — that is the claim the whole design rests on.
`/recipes/[page]` also emitted exactly `/recipes/1` and `/recipes/2`, from one meta read.

What did differ, all of it expected — and read against §2, the list is exactly "every derived
kind that has no regeneration set yet":

| File                     | Why                                                                   | Kind (§2)       |
| ------------------------ | --------------------------------------------------------------------- | --------------- |
| `/index.html`            | the homepage's newest-six strip, still a full-corpus read (§11.1/F10) | aggregate       |
| `/recipes.html`          | the landing — the surface that is _supposed_ to change                | pagination      |
| `search/all`             | the whole search corpus in one file (§11.1/F4)                        | corpus document |
| `search/version`         | its version marker, not yet derived from pagination meta (F3)         | corpus document |
| `/recipe/recipe-41.html` | the new recipe's own page                                             | item page       |

The two search files are F4/F3 territory: chunking the corpus and deriving its version from the
pagination meta are exactly what makes them stop moving. Until then they are outside P3's claim,
not a counter-example to it.

**Two things the check itself surfaced, both worth knowing before running it again:**

- **The diff must be normalized, twice over.** Next stamps a random build id into every HTML
  file (`<!--tPNg0yJ7RKN…-->`) and into `_next/static/<buildId>/`, so a raw `diff -rq` reports
  the entire tree. Substitute it out first. Then note that a handful of `/recipe/[slug]` pages
  still differ — module reference ids inside the RSC flight payload get renumbered — and that
  this is **build nondeterminism, not content**: building the _same_ content twice changes a
  different arbitrary subset of those pages each time, while the rendered markup is byte-
  identical. Verify by building twice with no change before blaming a code change.
- **`output: export` rejects an empty `generateStaticParams`.** "Page … is missing
  `generateStaticParams()`" is raised for an empty array, not just a missing function — so a
  route must emit at least one param even when it has no pages. `createPaginatedIndexRoute`
  emits `firstPageNumber` and lets `numbered` 404 it, which matters for any corpus small enough
  to fit in the landing fold (`headPage <= 1`, i.e. under `2 * perPage` items) — the common case
  for a new site, and the state `many-featured-recipes` is in today (§10). The `<=` bound in the
  featured-recipes loop was quietly providing the same guarantee, which is why fixing its
  off-by-one needed `max(1, ceil(…))` rather than `<`. Unrelated but adjacent: a content
  directory with **no** featured recipes cannot be exported at all today, since
  `/featured-recipe/[slug]` then returns an empty array. Pre-existing, not P3's, but it will
  bite whoever runs this check on a fresh corpus.

The Playwright equivalent, which runs on every suite, is
`editor/playwright/tests/recipes-pagination.spec.ts`: against the 40-recipe `many-recipes`
fixture it captures the rendered HTML of `/recipes/1` and `/recipes/2`, creates a recipe, and
asserts both are byte-identical afterwards while the landing gained the new one.

**12.4 Infinite scroll** — a Playwright spec that scrolls the recipe list and asserts each fetch
appends items with no duplicate slug across pages, per the project convention of verifying UI
through Playwright rather than a browser.

**12.5 Regression** — existing Playwright suites for recipe-website and portfolio stay green
(the container suite noted in the project memory), since the write path changes. The full vitest
suite stands at 134 tests green as of D0, which changed no code.

---

## 13. Migration

Page numbering inverts, so existing `/recipes/2`-style URLs change meaning — accepted. Nothing
else migrates: pagination indexes are derived state built fresh beside the existing content
indexes, no `*.mdb` file changes format, and a rollback is deleting a directory. An index that
is deleted, or that predates a config change, rebuilds itself on the next
`updatePaginationIndex` call with no operator action.

Two things a content repository gains once a content type opts in, both derived state:

- `<contentDir>/<type>/pagination/<name>/` — the index itself, already covered by whatever
  ignores the existing `*/index/` directories.
- `<contentDir>/.pagination-changes.json` — the dirty-page artifact. **Content repositories
  should gitignore it.** It is a dotfile specifically so that `commitChanges`' `git add "./*"`
  fallback, which does not match dotfiles, cannot sweep build bookkeeping into a content commit
  — but the write paths that pass explicit paths are the ones that matter, and an ignore rule
  is the honest belt to that suspenders. It accumulates every change since a build last
  consumed it, and whoever consumes it clears it.

D1 adds one more consideration, noted here in advance: borrowed index-value fields (§6.1) change
what a content index value _contains_, so adopting them is an index-shape change and every
existing index of that type must be rebuilt. `rebuildIndex` already does exactly that and the
spec hash already forces it on the pagination side, but the content index has no equivalent
self-healing check — worth a moment in D1's planning pass.
