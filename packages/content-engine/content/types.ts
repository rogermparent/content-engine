import type { Key, RootDatabase } from "lmdb";

/**
 * Configuration for content types that defines how content is stored and indexed
 * TKey is flexible to support different index key structures (string, number, array, etc.)
 */
export interface ContentTypeConfig<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type identifier (e.g., "recipes", "featured-recipes") */
  contentType: string;

  /** Directory name for storing data files, relative to content directory */
  dataDirectory: string;

  /** Directory name for the LMDB index, relative to content directory */
  indexDirectory: string;

  /** Filename for the content data file (e.g., "recipe.json") */
  dataFilename: string;

  /** Function to build the index value from the full data */
  buildIndexValue: (data: TData) => TIndexValue;

  /** Function to build the index key from slug and data */
  buildIndexKey: (slug: string, data: TData) => TKey;

  /** Optional function to generate a default slug from data */
  createDefaultSlug?: (data: TData) => string;

  /** Optional directory name for uploads, relative to content directory */
  uploadsDirectory?: string;
}

/**
 * Upload specification for a single field
 */
export interface UploadSpec {
  /** The File to upload (optional) */
  file?: File;
  /** URL to import file from (optional) */
  fileImportUrl?: string;
  /** Whether to clear/remove the existing file */
  clearFile?: boolean;
  /** The existing filename (if any) */
  existingFile?: string;
}

/**
 * Options for creating content
 */
export interface CreateContentOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** The URL-friendly slug for this content */
  slug: string;

  /** The full content data to store in the filesystem */
  data: TData;

  /** Optional content directory override */
  contentDirectory?: string;

  /** Optional author for git commit */
  author?: { name: string; email: string };

  /** Custom git commit message */
  commitMessage?: string;

  /** Optional uploads to process (keyed by field name) */
  uploads?: Record<string, UploadSpec>;

  /**
   * Optional custom upload processor. If provided, this will be called
   * instead of the default upload processing. Receives the resolved
   * upload data for each field.
   */
  processUploads?: (
    config: ContentTypeConfig,
    slug: string,
    uploads: Record<string, FileUploadData | undefined>,
    contentDirectory: string,
  ) => Promise<void>;
}

/**
 * Options for updating content
 */
export interface UpdateContentOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** The new slug for this content */
  slug: string;

  /** The current slug (before update) */
  currentSlug: string;

  /** The current index key (before update) - used to remove old entry if key changes */
  currentIndexKey: TKey;

  /** The full content data to store in the filesystem */
  data: TData;

  /** Optional content directory override */
  contentDirectory?: string;

  /** Optional author for git commit */
  author?: { name: string; email: string };

  /** Custom git commit message */
  commitMessage?: string;

  /** Optional uploads to process (keyed by field name) */
  uploads?: Record<string, UploadSpec>;

  /**
   * Optional custom upload processor. If provided, this will be called
   * instead of the default upload processing. Receives the resolved
   * upload data for each field, plus additional context for updates.
   */
  processUploads?: (
    config: ContentTypeConfig,
    slug: string,
    uploads: Record<string, FileUploadData | undefined>,
    contentDirectory: string,
    currentSlug: string,
    uploadSpecs: Record<string, UploadSpec>,
  ) => Promise<void>;
}

/**
 * Options for deleting content
 */
export interface DeleteContentOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** The slug of content to delete */
  slug: string;

  /** The index key of content to delete */
  indexKey: TKey;

  /** Optional content directory override */
  contentDirectory?: string;

  /** Optional author for git commit */
  author?: { name: string; email: string };

  /** Custom git commit message */
  commitMessage?: string;
}

/**
 * Options for reading content from the index
 */
export interface ReadContentIndexOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** Maximum number of entries to return */
  limit?: number;

  /** Number of entries to skip */
  offset?: number;

  /** Whether to return results in reverse order (newest first) */
  reverse?: boolean;

  /** Optional content directory override */
  contentDirectory?: string;
}

/**
 * Result from reading the content index
 */
export interface ReadContentIndexResult<TIndexValue = unknown, TKey extends Key = Key> {
  entries: Array<{
    key: TKey;
    value: TIndexValue;
  }>;
  total: number;
  more: boolean;
}

/**
 * Options for reading a single content file
 */
export interface ReadContentFileOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** The slug of the content to read */
  slug: string;

  /** Optional content directory override */
  contentDirectory?: string;
}

/**
 * File upload information
 */
export interface FileUploadData {
  /** The filename to use */
  fileName: string;
  /** The File object if uploading from form */
  file?: File;
  /** URL to import file from */
  fileImportUrl?: string;
}

/**
 * Options for processing uploads
 */
export interface ProcessUploadsOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** The slug for the content */
  slug: string;

  /** Uploads to process */
  uploads: Record<
    string,
    {
      file?: File;
      clearFile?: boolean;
      existingFile?: string;
      fileImportUrl?: string;
    }
  >;

  /** Optional content directory override */
  contentDirectory?: string;
}

/**
 * Generic database instance type
 */
export type ContentDatabase<
  TIndexValue = unknown,
  TKey extends Key = Key,
> = RootDatabase<TIndexValue, TKey>;

/**
 * Options for rebuilding the index
 */
export interface RebuildIndexOptions<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TIndexValue = unknown,
  TKey extends Key = Key,
> {
  /** The content type configuration */
  config: ContentTypeConfig<TData, TIndexValue, TKey>;

  /** Optional content directory override */
  contentDirectory?: string;
}
