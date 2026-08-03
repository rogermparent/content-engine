import type { Key, RootDatabase } from "lmdb";
import { dirname, resolve } from "path";
import type { ContentTypeConfig } from "../content/types";
import { getContentDirectory } from "../fs/getContentDirectory";
import { openCachedEnvironment } from "../lmdb/environmentCache";
import { hashValue } from "../pagination/hash";
import type { AggregateConfig, AggregateRecord } from "./types";

/**
 * The one key an aggregate environment holds.
 *
 * A tuple rather than a bare string so the keyspace can grow the way the
 * pagination one did — a second prefix is additive, a change of key type is
 * not.
 */
export const RECORD_KEY: Key[] = [0];

/**
 * Where an aggregate lives: `<type>/aggregates/<name>/`, a sibling of the
 * `<type>/pagination/<name>/` convention.
 *
 * Its own environment per aggregate, for the reasons `getPaginationDirectory`
 * gives — no root/named-database mixing, no migration of existing `*.mdb`, and
 * independent writers that never contend.
 */
export function getAggregateDirectory(
  config: Pick<ContentTypeConfig, "indexDirectory">,
  aggregateConfig: Pick<AggregateConfig, "name">,
  contentDirectory?: string,
): string {
  const baseDir = contentDirectory || getContentDirectory();
  return resolve(
    baseDir,
    dirname(config.indexDirectory),
    "aggregates",
    aggregateConfig.name,
  );
}

export function getAggregateDatabase<TValue = unknown>(
  config: Pick<ContentTypeConfig, "indexDirectory">,
  aggregateConfig: Pick<AggregateConfig, "name">,
  contentDirectory?: string,
): RootDatabase<TValue, Key[]> {
  return openCachedEnvironment<TValue>(
    getAggregateDirectory(config, aggregateConfig, contentDirectory),
  );
}

/**
 * Covers the identity of the aggregate and the source text of every function
 * that decides what goes in it — so editing a fold cannot leave a stale value
 * claiming to be current.
 *
 * Same hazard as `computeSpecHash`'s, and the same escape hatch: `fn.toString()`
 * differs between a minified production build and a dev server, so anything
 * real pins `version` (F16).
 */
export function computeAggregateSpecHash(
  aggregateConfig: AggregateConfig<never, Key, never, never>,
): string {
  const { name, version } = aggregateConfig;
  if (version) return hashValue({ name, version });
  return hashValue({
    name,
    initial: aggregateConfig.initial.toString(),
    fold: aggregateConfig.fold.toString(),
    finalize: aggregateConfig.finalize?.toString(),
  });
}

export function readAggregateRecord<TValue = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: RootDatabase<any, Key[]>,
): AggregateRecord<TValue> | undefined {
  return db.get(RECORD_KEY) as AggregateRecord<TValue> | undefined;
}
