import type { Key } from "lmdb";
import { readdir } from "fs-extra";
import { getContentDirectory } from "../fs/getContentDirectory";
import { getContentDatabase, writeToIndex } from "./database";
import {
  getDataDirectory,
  readContentFromFilesystem,
  writeContentToFilesystem,
} from "./filesystem";
import type { ContentTypeConfig, ReferenceSpec } from "./types";

/**
 * Result of updating references for a single content type
 */
export interface ReferenceUpdateResult {
  contentType: string;
  updatedCount: number;
  updatedSlugs: string[];
  errors: Array<{ slug: string; error: string }>;
}

/**
 * Options for updating references
 */
export interface UpdateReferencesOptions {
  /** The old slug that references point to */
  oldSlug: string;
  /** The new slug to update references to */
  newSlug: string;
  /** Reference specifications to process */
  referenceSpecs: ReferenceSpec[];
  /** Optional content directory override */
  contentDirectory?: string;
}

/**
 * Get a field value from an object
 */
function getFieldValue(
  obj: Record<string, unknown>,
  field: string,
): unknown {
  return obj[field];
}

/**
 * Set a field value in an object
 */
function setFieldValue(
  obj: Record<string, unknown>,
  field: string,
  value: unknown,
): void {
  obj[field] = value;
}

/**
 * Extract slug from an index key.
 * Supports common key patterns:
 * - string: the slug itself
 * - [date, slug]: composite key with date first
 * - [slug, ...]: array with slug first
 */
function extractSlugFromKey(key: Key): string | null {
  if (typeof key === "string") {
    return key;
  }
  if (Array.isArray(key)) {
    // Convention: slug is either the second element (for [date, slug])
    // or the first element if it's a string
    if (key.length >= 2 && typeof key[1] === "string") {
      return key[1];
    }
    if (key.length >= 1 && typeof key[0] === "string") {
      return key[0];
    }
  }
  return null;
}

/**
 * Update references for a single content type using index-based lookup (optimized)
 */
async function updateReferencesViaIndex<
  TReferencingData extends Record<string, unknown>,
  TReferencingIndexValue extends Record<string, unknown>,
  TReferencingKey extends Key,
>(
  spec: ReferenceSpec<TReferencingData, TReferencingIndexValue, TReferencingKey>,
  oldSlug: string,
  newSlug: string,
  contentDirectory: string,
): Promise<ReferenceUpdateResult> {
  const { config, indexField, dataField } = spec;
  const result: ReferenceUpdateResult = {
    contentType: config.contentType,
    updatedCount: 0,
    updatedSlugs: [],
    errors: [],
  };

  // Field to check in index
  const indexFieldName = indexField!;
  // Field to update in data (defaults to indexField if not specified)
  const dataFieldName = dataField || indexField!;

  const db = getContentDatabase<TReferencingIndexValue, TReferencingKey>(
    config as ContentTypeConfig,
    contentDirectory,
  );

  try {
    // Get all index entries as an array
    const entries = db.getRange().asArray;

    // Process each entry
    for (const { key, value } of entries) {
      const referenceValue = getFieldValue(
        value as Record<string, unknown>,
        indexFieldName,
      );

      if (referenceValue === oldSlug) {
        const slug = extractSlugFromKey(key);
        if (!slug) {
          result.errors.push({
            slug: String(key),
            error: "Could not extract slug from index key",
          });
          continue;
        }

        try {
          // Read the data file
          const data = await readContentFromFilesystem<TReferencingData>(
            config as ContentTypeConfig<TReferencingData>,
            slug,
            contentDirectory,
          );

          // Update the reference field in data
          setFieldValue(data as Record<string, unknown>, dataFieldName, newSlug);

          // Write updated data back to filesystem
          await writeContentToFilesystem(
            config as ContentTypeConfig<TReferencingData>,
            slug,
            data,
            contentDirectory,
          );

          // Update the index entry
          const newIndexKey = config.buildIndexKey(slug, data);
          const newIndexValue = config.buildIndexValue(data);
          await writeToIndex(db, newIndexKey, newIndexValue);

          result.updatedCount++;
          result.updatedSlugs.push(slug);
        } catch (error) {
          result.errors.push({
            slug,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } finally {
    db.close();
  }

  return result;
}

/**
 * Update references for a single content type using data file scan (fallback)
 */
async function updateReferencesViaFileScan<
  TReferencingData extends Record<string, unknown>,
  TReferencingIndexValue,
  TReferencingKey extends Key,
>(
  spec: ReferenceSpec<TReferencingData, TReferencingIndexValue, TReferencingKey>,
  oldSlug: string,
  newSlug: string,
  contentDirectory: string,
): Promise<ReferenceUpdateResult> {
  const { config, dataField } = spec;
  const result: ReferenceUpdateResult = {
    contentType: config.contentType,
    updatedCount: 0,
    updatedSlugs: [],
    errors: [],
  };

  const dataFieldName = dataField!;
  const dataDirectory = getDataDirectory(
    config as ContentTypeConfig,
    contentDirectory,
  );

  let slugDirectories: string[];
  try {
    slugDirectories = await readdir(dataDirectory);
  } catch {
    // Directory doesn't exist, no references to update
    return result;
  }

  for (const slug of slugDirectories) {
    try {
      const data = await readContentFromFilesystem<TReferencingData>(
        config as ContentTypeConfig<TReferencingData>,
        slug,
        contentDirectory,
      );

      const referenceValue = getFieldValue(
        data as Record<string, unknown>,
        dataFieldName,
      );

      if (referenceValue === oldSlug) {
        // Update the reference field
        setFieldValue(data as Record<string, unknown>, dataFieldName, newSlug);

        // Write updated data back to filesystem
        await writeContentToFilesystem(
          config as ContentTypeConfig<TReferencingData>,
          slug,
          data,
          contentDirectory,
        );

        // Update the index entry
        const db = getContentDatabase<TReferencingIndexValue, TReferencingKey>(
          config as ContentTypeConfig,
          contentDirectory,
        );
        try {
          const indexKey = config.buildIndexKey(slug, data);
          const indexValue = config.buildIndexValue(data);
          await writeToIndex(db, indexKey, indexValue);
        } finally {
          db.close();
        }

        result.updatedCount++;
        result.updatedSlugs.push(slug);
      }
    } catch (error) {
      result.errors.push({
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Update references for a single content type
 */
export async function updateReferencesForSpec<
  TReferencingData extends Record<string, unknown>,
  TReferencingIndexValue,
  TReferencingKey extends Key,
>(
  spec: ReferenceSpec<TReferencingData, TReferencingIndexValue, TReferencingKey>,
  oldSlug: string,
  newSlug: string,
  contentDirectory: string,
): Promise<ReferenceUpdateResult> {
  const { indexField, dataField } = spec;

  // Validate that at least one field is specified
  if (!indexField && !dataField) {
    return {
      contentType: spec.config.contentType,
      updatedCount: 0,
      updatedSlugs: [],
      errors: [
        {
          slug: "",
          error: "ReferenceSpec must have either indexField or dataField",
        },
      ],
    };
  }

  // Use index-based lookup if indexField is provided (optimized path)
  if (indexField) {
    return updateReferencesViaIndex(
      spec as ReferenceSpec<
        TReferencingData,
        Record<string, unknown>,
        TReferencingKey
      >,
      oldSlug,
      newSlug,
      contentDirectory,
    );
  }

  // Fall back to file scan if only dataField is provided
  return updateReferencesViaFileScan(spec, oldSlug, newSlug, contentDirectory);
}

/**
 * Update all references across multiple content types when a slug changes
 */
export async function updateReferences(
  options: UpdateReferencesOptions,
): Promise<ReferenceUpdateResult[]> {
  const {
    oldSlug,
    newSlug,
    referenceSpecs,
    contentDirectory: providedContentDirectory,
  } = options;

  const contentDirectory = providedContentDirectory || getContentDirectory();
  const results: ReferenceUpdateResult[] = [];

  for (const spec of referenceSpecs) {
    const result = await updateReferencesForSpec(
      spec,
      oldSlug,
      newSlug,
      contentDirectory,
    );
    results.push(result);
  }

  return results;
}
