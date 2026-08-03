import { open, type Key, type RootDatabase } from "lmdb";
import { statSync } from "fs";
import { resolve } from "path";

/*
 * Opening an LMDB environment maps its file; closing it unmaps. The content
 * layer pays that per call (see `readContentIndex`), which during a static
 * export is one map/unmap cycle per `generateStaticParams` *and* per rendered
 * page — for data that cannot change mid-build. Derived-state environments are
 * opened once per process instead and handed back from this cache.
 *
 * Extracted from `pagination/database.ts` when aggregates arrived (F10b) rather
 * than copied: the invalidation rule below is subtle enough that two
 * implementations of it would eventually disagree.
 */
interface CachedDatabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: RootDatabase<any, any>;
  /** Identifies the file the environment is mapped to. */
  signature: string;
}

const databaseCache = new Map<string, CachedDatabase>();

/**
 * Which *file* the environment at this path is mapped to, by device and inode.
 *
 * An open environment holds its data file mapped. Unlinking that file on a
 * POSIX system leaves the mapping perfectly valid and pointing at an inode
 * nothing else can reach, so a cached environment would go on answering from
 * content that is no longer on disk while writes vanished into it. That is not
 * hypothetical here: a content directory is a separate repository that gets
 * replaced wholesale by a sync, and the demo's test harness swaps one out
 * between every test.
 *
 * An empty signature means "no file", which never matches a real one — so a
 * removed directory always reopens.
 */
function fileSignature(path: string): string {
  try {
    const stats = statSync(resolve(path, "data.mdb"));
    return `${stats.dev}:${stats.ino}`;
  } catch {
    return "";
  }
}

/**
 * The environment at `path`, opened once per process.
 *
 * Opening also *creates* the directory, which is why every caller of this is a
 * place a `.gitignore` has to know about (§13).
 */
export function openCachedEnvironment<TValue = unknown>(
  path: string,
): RootDatabase<TValue, Key[]> {
  const cached = databaseCache.get(path);
  if (cached && cached.signature === fileSignature(path)) {
    return cached.db as RootDatabase<TValue, Key[]>;
  }
  if (cached) {
    databaseCache.delete(path);
    // Nothing can still be reading it: the file it maps no longer exists.
    void cached.db.close().catch(() => {});
  }
  const db = open<TValue, Key[]>({ path });
  databaseCache.set(path, { db, signature: fileSignature(path) });
  return db;
}

/**
 * Close every cached environment. Nothing in normal operation needs this — the
 * cache is meant to live as long as the process — but tests that build derived
 * state in a temporary directory do.
 */
export async function closeCachedEnvironments(): Promise<void> {
  const databases = [...databaseCache.values()];
  databaseCache.clear();
  await Promise.all(databases.map(({ db }) => db.close()));
}
