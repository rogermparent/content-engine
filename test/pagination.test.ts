// @vitest-environment node
//
// The repo default is jsdom; these tests open real LMDB environments in a
// temporary directory, which needs node.

import { mkdtemp, rename, rm } from "fs-extra";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Key } from "lmdb";

import { getContentDatabase } from "@discontent/cms/content/database";
import type { ContentTypeConfig } from "@discontent/cms/content/types";
import {
  PAGED,
  PAGE_SUMMARY,
  closePaginationDatabases,
  getPaginationDatabase,
} from "@discontent/cms/pagination/database";
import { readAllIds } from "@discontent/cms/pagination/readAllIds";
import {
  readAfter,
  readHead,
  readItemPage,
  readPage,
} from "@discontent/cms/pagination/readPage";
import { readPaginationMeta } from "@discontent/cms/pagination/readPaginationMeta";
import type {
  PageSummary,
  PaginationIndexConfig,
  PaginationMeta,
} from "@discontent/cms/pagination/types";
import { updatePaginationIndex } from "@discontent/cms/pagination/updatePaginationIndex";
import { updatePaginationIndexes } from "@discontent/cms/pagination/updatePaginationIndexes";
import { writeSortedEntry } from "@discontent/cms/pagination/writeSortedEntry";

interface Note {
  title: string;
  date: number;
  featured?: boolean;
}

interface NoteIndexValue {
  title: string;
  date: number;
  featured?: boolean;
}

type NoteKey = [number, string];

interface NoteListItem {
  slug: string;
  title: string;
  date: number;
}

const noteConfig: ContentTypeConfig<Note, NoteIndexValue, NoteKey> = {
  contentType: "notes",
  dataDirectory: "notes/data",
  indexDirectory: "notes/index",
  dataFilename: "note.json",
  buildIndexValue: (data) => ({
    title: data.title,
    date: data.date,
    featured: data.featured,
  }),
  buildIndexKey: (slug, data) => [data.date, slug],
};

const PER_PAGE = 5;

const byDate: PaginationIndexConfig<NoteIndexValue, NoteKey, NoteListItem> = {
  name: "by-date",
  perPage: PER_PAGE,
  key: ({ value, id }) => [value.date, id],
  project: ({ value, id }) => ({
    slug: id,
    title: value.title,
    date: value.date,
  }),
};

let contentDirectory: string;

beforeEach(async () => {
  contentDirectory = await mkdtemp(join(tmpdir(), "pagination-"));
});

afterEach(async () => {
  await closePaginationDatabases();
  await rm(contentDirectory, { recursive: true, force: true });
});

/* ------------------------------------------------------------------ */
/* Harness                                                             */
/* ------------------------------------------------------------------ */

/**
 * Writes to the content index and runs phase 1 against every index — what the
 * write path will do once P2 wires it in.
 */
async function putNote(
  slug: string,
  note: Note,
  indexes: PaginationIndexConfig<NoteIndexValue, NoteKey, never>[] = [
    byDate as never,
  ],
) {
  const db = getContentDatabase<NoteIndexValue, NoteKey>(
    noteConfig,
    contentDirectory,
  );
  try {
    await db.put(
      noteConfig.buildIndexKey(slug, note),
      noteConfig.buildIndexValue(note),
    );
  } finally {
    await db.close();
  }
  for (const paginationConfig of indexes) {
    await writeSortedEntry({
      config: noteConfig,
      paginationConfig,
      contentDirectory,
      id: slug,
      entry: {
        key: noteConfig.buildIndexKey(slug, note),
        value: noteConfig.buildIndexValue(note),
      },
    });
  }
}

async function removeNote(
  slug: string,
  date: number,
  indexes: PaginationIndexConfig<NoteIndexValue, NoteKey, never>[] = [
    byDate as never,
  ],
) {
  const db = getContentDatabase<NoteIndexValue, NoteKey>(
    noteConfig,
    contentDirectory,
  );
  try {
    await db.remove([date, slug]);
  } finally {
    await db.close();
  }
  for (const paginationConfig of indexes) {
    await writeSortedEntry({
      config: noteConfig,
      paginationConfig,
      contentDirectory,
      id: slug,
      entry: undefined,
    });
  }
}

function update(
  paginationConfig: PaginationIndexConfig<
    NoteIndexValue,
    NoteKey,
    never
  > = byDate as never,
) {
  return updatePaginationIndex({
    config: noteConfig,
    paginationConfig,
    contentDirectory,
  });
}

function page(pageIndex: number) {
  return readPage<NoteIndexValue, NoteKey, NoteListItem>({
    config: noteConfig,
    paginationConfig: byDate,
    contentDirectory,
    pageIndex,
  });
}

function head() {
  return readHead<NoteIndexValue, NoteKey, NoteListItem>({
    config: noteConfig,
    paginationConfig: byDate,
    contentDirectory,
  });
}

/** The stored per-page hashes — the diff source, read directly. */
function storedPageHashes(
  paginationConfig: PaginationIndexConfig<
    NoteIndexValue,
    NoteKey,
    never
  > = byDate as never,
): Map<number, string> {
  const db = getPaginationDatabase(
    noteConfig,
    paginationConfig,
    contentDirectory,
  );
  const hashes = new Map<number, string>();
  for (const { key, value } of db.getRange({
    start: [PAGE_SUMMARY],
    end: [PAGE_SUMMARY + 1],
  })) {
    hashes.set((key as Key[])[1] as number, (value as PageSummary).hash);
  }
  return hashes;
}

function readStoredMeta(): PaginationMeta {
  const db = getPaginationDatabase(noteConfig, byDate, contentDirectory);
  return db.get([4]) as PaginationMeta;
}

/** `n` notes, one day apart, oldest first: note-0 … note-(n-1). */
async function seed(n: number, startDay = 100, prefix = "note") {
  for (let index = 0; index < n; index += 1) {
    await putNote(`${prefix}-${index}`, {
      title: `Note ${index}`,
      date: day(startDay + index),
    });
  }
  return update();
}

const DAY = 86_400_000;
const day = (n: number) => n * DAY;

/**
 * The naive implementation the index has to agree with: sort ascending, slice
 * fixed-size pages from the oldest end, reverse each page for display.
 */
function referencePage(
  notes: { slug: string; date: number }[],
  pageIndex: number,
  perPage = PER_PAGE,
  newestFirst = true,
): string[] {
  const ascending = [...notes].sort(
    (a, b) => a.date - b.date || (a.slug < b.slug ? -1 : 1),
  );
  const slice = ascending
    .slice(pageIndex * perPage, (pageIndex + 1) * perPage)
    .map((note) => note.slug);
  return newestFirst ? slice.reverse() : slice;
}

/* ------------------------------------------------------------------ */
/* Anchoring                                                           */
/* ------------------------------------------------------------------ */

describe("stable-end anchoring", () => {
  it("dirties only the head page when content is appended", async () => {
    await seed(18); // pages 0,1,2 sealed; page 3 holds 3 items
    const before = storedPageHashes();
    expect([...before.keys()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);

    await putNote("note-new", { title: "New", date: day(200) });
    const result = await update();

    expect(result.headPage).toBe(3);
    expect(result.dirtyPages).toEqual([3]);
    expect(result.removedPages).toEqual([]);

    // Every sealed page's hash is byte-identical.
    const after = storedPageHashes();
    for (const sealed of [0, 1, 2]) {
      expect(after.get(sealed)).toBe(before.get(sealed));
    }
  });

  it("writes at most one page's worth of paged keys on an append", async () => {
    await seed(47); // 10 pages
    const db = getPaginationDatabase(noteConfig, byDate, contentDirectory);
    const originalPut = db.put.bind(db);
    let pagedWrites = 0;
    db.put = ((key: Key[], value: unknown) => {
      if (Array.isArray(key) && key[0] === PAGED) pagedWrites += 1;
      return originalPut(key, value);
    }) as typeof db.put;

    try {
      await putNote("note-new", { title: "New", date: day(500) });
      const result = await update();
      expect(result.total).toBe(48);
      expect(result.dirtyPages).toEqual([9]);
      // Bounded by the head page's size, not by the 48 items in the corpus.
      expect(pagedWrites).toBeLessThanOrEqual(PER_PAGE);
    } finally {
      db.put = originalPut;
    }
  });

  it("seals a page without changing any existing page", async () => {
    // 11 items: pages 0 and 1 full, page 2 holds one. headPage 2.
    await seed(11);
    const before = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(before.headPage).toBe(2);
    expect(before.numberedPages).toEqual([0]);
    const hashesBefore = storedPageHashes();

    // Fill page 2 to `perPage`, then push one more so the head seals.
    for (let index = 0; index < 4; index += 1) {
      await putNote(`fill-${index}`, {
        title: `Fill ${index}`,
        date: day(300 + index),
      });
      await update();
    }
    const sealing = await (async () => {
      await putNote("sealer", { title: "Sealer", date: day(400) });
      return update();
    })();

    expect(sealing.previousHeadPage).toBe(2);
    expect(sealing.headPage).toBe(3);
    // Exactly one new numbered route appears, and it is the page that was
    // already final because the landing page had folded it in.
    const after = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(after.numberedPages).toEqual([0, 1]);

    const hashesAfter = storedPageHashes();
    expect(hashesAfter.get(0)).toBe(hashesBefore.get(0));
    expect(hashesAfter.get(1)).toBe(hashesBefore.get(1));
  });

  it("propagates a backdated insert toward the head and no further", async () => {
    await seed(20); // pages 0..3, five each
    const before = storedPageHashes();

    // A date that lands inside page 1 (positions 5..9 are days 105..109).
    await putNote("backdated", { title: "Backdated", date: day(107) + 1 });
    const result = await update();

    expect(result.total).toBe(21);
    expect(result.dirtyPages).toEqual([1, 2, 3, 4]);
    expect(storedPageHashes().get(0)).toBe(before.get(0));
  });

  it("reports removed pages when an old delete shrinks the corpus", async () => {
    await seed(21); // headPage 4, page 4 holds one item
    const before = storedPageHashes();
    expect([...before.keys()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);

    await removeNote("note-2", day(102));
    const result = await update();

    expect(result.total).toBe(20);
    expect(result.headPage).toBe(3);
    expect(result.dirtyPages).toEqual([0, 1, 2, 3]);
    expect(result.removedPages).toEqual([4]);
    expect([...storedPageHashes().keys()].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(await page(4)).toBeNull();
  });

  it("dirties from the deleted item's page forward and nothing older", async () => {
    await seed(20);
    const before = storedPageHashes();
    await removeNote("note-7", day(107)); // position 7 -> page 1
    const result = await update();

    expect(result.dirtyPages).toEqual([1, 2, 3]);
    expect(result.removedPages).toEqual([]);
    expect(storedPageHashes().get(0)).toBe(before.get(0));
  });
});

/* ------------------------------------------------------------------ */
/* The head fold                                                       */
/* ------------------------------------------------------------------ */

describe("the head fold", () => {
  it("returns between perPage + 1 and 2 * perPage items", async () => {
    for (const total of [11, 13, 15, 18, 20]) {
      await rm(contentDirectory, { recursive: true, force: true });
      await closePaginationDatabases();
      contentDirectory = await mkdtemp(join(tmpdir(), "pagination-"));

      await seed(total);
      const landing = await head();
      expect(landing.items.length).toBeGreaterThanOrEqual(PER_PAGE + 1);
      expect(landing.items.length).toBeLessThanOrEqual(2 * PER_PAGE);
    }
  });

  it("never overlaps the numbered routes", async () => {
    await seed(23); // headPage 4, numbered routes 0..2
    const landing = await head();
    const landingSlugs = new Set(landing.items.map((item) => item.slug));

    const meta = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(meta.numberedPages).toEqual([0, 1, 2]);

    for (const pageIndex of meta.numberedPages) {
      const numbered = await page(pageIndex);
      for (const item of numbered!.items) {
        expect(landingSlugs.has(item.slug)).toBe(false);
      }
    }

    // Together they cover the corpus exactly once.
    const all = [...landingSlugs];
    for (const pageIndex of meta.numberedPages) {
      all.push(...(await page(pageIndex))!.items.map((item) => item.slug));
    }
    expect(new Set(all).size).toBe(23);
    expect(all.length).toBe(23);
  });

  it("produces no numbered routes for a small corpus", async () => {
    await seed(3); // headPage 0
    let meta = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(meta.headPage).toBe(0);
    expect(meta.numberedPages).toEqual([]);
    expect((await head()).items).toHaveLength(3);

    await seed(5, 200, "more"); // 8 total -> headPage 1, the fold covers all
    meta = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(meta.headPage).toBe(1);
    expect(meta.numberedPages).toEqual([]);
    expect((await head()).items).toHaveLength(8);
  });

  it("links the landing page at headPage - 2", async () => {
    await seed(23); // headPage 4
    const landing = await head();
    expect(landing.olderPage).toBe(2);
    expect(landing.newerPage).toBeNull();

    const older = await page(2);
    expect(older!.olderPage).toBe(1);
    // Page 3 is folded into the landing, so there is no numbered route newer
    // than 2.
    expect(older!.newerPage).toBeNull();
    expect((await page(0))!.olderPage).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Covering and projection                                             */
/* ------------------------------------------------------------------ */

describe("covering", () => {
  it("serves complete items with the content index moved away", async () => {
    await seed(12);
    const expected = await page(1);

    await rename(
      join(contentDirectory, "notes", "index"),
      join(contentDirectory, "notes", "index-moved"),
    );

    const actual = await page(1);
    expect(actual!.items).toEqual(expected!.items);
    expect(actual!.items[0]).toMatchObject({
      slug: expect.any(String),
      title: expect.any(String),
      date: expect.any(Number),
    });
  });
});

describe("projection precision", () => {
  it("dirties exactly one page when a projected field changes", async () => {
    await seed(20);
    const before = storedPageHashes();

    await putNote("note-12", { title: "Retitled", date: day(112) });
    const result = await update();

    expect(result.dirtyPages).toEqual([2]);
    for (const clean of [0, 1, 3]) {
      expect(storedPageHashes().get(clean)).toBe(before.get(clean));
    }
    const retitled = (await page(2))!.items.find(
      (item) => item.slug === "note-12",
    );
    expect(retitled!.title).toBe("Retitled");
  });

  it("leaves every hash alone when an unprojected field changes", async () => {
    await seed(20);
    const before = storedPageHashes();
    const versionBefore = (await head()).version;

    await putNote("note-12", {
      title: "Note 12",
      date: day(112),
      featured: true,
    });
    const result = await update();

    expect(result.dirtyPages).toEqual([]);
    expect(result.unchanged).toBe(true);
    expect(storedPageHashes()).toEqual(before);
    // A no-op pass must not invalidate a single cached page.
    expect((await head()).version).toBe(versionBefore);
  });
});

/* ------------------------------------------------------------------ */
/* Spec hash and rebuilds                                              */
/* ------------------------------------------------------------------ */

describe("staleness detection", () => {
  it("rebuilds when the projection changes", async () => {
    await seed(12);
    expect((await update()).rebuilt).toBe(false);

    const widened: PaginationIndexConfig<
      NoteIndexValue,
      NoteKey,
      NoteListItem & { featured?: boolean }
    > = {
      ...byDate,
      project: ({ value, id }) => ({
        slug: id,
        title: value.title,
        date: value.date,
        featured: value.featured,
      }),
    };

    const result = await updatePaginationIndex({
      config: noteConfig,
      paginationConfig: widened,
      contentDirectory,
    });
    expect(result.rebuilt).toBe(true);
    expect(result.total).toBe(12);
  });

  it("rebuilds when perPage changes, and re-cuts every boundary", async () => {
    await seed(12);
    const recut: PaginationIndexConfig<NoteIndexValue, NoteKey, NoteListItem> =
      {
        ...byDate,
        perPage: 4,
      };

    const result = await updatePaginationIndex({
      config: noteConfig,
      paginationConfig: recut,
      contentDirectory,
    });
    expect(result.rebuilt).toBe(true);
    expect(result.headPage).toBe(2);
    expect(result.dirtyPages).toEqual([0, 1, 2]);

    const reread = await readPage<NoteIndexValue, NoteKey, NoteListItem>({
      config: noteConfig,
      paginationConfig: recut,
      contentDirectory,
      pageIndex: 0,
    });
    expect(reread!.items).toHaveLength(4);
  });

  it("rebuilds an index left mid-rebuild rather than trusting it", async () => {
    await seed(12);
    const db = getPaginationDatabase(noteConfig, byDate, contentDirectory);
    const meta = readStoredMeta();
    await db.put([4], { ...meta, rebuildInProgress: true });

    const result = await update();
    expect(result.rebuilt).toBe(true);
    expect(result.total).toBe(12);
    expect(readStoredMeta().rebuildInProgress).toBe(false);
    expect((await page(0))!.items).toHaveLength(PER_PAGE);
  });

  it("builds itself from the content index on first use", async () => {
    // No phase 1 at all: only the content index is written.
    for (let index = 0; index < 8; index += 1) {
      const db = getContentDatabase<NoteIndexValue, NoteKey>(
        noteConfig,
        contentDirectory,
      );
      try {
        await db.put([day(100 + index), `note-${index}`], {
          title: `Note ${index}`,
          date: day(100 + index),
        });
      } finally {
        await db.close();
      }
    }

    const result = await update();
    expect(result.rebuilt).toBe(true);
    expect(result.total).toBe(8);
    expect((await head()).items).toHaveLength(8);
  });
});

/* ------------------------------------------------------------------ */
/* Read direction                                                      */
/* ------------------------------------------------------------------ */

describe("forward-only reads", () => {
  it("returns a page newest-first from a plain forward seek", async () => {
    await seed(20);
    const first = await page(0);
    expect(first!.items.map((item) => item.slug)).toEqual([
      "note-4",
      "note-3",
      "note-2",
      "note-1",
      "note-0",
    ]);
    const landing = await head();
    expect(landing.items[0].slug).toBe("note-19");
  });

  it("returns ascending pages when newestFirst is false", async () => {
    const alphabetical: PaginationIndexConfig<
      NoteIndexValue,
      NoteKey,
      NoteListItem
    > = {
      name: "by-title",
      perPage: PER_PAGE,
      newestFirst: false,
      key: ({ value, id }) => [value.title, id],
      project: ({ value, id }) => ({
        slug: id,
        title: value.title,
        date: value.date,
      }),
    };

    for (const [slug, title] of [
      ["d", "Delta"],
      ["a", "Alpha"],
      ["c", "Charlie"],
      ["b", "Bravo"],
      ["e", "Echo"],
      ["f", "Foxtrot"],
    ] as const) {
      await putNote(slug, { title, date: day(100) }, [alphabetical as never]);
    }
    await update(alphabetical as never);

    const first = await readPage<NoteIndexValue, NoteKey, NoteListItem>({
      config: noteConfig,
      paginationConfig: alphabetical,
      contentDirectory,
      pageIndex: 0,
    });
    expect(first!.items.map((item) => item.title)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
      "Echo",
    ]);
  });

  it("agrees with a naive offset-based reference implementation", async () => {
    const notes = Array.from({ length: 34 }, (_, index) => ({
      slug: `note-${index}`,
      date: day(100 + index),
    }));
    await seed(34);

    const meta = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    for (let pageIndex = 0; pageIndex <= meta.headPage; pageIndex += 1) {
      const actual = (await page(pageIndex))!.items.map((item) => item.slug);
      expect(actual).toEqual(referencePage(notes, pageIndex));
    }
  });
});

/* ------------------------------------------------------------------ */
/* Keyset reads                                                        */
/* ------------------------------------------------------------------ */

describe("readAfter", () => {
  it("walks the whole corpus with no duplicate and no gap", async () => {
    await seed(23);
    const seen: string[] = [];
    let cursor: Key[] | undefined;

    for (let guard = 0; guard < 20; guard += 1) {
      const batch = await readAfter<NoteIndexValue, NoteKey, NoteListItem>({
        config: noteConfig,
        paginationConfig: byDate,
        contentDirectory,
        after: cursor,
        limit: 6,
      });
      seen.push(...batch.items.map((item) => item.slug));
      if (!batch.nextCursor) break;
      cursor = batch.nextCursor;
    }

    expect(seen).toHaveLength(23);
    expect(new Set(seen).size).toBe(23);
    expect(seen[0]).toBe("note-22");
    expect(seen[22]).toBe("note-0");
  });

  it("picks up an item inserted below the cursor between calls", async () => {
    await seed(12);
    const first = await readAfter<NoteIndexValue, NoteKey, NoteListItem>({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
      limit: 5,
    });
    expect(first.items.map((item) => item.slug)).toEqual([
      "note-11",
      "note-10",
      "note-9",
      "note-8",
      "note-7",
    ]);

    // Older than the cursor, so it belongs in the next batch.
    await putNote("inserted", { title: "Inserted", date: day(103) + 1 });

    const second = await readAfter<NoteIndexValue, NoteKey, NoteListItem>({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
      after: first.nextCursor!,
      limit: 20,
    });
    const secondSlugs = second.items.map((item) => item.slug);

    expect(secondSlugs).toContain("inserted");
    for (const slug of first.items.map((item) => item.slug)) {
      expect(secondSlugs).not.toContain(slug);
    }
    expect(
      new Set([...first.items.map((i) => i.slug), ...secondSlugs]).size,
    ).toBe(13);
  });
});

/* ------------------------------------------------------------------ */
/* Independence                                                        */
/* ------------------------------------------------------------------ */

describe("multiple indexes over one content type", () => {
  const featuredByDate: PaginationIndexConfig<
    NoteIndexValue,
    NoteKey,
    { slug: string; title: string }
  > = {
    name: "featured",
    perPage: 3,
    key: ({ value, id }) => [value.date, id],
    filter: ({ value }) => value.featured === true,
    project: ({ value, id }) => ({ slug: id, title: value.title }),
  };

  it("keeps a filtered index independent of the unfiltered one", async () => {
    const indexes = [byDate as never, featuredByDate as never];
    for (let index = 0; index < 14; index += 1) {
      await putNote(
        `note-${index}`,
        {
          title: `Note ${index}`,
          date: day(100 + index),
          featured: index % 2 === 0,
        },
        indexes,
      );
    }

    const results = await updatePaginationIndexes({
      config: noteConfig,
      contentDirectory,
      paginationConfigs: [byDate, featuredByDate],
    });
    const byName = new Map(results.map((r) => [r.name, r]));

    expect(byName.get("by-date")!.total).toBe(14);
    expect(byName.get("featured")!.total).toBe(7);
    expect(byName.get("featured")!.headPage).toBe(2);

    const featuredPage = await readPage<
      NoteIndexValue,
      NoteKey,
      { slug: string; title: string }
    >({
      config: noteConfig,
      paginationConfig: featuredByDate,
      contentDirectory,
      pageIndex: 0,
    });
    expect(featuredPage!.items.map((item) => item.slug)).toEqual([
      "note-4",
      "note-2",
      "note-0",
    ]);
    // The projection is genuinely the filtered index's own.
    expect(featuredPage!.items[0]).not.toHaveProperty("date");

    // An edit that only affects the filtered index leaves the other alone.
    await putNote(
      "note-1",
      { title: "Note 1", date: day(101), featured: true },
      indexes,
    );
    const after = await updatePaginationIndexes({
      config: noteConfig,
      contentDirectory,
      paginationConfigs: [byDate, featuredByDate],
    });
    const afterByName = new Map(after.map((r) => [r.name, r]));
    expect(afterByName.get("by-date")!.unchanged).toBe(true);
    expect(afterByName.get("featured")!.total).toBe(8);
  });
});

/* ------------------------------------------------------------------ */
/* Cheap enumerations                                                  */
/* ------------------------------------------------------------------ */

describe("cheap enumerations", () => {
  it("lists every id from a keys-only walk", async () => {
    await seed(7);
    const ids = await readAllIds({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(ids).toEqual([
      "note-0",
      "note-1",
      "note-2",
      "note-3",
      "note-4",
      "note-5",
      "note-6",
    ]);
  });

  it("answers what page an item is on", async () => {
    await seed(20);
    expect(
      await readItemPage({
        config: noteConfig,
        paginationConfig: byDate,
        contentDirectory,
        id: "note-12",
      }),
    ).toBe(2);
    expect(
      await readItemPage({
        config: noteConfig,
        paginationConfig: byDate,
        contentDirectory,
        id: "nope",
      }),
    ).toBeNull();
  });

  it("reports an empty index without a corpus load", async () => {
    const meta = await readPaginationMeta({
      config: noteConfig,
      paginationConfig: byDate,
      contentDirectory,
    });
    expect(meta).toMatchObject({ total: 0, headPage: 0, numberedPages: [] });
    expect(await page(0)).toBeNull();
    expect((await head()).items).toEqual([]);
  });
});
