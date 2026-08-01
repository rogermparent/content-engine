import { open, type Key, type RootDatabase } from "lmdb";
import { dirname, resolve } from "path";
import { getContentDirectory } from "../fs/getContentDirectory";
import type { ContentTypeConfig } from "../content/types";
import { hashValue } from "./hash";
import type { PaginationIndexConfig, PaginationMeta } from "./types";

/**
 * Keyspace prefixes. Every key in a pagination environment is a tuple whose
 * first component is one of these, so each keyspace is a contiguous range and
 * a range read never has to filter.
 */
export const SORTED = 0;
export const PAGED = 1;
export const PAGE_SUMMARY = 2;
export const LOOKUP = 3;
export const META = 4;

/** The key that holds the meta record. */
export const META_KEY: Key[] = [META];

/**
 * Where an index lives: a sibling of the content type's own index directory.
 *
 * Separate environments rather than named sub-databases, because the content
 * index stores its entries in the *root* database and lmdb's README warns
 * against mixing root entries with named-database metadata in one environment.
 * Separate environments also mean no migration of existing `*.mdb` files and
 * independent writers that never contend.
 */
export function getPaginationDirectory(
  config: Pick<ContentTypeConfig, "indexDirectory">,
  paginationConfig: Pick<PaginationIndexConfig, "name">,
  contentDirectory?: string,
): string {
  const baseDir = contentDirectory || getContentDirectory();
  return resolve(
    baseDir,
    dirname(config.indexDirectory),
    "pagination",
    paginationConfig.name,
  );
}

/*
 * Opening an LMDB environment maps its file; closing it unmaps. The content
 * layer pays that per call (see `readContentIndex`), which during a static
 * export is one map/unmap cycle per `generateStaticParams` *and* per rendered
 * page — for data that cannot change mid-build. Pagination environments are
 * opened once per process instead and handed back from this cache.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const databaseCache = new Map<string, RootDatabase<any, any>>();

export function getPaginationDatabase<TValue = unknown>(
  config: Pick<ContentTypeConfig, "indexDirectory">,
  paginationConfig: Pick<PaginationIndexConfig, "name">,
  contentDirectory?: string,
): RootDatabase<TValue, Key[]> {
  const path = getPaginationDirectory(
    config,
    paginationConfig,
    contentDirectory,
  );
  const cached = databaseCache.get(path);
  if (cached) return cached as RootDatabase<TValue, Key[]>;
  const db = open<TValue, Key[]>({ path });
  databaseCache.set(path, db);
  return db;
}

/**
 * Close every cached environment. Nothing in normal operation needs this — the
 * cache is meant to live as long as the process — but tests that build indexes
 * in a temporary directory do.
 */
export async function closePaginationDatabases(): Promise<void> {
  const databases = [...databaseCache.values()];
  databaseCache.clear();
  await Promise.all(databases.map((db) => db.close()));
}

/**
 * The display rank baked into a paged key.
 *
 * `-(position + 1)` rather than `-position`: `ordered-binary` does not encode
 * negative zero as a number at all — it falls out of the numeric encoding and
 * sorts after every other key — so a descending index must never produce it.
 */
export function displayRank(position: number, newestFirst: boolean): number {
  return newestFirst ? -(position + 1) : position;
}

/** The paged key for one item. */
export function pagedKey(
  pageIndex: number,
  position: number,
  id: string,
  newestFirst: boolean,
): Key[] {
  return [PAGED, pageIndex, displayRank(position, newestFirst), id];
}

/** Bounds covering exactly the paged entries of one page. */
export function pagedPageRange(pageIndex: number): {
  start: Key[];
  end: Key[];
} {
  return { start: [PAGED, pageIndex], end: [PAGED, pageIndex + 1] };
}

/** The sorted key for one item. */
export function sortedKey(sortKey: Key[], id: string): Key[] {
  return [SORTED, ...sortKey, id];
}

export function getId<TKey extends Key>(
  paginationConfig: { getId?: (key: TKey) => string },
  key: TKey,
): string {
  if (paginationConfig.getId) return paginationConfig.getId(key);
  if (Array.isArray(key)) return String(key[key.length - 1]);
  return String(key);
}

/**
 * Covers everything a reader would have to re-derive if it changed: the shape
 * of the keyspace (`perPage`, `newestFirst`), the identity of the index, and
 * the source text of every function that decides what goes in it.
 *
 * Hashing function source can be defeated by a bundler that renames variables,
 * which costs a spurious rebuild — the safe direction to err, and far better
 * than a marker outliving the thing it vouches for. An explicit `version`
 * overrides it.
 */
export function computeSpecHash(
  paginationConfig: PaginationIndexConfig<never, Key, never>,
): string {
  const { name, perPage, newestFirst = true, version } = paginationConfig;
  if (version) return hashValue({ name, perPage, newestFirst, version });
  return hashValue({
    name,
    perPage,
    newestFirst,
    key: paginationConfig.key.toString(),
    project: paginationConfig.project?.toString(),
    filter: paginationConfig.filter?.toString(),
    fingerprint: paginationConfig.fingerprint?.toString(),
    getId: paginationConfig.getId?.toString(),
  });
}

export function readMeta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: RootDatabase<any, Key[]>,
): PaginationMeta | undefined {
  return db.get(META_KEY) as PaginationMeta | undefined;
}

/** `total - 1` over `perPage`: the newest page, which is usually partial. */
export function computeHeadPage(total: number, perPage: number): number {
  if (total <= 0) return 0;
  return Math.floor((total - 1) / perPage);
}

/**
 * The numbered routes that exist: `0 … headPage - 2`. The head page and the
 * one folded into it are served by the landing page, so exposing them as
 * numbered routes too would put the same content at two URLs.
 */
export function numberedPageCount(headPage: number): number {
  return Math.max(0, headPage - 1);
}

/** Identifies both the index's shape and the state of its corpus. */
export function versionOf(meta: PaginationMeta): string {
  return `${meta.specHash.slice(0, 16)}:${meta.updatedAt}`;
}
