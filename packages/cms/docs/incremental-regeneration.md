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

| Derived kind         | Examples in this repo                             | What a write invalidates today                                                                           |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Item pages**       | `/recipe/<slug>`, `/project/<slug>`               | **precise**, including a dependent's own item page — recipes fill `dependentItemBasePaths` in D2a (§6.3) |
| **Pagination pages** | `/recipes`, `/featured-recipes`, and their `/<n>` | **precise** — `dirtyPages` / `removedPages` (§3–§5); featured recipes joined in D2b                      |
| **Aggregates**       | `getAllTags`                                      | nothing is derived at all — recomputed per render from the corpus                                        |
| **Corpus documents** | `search/all`, `search/version`                    | one blob per corpus, rebuilt whole on any write                                                          |

Two consequences of that table are worth stating outright.

**A write should return a regeneration set, not a boolean.** `ContentWriteResult`
(`content/types.ts:20-22`) today carries `pagination: PaginationUpdateResult[]` and nothing
else, because pagination is the only kind that produces one. Everything else falls back to
blanket `revalidatePath` — which is why `paginationOnly` is still off for **both** recipes and
featured recipes even though their indexes are fully precise (§10). The shape to grow toward is
one result per derived kind, per content type.

The homepage strips used to be named here as the reason. They were not: they were bounded reads
on an untagged transport, and F10a moved them onto the keyspace without any new kind (§11.1).
What is left on the homepage is `getAllTags`, a real aggregate — F10c is where the flag's status
gets settled honestly, by reading the build output rather than restating this paragraph.

**Derivation crosses content types.** A derived artifact of type B can depend on the content of
type A, and this repo already has the case: a featured-recipe card renders the _referenced
recipe's_ name and image (`common/components/List/FeaturedRecipe/index.tsx:19-38`).

That gap used to be paid for twice, in both directions. **D2a closed both**, by making
`FeaturedRecipeEntryValue` carry `recipeName` and `recipeImage` alongside `{ recipe, note }`:

- **On read**, `getFeaturedRecipes` enriched each entry with an `await getRecipeBySlug(...)` — an
  N+1 data-file read per card per render, wrapped in a `try`/`catch` that silently degraded to an
  unnamed, imageless card when the referenced recipe was gone. It is now a projection off the
  index value, and the `catch` is gone with it. A pagination projection could never have done the
  old thing at all: `project` is synchronous by contract, and deliberately so (§3.4).
- **On write**, before D1 the only content-to-content invalidation was a rename-triggered full
  pagination rebuild of the referencing type, recorded as F15. It over-invalidated when it
  fired, and it fired only on rename — so an ordinary recipe edit that changed a name left every
  featured card rendering that name stale, with nothing anywhere aware of it. A recipe write now
  reports exactly which features moved, and fires nothing when it moves no borrowed field.

The edge those two want already existed in the config. `ReferenceSpec` declares that
featured-recipes references recipes via `indexField: "recipe"`; it was simply only ever read to
rewrite slugs on rename. **The reference specs are the dependency graph.** D1 made the engine
read them as one (§6), and D2a is the first production type to declare the inbound half.

What is left in that table is the two kinds with no derived artifact at all. The featured-recipes
_list_ pages used to be the concrete case — a recipe retitle fixed their data, but they read
through `readContentIndex` rather than a pagination keyspace, so they had no tag to be told about
and relied on the blanket `revalidatePath`. **D2b closed that**: they read a keyspace now, and
`listPaths` is empty because the pages carry tags. **F10a closed the same gap for the homepage
strips**, which had it for the same reason and needed the same fix rather than a new kind. What
still has no tag is one genuine aggregate — the recipe form's tag cloud and the homepage's
`BrowseChips`, both `getAllTags` — which is why `paginationOnly` stays off on both write
configs (F10).

**Scope.** The substrate's first cut (D1) is content-to-content dependencies only, because that
is the case with a concrete consumer waiting on it (D2a). Corpus documents (F4) and aggregates
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

**Status: built in D1.** This section was a sketch with four open questions; it is now a record
of what was built and what was decided. The four questions are answered in §6.1.

The problem, restated from §2: a derived artifact of type B can render fields belonging to a
content item of type A, and the engine had no way to know it. `project` is synchronous and sees
only B's own index value (§3.4), so B's pagination index could not cover such a field at all;
and the only invalidation crossing the type boundary was a rename-triggered full rebuild.

The pieces D1 built, all in `packages/cms/`:

| Module                           | What it is                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `content/references.ts`          | `ReferenceDeclaration`, the resolver, `resolveReferences`, `borrowedFieldsOf` |
| `content/updateDependents.ts`    | the write-time pass; replaces `updateReferencesViaIndex`                      |
| `pagination/syncContentItems.ts` | phase 1 for K items in one transaction per index, then phase 2 once           |

and the three seams they plug into: `buildIndexValue` gained a second parameter,
`ContentWriteResult` gained `dependents`, and `rebuildIndex` gained a cascade.

### 6.1 Borrowed index-value fields

A content type declares that its index value **borrows fields from a referenced type** through
`ContentTypeConfig.references`, so `BookmarkIndexValue` carries `noteTitle` alongside
`{ note, label, date }` and, since D2a, `FeaturedRecipeEntryValue` carries `recipeName` and
`recipeImage` alongside `{ recipe, note }`. Resolution is **async and engine-owned**: the engine
reads the referenced item and hands the already-resolved values to `buildIndexValue`, which
stays a pure synchronous function of what it is given.

`ReferenceDeclaration` is non-generic, for the reason `paginationIndexes` records at
`content/types.ts`: naming the config's own generics would put `TKey` in a parameter position
and make the whole interface invariant, breaking every `config as ContentTypeConfig` cast in the
package.

> **Decided in D1 — `buildIndexValue`'s second parameter is required in the type, not optional.**
> A required parameter cannot be silently forgotten at a new engine call site. TypeScript still
> accepts an implementation that declares only the first, so **all 7 existing config
> declarations typechecked unchanged**; only `test/pagination.test.ts`'s 8 call sites needed
> `, {}`.

The resolver is created **once per write operation and never module-global**, and caches the
_promise_ per `(contentType, slug)` so N dependents of one target share a single read. A
process-wide cache would serve values from before the last write — the failure shape of
`3cec4e17`, a marker vouching for content that had moved on.

That split is the whole point. It keeps phase 2 a pure walk over materialized values (§5), it
keeps `project` synchronous (§3.4), and it makes the **content** index covering rather than
only the pagination index — which is why `getFeaturedRecipes` could drop its N+1 enrichment read
in D2a, with featured recipes still on offsets and no pagination keyspace anywhere in sight. The
capability is worth having on its own; pagination is one consumer of it, and D2b is where that
consumer arrived — the borrowed fields are what made the featured index _projectable_, since a
pre-baked page is projected once from the index entry and cannot go and read a second file.

> **Confirmed in D2a — the two-way declaration is a real import cycle in production, and the
> thunks hold.** `recipeContentConfig` imports `featuredRecipeContentConfig` for `referencedBy`,
> and D2a's `references` makes the reverse import too. Verified from both entry points, since a
> route reaches only one of them first: `/featured-recipes` loads the featured config first,
> `/recipes` the recipe config. Un-thunking either side fails at import with a `ReferenceError`
> rather than degrading — which is the property that made this safe to do at all.

> **Decided in D1 — resolution reads the referenced type's DATA FILE, not its index.** The
> sketch above leaned toward the index, on the grounds that projections read index values. That
> was wrong on every count once measured against the actual keys. Both content types here are
> keyed `[date, slug]`, so a by-slug lookup against an index is an **O(N) scan**, while the data
> file's path derives directly from the slug. The data file is also the source (§2), so
> resolution is order-independent across a rebuild and can never serve a value from an index
> that has not caught up. And it opens no second LMDB environment per item inside a loop that
> already holds one open — `getContentDatabase` opens a fresh one on every call until F1.

> **Decided in D1 — depth is exactly one hop.** A borrowed field is never itself resolved.
> Deeper chains need transitive dependent tracking on write, which the reverse scan does not
> give cheaply, and nothing in the repo wants it.

> **Decided in D1 — a dangling reference resolves to `undefined`, not an error.** A content
> directory is edited by hand and by git; a reference to a deleted item is an ordinary state,
> not a broken invariant. Non-ENOENT read failures also degrade to `undefined`, but
> `console.warn` — unlike the bare `catch` on today's featured-recipe read path, which is how
> the unnamed card happens silently.

> **Decided in D1 — `refs` carries only the _declared_ fields, never the referenced item's full
> data.** This is correctness, not tidiness: the declaration is both the trigger and the
> payload, and they must be the same set. If `buildIndexValue` could reach an undeclared field,
> a write changing that field would fire nothing — reintroducing exactly the staleness this
> removes, one layer down.

> **Found in D1 — `ReferenceSpec.config` had to become a thunk too.** Declaring the edge from
> both sides makes the two config modules import each other, and whichever side the bundler
> reaches first evaluates the other's object literal while its `const` is in the temporal dead
> zone: a `ReferenceError` at import time, not a type error. `demo/lib/notes.ts` already
> imported `bookmarkConfig` eagerly, so adding the forward edge on bookmarks would have broken
> the demo outright. Both sides defer. A registry or a wiring module were considered and
> rejected — each trades a loud crash for silent load-order dependence.
>
> This is why D1's first commit is the thunk conversion, alone: it is the highest-risk change
> in the pass and it fails loudly.

### 6.2 Dependent resolution on write

`updateDependents` finds the items that borrow from the written one, rebuilds their index values
from freshly resolved references, syncs their pagination and reports what moved — **precise
dirty pages for the dependent type** instead of a forced full rebuild.

It **replaces** `updateReferencesViaIndex` rather than sequencing with it. That is a correctness
property, not a tidiness one: one pass reads each dependent's data file once and writes it at
most once by construction, where two passes would read and write twice and have to agree about
the order they ran in.

Dependent lookup reuses the `indexField` iteration `updateReferences` already performed: the
scan exists, corpora are small, and it needs no new keyspace to maintain or repair. It now runs
on creates too, which is new load. A reverse-dependency keyspace (`[refType, refId] →
dependents`) is the release valve — deliberately not specified, and not worth building before
something profiles slow.

Two rules the pass states and the tests pin down:

- **A delete does not rewrite dependents' data files.** The reference field keeps pointing at
  the dead slug; only the borrowed values leave the index. Rewriting it would destroy the only
  record of what the item pointed at, which is the one thing that could ever repair the link.
- **`removeFromIndex` when a dependent's key moves.** The rename path never did this
  (`updateReferences.ts:162-164` as it stood), so a dependent whose key derives from the
  reference field would have been left in the index twice — a latent orphan D1 fixes in passing.

This **subsumes F15**, which asked for exactly this narrowing and named the two ways to get it:
returning per-type results, or precise per-item sync. D1 does both.

### 6.3 Per-type write results

`ContentWriteResult` gained `dependents: DependentWriteResult[]`
(`{ contentType, pagination, updatedSlugs }`). Additive, so every existing
`({ pagination } = await ...)` destructure kept working.

> **Decided in D1 — `dependents` is a separate list, not a uniform per-type map.** The asymmetry
> between the written type and a dependent one is permanent, not an artifact of the current
> shape: the written type owns the redirect and the item path, while a dependent type's paths
> are not even in the caller's success config.

`handleContentSuccess` takes the whole result and loops, firing
`revalidatePaginationResults(depType, …)` and nothing else per dependent — no redirect, no list
paths. `ContentSuccessConfig.dependentItemBasePaths` is the seat for the one remaining gap: a
dependent's _detail_ page renders borrowed fields too, the write path knows which items changed,
and only the app knows their URLs. Unset everywhere in D1; **D2a fills it in** for recipes, with
`{ "featured-recipes": "/featured-recipe" }` on both the update and delete success configs — a
delete strips the borrowed values just as a retitle rewrites them.

### 6.4 Make the trigger precise, not just narrower

Invalidation fires on **any change to a borrowed field**, not only on rename. The tension reads
like a contradiction — F15 wanted the rename rebuild _narrower_, this wanted the trigger
_broader_ — but they are the same fix. The old trigger was coarse in both directions at once: it
fired for the wrong reason (any rename, whether or not anything rendered changed) and missed the
right one (a borrowed field changing without a rename).

The gate is one line:

```
renamed || borrowedFieldsOf(config).some(f => hashValue(prev[f]) !== hashValue(next[f]))
```

`borrowedFieldsOf` walks out through `referencedBy` and back in through each dependent's
`references`, because the borrowed-field list necessarily lives on the borrowing side — a type
cannot know what its dependents render. The gate subsumes create (a previously-dangling
reference now resolves), delete, and rename-without-borrowed-change; a rename stops being the
one case with special handling and becomes an ordinary one, since the slug is a borrowed value
like any other, just one stored in the dependent's own file.

**Safety property, the same one P2 established with `paginationIndexes`.** `borrowedFieldsOf`
returns `[]` for every production content type in D1, so the gate cannot open for any ordinary
write in this repo and `updateDependents` returns `[]` having opened nothing. D1 is a
behavioural no-op outside the demo.

One consequence worth stating, because it surprised the spec that was written before it ran:
**a rename can now dirty _zero_ pages.** Only the projection is hashed (§3.5), and no bookmark
list renders a note's slug — so renaming a note rewrites four bookmark files and re-indexes them
while leaving every page byte-identical. F15 reported every page dirty for the same write.

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

| PR      | Scope                                                                                                                                                                                                                                                 | Done when                                                              | Status                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| **P1**  | The core module (§9) + env cache + this document. No consumers.                                                                                                                                                                                       | `test/pagination.test.ts` green (§12.1)                                | **Done** — 26 tests, `ab7a3994`                 |
| **P2**  | Wire into the write path: `createContent`/`updateContent`/`deleteContent`/`rebuildIndex`, the Next adapter, `genericActions` tag revalidation, dirty-page artifact                                                                                    | `packages/cms/demo` pagination spec green (§12.2)                      | **Done** — 38 vitest + 82 demo e2e, `ae4eb8d9`  |
| **P3**  | Recipe index adopts it: `paginationConfigs.ts`, `readRecipePages.ts`, landing + numbered routes, `createPaginatedIndexRoute` (moved here from P2), `Pagination` component on stable ids. Includes the URL renumbering and the empty-trailing-page fix | add-a-recipe rebuild diff touches only the landing page (§12.3)        | **Done** — `ec7cc2b3`, notes below              |
| **D0**  | Reframe: rename this document to `incremental-regeneration.md`, add §1/§2/§6, re-sequence this table, re-bucket §11. Doc only, no code                                                                                                                | the record is true against the code; §12 unmoved                       | **Done** — this PR                              |
| **D1**  | The dependency substrate (§6): borrowed index-value fields, engine-owned async resolution, dependent lookup on write, per-type `ContentWriteResult`                                                                                                   | retitling a note dirties only the demo's bookmark pages that show it   | **Done** — 23 vitest + 90 demo e2e, notes below |
| **D2a** | Featured recipes adopt **borrowed fields** — the first production `references` declaration, the N+1 read deleted, `dependentItemBasePaths` filled                                                                                                     | retitling a recipe updates every featured card, with no snapshot moved | **Done** — 4 new e2e, notes below               |
| **D2b** | Featured recipes adopt **keyspace pagination** — the N-indexes-per-type path, `OffsetPagination` deleted                                                                                                                                              | featured-recipe suites green against an enlarged fixture               | **Done** — 382 e2e, notes below                 |
| **D3**  | Per-page + head JSON route handlers, `useInfinitePagination` hook                                                                                                                                                                                     | infinite-scroll Playwright spec green (§12.4)                          | Not started                                     |

The F-series models the **second** derived kind, aggregates (F10), and then spends it on the
first user-visible feature the machinery enables, static per-tag pages (F8). Same rollout shape
the P- and D-series used: prove the engine feature in `packages/cms/demo`, then let a production
type adopt it.

| PR       | Scope                                                                                                                                       | Done when                                                            | Status                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| **F10a** | Both homepage strips move off `readContentIndex` and onto `recipePages.readHead()` / `featuredRecipePages.readHead()`. No engine change     | every rendered page byte-identical — a moved snapshot is a bug       | **Done** — notes below          |
| **F10b** | The aggregate kind, engine + demo proof: declaration, computation, storage, the did-it-change hash, result plumbing, Next adapter           | `test/aggregates.test.ts` + demo payoff spec green                   | Not started                     |
| **F10c** | Recipes adopt it — `getAllTags` reads the aggregate; then settle the `paginationOnly` question against the build output rather than the doc | tag chips and form suggestions unchanged; the flag's status recorded | Not started                     |
| **F8**   | `/tags/<tag>` (and possibly `/tags/<tag>/<page>`) as pre-baked static pages; `tagSearchHref` repointed                                      | every tag chip lands on a static page; no visual baseline moves      | Not started — own planning pass |

**D1's "done when" had to be restated.** It read "a recipe rename dirties only the featured
pages that show it", which is unachievable as written: featured recipes have no pagination
index, so there are no featured _pages_ to dirty until D2b gives them one. D1's scope was engine
plus demo throughout — the same rollout shape P2 used, proving an engine feature in
`packages/cms/demo` before a production content type adopts it — so the bar is restated against
the demo, where it is met exactly.

**What D1 built, and what it left.**

Seven commits, each independently green; the first three are pure refactors. The thunk
conversion lands first and alone because it is the one change that can fail at import time
(§6.1).

- `content/references.ts` — the declaration and resolution layer, plus `borrowedFieldsOf` and
  the `borrowed<T>()` declaration-site helper that keeps the cast in one place.
- `content/updateDependents.ts` — the write-time pass, replacing `updateReferencesViaIndex`.
- `pagination/syncContentItems.ts` — phase 1 for K items in one transaction per index, then
  phase 2 **once**. Phase 2 walks the whole sorted keyspace, so per-item would cost K walks to
  reach a state one walk describes, with intermediate diffs against states no build ever sees.
  `syncPaginationIndexes` is now a one-item delegation to it, so the two cannot drift.
- `rebuildIndex` resolves references per item and **cascades to dependents by default**.

> **Decided in D1 — the rebuild cascade defaults to on.** `rebuildRecipeIndex()` rebuilds
> recipes and nothing else, and it is what `buildExport`, `sync.ts` and the Maintenance button
> all call. A dependent's index value holds fields copied out of another type's data files and
> the content index carries no spec hash, so nothing detects that those copies went stale and
> nothing self-heals. Without the cascade, "rebuild everything" would quietly not, the moment D2a
> lands. That is a deliberate behaviour change for ~10 callers, every one of which is a "make
> everything right" operation. A `visited` set bounds it, since an edge declared from both sides
> is a cycle and this is the only place that walks edges transitively.

**`updateReferences` is kept but no longer called by the engine.** `packages/cms` has no
`exports` map, so its deep paths are public API. `updateReferencesForSpec` now always takes the
file-scan path; `updateReferencesViaIndex` is gone, replaced by the dependent pass.

**The demo proof is bookmarks, not featured recipes.** Deliberately: `notes.ts` already imported
`bookmarkConfig`, so bookmarks importing `noteConfig` back is the exact two-way cycle the thunks
exist for — load-bearing from the first line rather than a latent hazard. Bookmarks gained a
borrowed `noteTitle` and a pagination index of their own, and the homepage renders that title
with zero extra reads: the demo's stand-in for killing `getFeaturedRecipes`' N+1.

That cost the demo its P2 no-op witness (bookmarks were the type with no indexes). Replaced
rather than dropped: the no-index case is asserted in `test/pagination.test.ts`, and the demo now
asserts what only an app can — a bookmark write records nothing under `notes/by-date`.

> **Found in D1 — the dependent pass widens the create path, and a test that
> raced already will start losing.** The demo's `git.spec.ts` "accumulate commits" test clicked
> Create and navigated away without awaiting the redirect, unlike every other test in the file.
> That was always a race — `goto` can abort a server action still running, and the commit is the
> _last_ thing a write does — but it never lost until a note create started scanning the
> bookmarks index for dangling references to backfill. The symptom is a content directory with
> the note on disk and no commit for it, which reads as a git bug rather than a test bug. Await
> the redirect after every write in a suite that then asserts on git.

**Two things D1 changed in the demo that a similar suite will need.** `/test/reset-cache` must
expire _every_ paginated type's catch-all, not just the one that existed first, or the suite goes
back to being run-order dependent (§12.2). And the bookmark form gained slug and date inputs: the
server action already read both, but with no inputs every bookmark took `Date.now()`, so a
generated fixture's sort key depended on how fast the generator ran.

**Why D2 split into D2a and D2b.** The two halves have opposite risk profiles against the same
five specs. Borrowed fields change no URL, no rendered markup and no fixture layout — the cards
already carried `recipeName` and `recipeImage` as props, so D2a's whole safety property is that
**rendered output is byte-identical** and no visual snapshot may move. Pagination adoption
changes all three at once: stable-page ids renumber the URLs, five pagination tests assert
semantics P3 already deleted for recipes, and the fixture has to grow. Landing them together
would have put a snapshot regeneration and a semantics rewrite in the same diff as the index-shape
change, with no way to read a failure as belonging to one or the other. Splitting matches how
P1–P3 and D1 shipped: the risky half alone, provable on its own.

**What D2a built.**

- `featuredRecipeContentConfig.references` — `name` and `image` from the recipe, closing the
  first **production** two-way config cycle. Both entry orders verified (§6.1).
- `FeaturedRecipeEntryValue` gains `recipeName` / `recipeImage`, both optional: a reference can
  dangle, and an index built before the fields existed will not have them.
- `getFeaturedRecipes` drops the `Promise.all` enrichment block and the `getRecipeBySlug` import
  entirely. `MassagedFeaturedRecipeEntry` keeps its shape, so nothing downstream changed.
- Both recipe success configs fill `dependentItemBasePaths: { "featured-recipes": "/featured-recipe" }`.
- `build-fixture-pagination.ts` → `build-fixture-indexes.ts`, with a featured-recipes branch
  calling `rebuildIndex({ cascadeDependents: false })`. Only the two featured fixtures' indexes
  changed; the recipes branch is untouched.
- One engine change, forced by the one below: `updateDependents` now skips a dependent spec whose
  data directory does not exist.

> **Found in D2a — opening a dependent's index _creates_ it, and that is a side effect on a git
> repository.** The first production `references` declaration turned `updateDependents`' gate on
> for every recipe write, and the pass opened the featured-recipes environment before it knew
> whether any featured recipe existed. `getContentDatabase` creates what it opens, so a content
> directory that had never held a featured recipe grew an untracked `featured-recipes/` after any
> recipe write — and a content directory is a git repository. `git.spec.ts`'s five remote-sync
> tests went red: the untracked directory left the repo dirty and the Git UI in its
> uncommitted-changes state, so the Push button never rendered. Verified against base (26/26
> green there, 5 red with D2a) before diagnosing, which is the only way this reads as a
> regression rather than as the container's standing flake pool.
>
> The fix is a `pathExists` on the dependent's data directory _before_ the open: no data
> directory, no items, nothing that can borrow. It is also the cheap half of F18 — a corpus with
> no featured recipes now costs one `stat` per recipe write instead of an environment open and a
> full index scan.
>
> **The general lesson for the next content type that adopts `references`:** the dependent pass
> is not free and not inert on a corpus that has none of the dependent type. Anything it opens,
> it creates.

**What D2a deliberately left, and D2b took.** The featured-recipes _list_ routes read
`readContentIndex` rather than a pagination keyspace, so they had no tag and relied on the blanket
`revalidatePath` — D2b's keyspace is what made them precise, not another `listPaths` entry. This
was invisible
rather than merely untested: a production build of the editor renders **every** route `ƒ`
(server-rendered on demand), because next-auth in the layout reads cookies, and the export app is
`output: "export"` and rebuilt wholesale. So `dependentItemBasePaths` is belt-and-braces in the
editor too — it is the correct declaration of where dependents live, and it is what a
partially-static deployment would need, but neither app can currently serve a stale featured page
for it to save.

**What D2b built.** `featuredRecipesByDate` beside `recipesByDate` with a `FeaturedRecipeListEntry`
row type, `readFeaturedRecipePages.ts` at module scope, a `routes.tsx` collapsing all four route
files to re-exports, `FeaturedRecipeIndexPageWrapper` on `PaginationPage` and `RecipePagination`,
and the three invalidation seats. Deleted: `OffsetPagination`, `FeaturedRecipeIndexPage/index.tsx`,
`FirstFeaturedRecipeIndexPage.tsx`, and the long-dead `FeaturedRecipesPage`. Gate: 382 container
e2e across two sequential shards, 0 failed; 158 vitest; both apps built, the export against a
1-item featured corpus as well as the 40-item one.

The projection is exactly what `FeaturedRecipeListItem` destructures, and `recipeName`/`recipeImage`
are in it **only because D2a borrowed them**. A pre-baked page is projected once, at write time,
from the index entry alone — so a card that needed a `recipe.json` read per row could never have
been paged at all. That is what D2a was for, and it makes featured recipes the first content type
carrying both `references` and `paginationIndexes`: a recipe write now cascades into a dependent
that maintains its own keyspace, `updateDependents` → `syncPaginationItems` running phase 2 once
for K dependents.

> **D2b's safety property is the inverse of D2a's, and that is the point.** D2a's guarantee was
> byte-identical output, so any moved snapshot meant a bug. D2b changes what the landing shows on
> purpose: at `perPage` 12 the 15-item fixture has `headPage` 1, so the landing folds pages 1 and 0
> and renders **all 15 cards** where the offset landing rendered 12. `featured-recipes-page1.png`
> was regenerated and read, not just accepted; `featured-recipes-page-2.png` was deleted, since a
> 15-item corpus has no page 2 any more. The check that this was the _only_ surface that moved is
> that every other visual baseline held on the regeneration run.

**Two live invalidation gaps found while wiring the same seats.** Both are one-liners, and neither
was introduced by D2b:

- **`rebuildRecipeIndex()` never expired `recipePages.tags.all`** — a P3 gap. It fired only
  `revalidatePath("/")`, which does not touch `unstable_cache` tags, so a rebuild reprojected every
  page and the site went on serving the pre-rebuild ones. Worst on the git branch-switch path,
  where `rebuildRecipeIndex` is _how_ the whole corpus is meant to change over. Both rebuilds now
  expire both keyspaces (the recipe rebuild cascades into featured recipes since D1).
- **The production `initializeContentGit` never ignored `featured-recipes/{index,pagination}`** —
  the Playwright harness writes its own `.gitignore`, so nothing went red, but a real content repo
  would have committed LMDB binaries. §13's ignore list is the authority; the two writers of it had
  drifted apart.

**The fixture work, and it was more than a fixture.** `many-featured-recipes` is 15 items at
`perPage` 12 (`FeaturedRecipeIndexPage/constants.ts`), which under stable-end anchoring gives
`headPage` 1 — the fold covers the whole corpus and `numberedPages` is **empty**, so there was no
numbered route left to test at all. `many-featured-recipes-paged` is the dedicated 40-item corpus:
every one of `many-recipes`' recipes featured once, `feature-01` … `feature-40`, dated one per day
from 2024-03-01, giving `headPage` 3, a landing folding 16, and numbered routes
`/featured-recipes/1` and `/2`.

> **Decided in D2a's planning pass and carried out here — a dedicated fixture rather than growing
> the shared one.** Four other specs read `many-featured-recipes` (`search`, `visual`,
> `accessibility`, `mobile`), `search.spec.ts` asserts the first hit for "Recipe 5" is exactly
> "Recipe 5" — at risk in a 40-item corpus — and D2a's own borrowed-fields tests hardcode
> `FEATURED_ON_BOTH = "recipe-12"` against the 15-item layout. Built from `many-recipes` by
> featuring its 40, rather than creating 80 items through the UI.

Two things the generator had to do that the older one does not: set an **explicit slug and date**
on every feature, because the default slug derives from the wall clock at second granularity and
collides at 40 while leaving the ordering non-deterministic; and `test.setTimeout(900_000)`, since
40 UI round-trips are well past the default. The 15-item generator's trailing `→` assertion was
also stale — it predates the control it was written against — and is now a card count.

`featured-recipes.spec.ts`'s five pagination tests asserted semantics P3 had already deleted for
recipes (`aria-current="page"`, "Go to next page", `/featured-recipes/1` redirecting to the
landing) and were rewritten against `recipes-pagination.spec.ts`'s shape: landing fold, per-page
contents, exact-cover union, 404s, the Newer/Older walk, page numbering, and the thesis test. Under
stable ids `/featured-recipes/1` is the _oldest_ page, and on a 1-item corpus it **404s** rather
than redirecting.

> **A public detail page renders the footer's Sign In button, not the sign-in form.** The thesis
> test's `fillSignInForm` timed out on an Email field that was never there; `signIn` clicks the
> button first. Cost one shard re-run. Every _authenticated_ route renders the form directly, which
> is why the rest of the suite gets away with the shorter helper.

The dirty-page artifact is now gitignored under `playwright/fixtures/test-content/`. `rebuildIndex`
and the multi-item write path both drop a `.pagination-changes.json` into the content directory, so
`copyFixtures` sweeps it into whatever fixture is being generated — and it carries a wall-clock
`updatedAt`, so committing it means a spurious diff on every regeneration. The demo's fixtures are
the deliberate exception: its specs assert on the file directly.

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
which an empty state satisfies. `editor/scripts/build-fixture-indexes.ts` walks the fixtures and
runs `updatePaginationIndexes({ force: true })` over each; the resulting `*.mdb` files are
committed exactly as `recipes/index` already was. Run it whenever a `paginationIndexes` entry is
added or changed — and, since D2a, whenever an index _value_ changes shape, which its
featured-recipes branch repairs with `rebuildIndex` instead. The same hazard applies to a live
content directory, which is what `rebuildRecipeIndex()` in `exportAction` and the Maintenance
rebuild button cover.

**Content repositories gitignore the pagination directory.** `initializeContentGit` runs
`git.add(".")`, which would otherwise sweep the LMDB binaries and `.pagination-changes.json`
into the initial commit. Content _writes_ were never at risk: they stage explicit paths, and the
`git add "./*"` fallback does not match dotfiles (see `changes.ts`).

**What F10a built.** Both homepage strips read the pre-baked keyspace. The two `page.tsx` files
became one-line re-exports of a shared `Homepage/route.tsx`, the same shape `RecipeIndexPage`
already used for the routes the editor and the export share — one authority for the two details
below, rather than the same subtlety duplicated in two apps.

- **`moreRecipes` comes from `PaginationPage.total`, not from `readPaginationMeta`.** Reading
  meta here would have handed back most of the precision the head tag just bought: the meta tag
  moves on nearly every write, while `total` cannot change without the head page being dirty, so
  the head-tagged entry is always fresh. It is also a small correctness win over the `more` it
  replaces, which F2 records as broken for reads that do not bound themselves.
- **Slice, then filter.** `getFeaturedRecipes({ limit: 6 })` took six and _then_ dropped entries
  with a dangling reference, so the strip could render fewer than six. Filtering before slicing
  would silently pull a seventh entry forward and change what the homepage shows.

**The trade is more rows read for a cache tag, and it is worth it.** `readHead` returns
`perPage + 1` to `2 * perPage` rows — up to 24 — to serve six. That is more than
`getRecipes({ limit: 6 })` read, but it is one forward range seek either way, against a
process-cached environment rather than one `readContentIndex` opens and unmaps per call (F1).
The point is the tag: `readContentIndex` carries none, so before this the strips were invalidated
by nothing but the blanket `revalidatePath`.

**Its safety property is D2a's, not D2b's.** The strips' _contents_ do not change, so any moved
output is a bug rather than an expected diff. Verified by building the export against
`many-featured-recipes-paged` before and after and comparing all 92 rendered pages: **none
differ**. That comparison needs §12.3's normalization plus two more sources of noise found while
running it — CSS-module class names carry build hashes, and the _number_ of inline `<script>`
tags varies between builds of identical content. A control build of the unchanged tree against
itself is what proves the normalization is complete; without it the check reports ~22 files and
means nothing.

**What is left on the untagged readers.** `getRecipes` now has three callers — `getAllTags`
(F10c), the `search/all` corpus (F4), and the export's `recipe/[slug]` `generateStaticParams`
(F7); `getFeaturedRecipes` has one, the export's `featured-recipe/[slug]` params. The homepage's
only remaining full-corpus read is `getAllTags`, which is what F10c takes.

**A third `.gitignore` writer exists, and it is stale.** §13 names two. There is a third: the
committed bundle at `editor/playwright/fixtures/git-test-content/test-git.bundle`, whose
`.gitignore` is only `/transformed-images` and `/recipes/index` — missing `/recipes/pagination`,
both featured-recipes lines and `/.pagination-changes.json`. Latent, not triggered: the specs
that load it (`git.spec.ts:407`) only read the git log and never render a page that opens a
pagination environment. Left alone deliberately rather than regenerating a binary fixture inside
a mechanical PR — but it is the exact shape of the D2a failure, and whoever writes a bundle spec
that visits a content page will meet it.

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
every recipe and builds a `Set` on every render of the recipe form. The materialize-at-write-time
idea applies, but an aggregate's invalidation is genuinely different: it depends on the whole
corpus, so the useful question is not "which pages" but "did the aggregate value actually
change" — a tag cloud is unchanged by most writes even though every write touches the corpus it
is computed from. Blocks `paginationOnly` for recipes (§10).

> **Correction, made at F10a: the homepage's newest-six strips are _not_ aggregates.** This entry
> used to claim they were "the same shape" as `getAllTags`, and §12.3's table classed
> `/index.html` as an aggregate on that basis. Both were wrong. The strips called
> `getRecipes({ limit: 6 })` and `getFeaturedRecipes({ limit: 6 })` — **bounded reads**, not
> corpus folds. Their only defect was the transport: `readContentIndex` carries no cache tag.
> So they needed no new kind at all, just the keyspace they were already sitting next to, which
> is what F10a did in a PR with no engine change. Worth keeping as a caution: "reads the whole
> corpus" and "is an aggregate" are different claims, and only the second one needs a design.
> After F10a the homepage's one remaining untagged reader is `getAllTags` itself.

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
mattering. Now the natural next adopter: featured recipes finished in D2b, so every paginated
surface in the recipe site is on a keyspace and portfolio is the remaining one.

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
mechanical, and it needs the content type to declare an index first — which, since D2b,
`featured-recipe/[slug]` does. It and `recipe/[slug]` are unblocked; the rest still wait on their
type declaring one.

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

**F15 — a slug rename over-invalidates the referencing type. Closed by D1 (§6).** The forced
full rebuild in `updateContent` is deleted, along with the `updateReferences` call beside it;
`updateDependents` does both jobs in one pass, returning per-type results (§6.3) and precise
per-item sync from resolved index values (§6.2). §6.4 records why "narrow the rename rebuild"
and "fire on more than renames" were the same fix rather than opposing ones — and the demo now
shows the narrowing at its limit, with a rename dirtying zero pages where F15 dirtied every one.

**`OffsetPagination` — deleted by D2b.** The component existed only to serve the one index that
had no keyspace to ask where its ends were; featured recipes were its single importer, and its own
docstring named this PR as its end. Checked against every F-item on the way out: none referenced
it, so nothing here inherits it. The dead `FeaturedRecipesPage` component went with it.

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

**F17 — `commitContentChanges` ignores the caller's content directory.** It takes no directory
and reads `getContentDirectory()` instead (`git/commit.ts:32-40`), so a write against an
explicit `contentDirectory` — which every call in the engine passes — commits against whatever
the ambient environment says. Harmless today because the two agree in every running
configuration, and _useful_ in tests, where pointing `CONTENT_DIRECTORY` at a tmpdir is what
makes the commit a no-op (§12.1b). Noticed in D1, deliberately not fixed there: changing it
touches every write path and belongs with F1's env-handling pass rather than inside a
dependency-graph change.

**F18 — the dependent scan loads the dependent index into memory, and now runs on creates.**
`db.getRange().asArray` over the whole dependent index, as `updateReferences` already did — but
D1's gate opens on creates too, not only renames, because a create is what resolves a reference
that was dangling. §6.2's reverse-dependency keyspace (`[refType, refId] → dependents`) is the
release valve; the trigger to build it is a corpus large enough to make a create visibly slow,
which no corpus in this repo is. It is already measurable, though: it is what tipped the demo's
racing git test over (§10).

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

**12.2 `packages/cms/demo`** — **done, 90 e2e tests green as of D1** (8 added by D1's
`references.spec.ts`; 82 at P2). A
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
  **It must list every paginated type**, which is the line D1 had to add for bookmarks.

D1 added `references.spec.ts` against a new `many-bookmarks` fixture — three notes and fourteen
bookmarks at `perPage: 4`, grouped so each note's bookmarks sit on a known page. The payoff
assertion is §12.2's applied across a type boundary, which is D1's thesis check: **retitling a
note reports `dirtyPages: [1]` for `bookmarks/by-date` and leaves `/bookmarks/browse/0`
byte-identical**, where before D1 an edit that changed no slug fired nothing anywhere. Also
covered: the homepage rendering a borrowed title with no note read; editing an unborrowed field
recording nothing under bookmarks while notes still moves; a rename rewriting the reference and
dirtying **zero** pages; a rename that also retitles dirtying exactly page 1; deleting a note
leaving its bookmarks listed with the title gone and the reference intact; and creating a note
backfilling a bookmark that pointed at it before it existed.

**12.1b `test/references.test.ts`** — **done, 23 tests green** (D1). Same harness shape as
§12.1: node environment, real LMDB in a tmpdir. Unlike §12.1 it drives the **real write path** —
`createContent` / `updateContent` / `deleteContent` / `rebuildIndex` — rather than a harness
that imitates it, which makes it the first unit coverage that path has ever had. Safe because
`commitContentChanges` no-ops when its content directory is not a git repository; the suite
points `CONTENT_DIRECTORY` at the tmpdir so that is explicit rather than incidental.

The two halves of the trigger are the heart of it:

- **positive** — editing a borrowed field dirties exactly the pages showing it, and every other
  page's stored hash is byte-identical;
- **negative** — editing an unborrowed field returns `dependents: []`, calls `buildIndexValue`
  zero times, leaves every page hash and the pagination `updatedAt` untouched, and records
  nothing in the artifact. **This half did not exist before D1 in either direction.**

Also covered: covering values materialized and confined to the declared fields; a dangling
reference resolving to `undefined` without throwing; a later create backfilling one; a rename
rebuilding each dependent exactly once and reporting `rebuilt: false`; a rename that changes
nothing displayed dirtying zero pages; the delete cascade clearing borrowed values while leaving
the dead slug in place, in both the index and the data file; K dependents producing one result
set per index; the resolver still answering after its data file is deleted, which is what proves
one read serves N dependents; `forget` making it look again; rebuild order-independence; the
cascade repairing a value edited behind the engine's back, and stopping when told to; the cascade
terminating on a two-type cycle; both thunk directions resolving; and no orphan left when a
dependent's index key moves.

**12.3 The thesis check — run at P3, passed.** Build `websites/recipe-website/export` against a
40-recipe content directory, add a recipe, rebuild, and diff the two `out/` trees. **No
`/recipes/N` file changed**, HTML or RSC payload — that is the claim the whole design rests on.
`/recipes/[page]` also emitted exactly `/recipes/1` and `/recipes/2`, from one meta read.

What did differ, all of it expected — and read against §2, the list is exactly "every derived
kind that has no regeneration set yet":

| File                     | Why                                                               | Kind (§2)       |
| ------------------------ | ----------------------------------------------------------------- | --------------- |
| `/index.html`            | the homepage's newest-six strip, then still on `readContentIndex` | pagination      |
| `/recipes.html`          | the landing — the surface that is _supposed_ to change            | pagination      |
| `search/all`             | the whole search corpus in one file (§11.1/F4)                    | corpus document |
| `search/version`         | its version marker, not yet derived from pagination meta (F3)     | corpus document |
| `/recipe/recipe-41.html` | the new recipe's own page                                         | item page       |

The two search files are F4/F3 territory: chunking the corpus and deriving its version from the
pagination meta are exactly what makes them stop moving. Until then they are outside P3's claim,
not a counter-example to it.

`/index.html` was classed **aggregate** here until F10a corrected it (§11.1). It is a bounded
read of the newest six, so it belongs to the pagination kind — and it is _supposed_ to change
when a recipe is added, exactly as `/recipes.html` is. What was wrong was not that it moved but
that nothing could tell it to: `readContentIndex` carries no tag. Since F10a it reads the same
head the `/recipes` landing does and shares its tag, so it is no longer on the list of surfaces
without a regeneration set.

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

**12.3b The same check for featured recipes — run at D2b, passed.** The `pagination` describe in
`featured-recipes.spec.ts`, rewritten wholesale onto `many-featured-recipes-paged`, ports every
assertion from the recipe spec: landing fold, per-page contents, exact-cover union, 404s for the
head / the folded page / page zero / nonsense, the Newer-Older walk, `pagination-page-number`
present on numbered pages and absent on the landing, and the thesis — a 41st feature leaves both
sealed pages byte-identical while the landing gains it.

The export build was run against the featured corpus too, in both shapes that matter. Against the
40-item fixture `/featured-recipes/[page]` emitted exactly `/1` and `/2`, holding `feature-12…01`
and `feature-24…13` while the landing held `feature-40…25` — an exact cover of 40 with no overlap,
read out of the emitted HTML rather than inferred. Against the **1-item** `one-featured-recipe`
corpus the build succeeds and writes a 404 body at `/featured-recipes/1`, which is the empty-
`numberedPages` case the note below is about; a hand-written `generateStaticParams` returning `[]`
would have failed the build outright.

**12.4 Infinite scroll** — a Playwright spec that scrolls the recipe list and asserts each fetch
appends items with no duplicate slug across pages, per the project convention of verifying UI
through Playwright rather than a browser.

**12.5 Regression** — existing Playwright suites for recipe-website and portfolio stay green
(the container suite noted in the project memory), since the write path changes. The full vitest
suite stands at **158 tests green as of D2b** (134 at D0, plus §12.1b's 24).

D2b's gate: the recipe container suite at `SHARD_TOTAL=2`, shards run **sequentially** — **382
passed, 0 failed**, plus one unrelated flake in `youtube-video.spec.ts` that passed on retry.
`SHARD_TOTAL=4` overloads this box and manufactures failures scattered across unrelated specs, so
two sequential shards is the real gate, not a compromise. Both apps were built, not just the
editor — `output: "export"` is the only place an empty `generateStaticParams` is an error.

D1's specific regression gates, all met: `reference-updates.spec.ts` (5 tests, recipe-website)
and the demo's `git.spec.ts` "reference updates" describe (5 tests) stay green **unchanged** —
the rename path's user-visible behaviour is identical, only its invalidation got precise.
Recipes gained no borrowed fields in D1, so any movement there would have meant D1 changed
something it should not have.

---

## 13. Migration

Page numbering inverts, so existing `/recipes/2`- and `/featured-recipes/2`-style URLs change
meaning — accepted for recipes in P3 and for featured recipes in D2b. `/featured-recipes/1`
additionally stops being an alias for the landing: it is the oldest page, and 404s on a corpus
small enough to have no numbered pages. Checked before landing that no app code hardcodes a
numbered link to either — the unnumbered `/featured-recipes` links in the command palette, the
homepage and the detail page are unaffected. Nothing else migrates: pagination indexes are derived state built fresh beside the existing content
indexes, no `*.mdb` file changes format, and a rollback is deleting a directory. An index that
is deleted, or that predates a config change, rebuilds itself on the next
`updatePaginationIndex` call with no operator action.

Two things a content repository gains once a content type opts in, both derived state:

- `<contentDir>/<type>/pagination/<name>/` — the index itself. **Do not assume the existing
  ignore rule covers it.** This repo's `initializeContentGit` names paths one by one rather than
  by pattern, so `/featured-recipes/index` and `/featured-recipes/pagination` were both simply
  missing until D2b added them — and the Playwright harness writes its own `.gitignore`, so no
  test would ever have caught it. Every content type with derived state needs its own line, added
  in the same change that gives it that state.
- `<contentDir>/.pagination-changes.json` — the dirty-page artifact. **Content repositories
  should gitignore it.** It is a dotfile specifically so that `commitChanges`' `git add "./*"`
  fallback, which does not match dotfiles, cannot sweep build bookkeeping into a content commit
  — but the write paths that pass explicit paths are the ones that matter, and an ignore rule
  is the honest belt to that suspenders. It accumulates every change since a build last
  consumed it, and whoever consumes it clears it.

**Borrowed index-value fields are an index-shape change, and nothing self-heals one.** Adopting
one changes what a content index value _contains_, so every existing index of that type must be
rebuilt. The pagination side notices — the spec hash forces a rebuild when a projection changes
— but the **content** index carries no spec hash and never will notice. D1's answer is to make
one operator action sufficient rather than to add a check: `rebuildIndex` now resolves references
per item and cascades to every type that borrows from the one being rebuilt (§10), so
`rebuildRecipeIndex()`, the Maintenance button, `sync.ts` and the seed scripts all repair the
whole dependency closure rather than one index each.

D1 itself changed no production index shape — no production content type declared `references`
yet — so nothing needed rebuilding when it landed. **D2a is the first one that does.**

**The operator step for a live content directory, concretely: press _Rebuild recipe index_ on the
Maintenance page** (`rebuildRecipeIndex()`, also reachable through `exportAction` and `sync.ts`).
Rebuilding _recipes_ is the right instruction even though it is the featured-recipes index whose
shape changed: since D1 that call cascades into every type that borrows from recipes, so it
repairs featured recipes in the same pass. Rebuilding featured recipes alone would work too, but
it is the less obvious button and the one an operator has no reason to reach for.

Skipping it does not error. A featured-recipes index written before D2a simply has no
`recipeName`, and `getFeaturedRecipes` no longer reads the recipe to fill the gap — so every card
degrades to unnamed and imageless, exactly as the old `catch` did. **That failure looks identical
to the bug D2a fixes**, which is the whole reason this step is written down rather than inferred.
The committed fixtures got the same treatment through
`editor/scripts/build-fixture-indexes.ts` (§10).
