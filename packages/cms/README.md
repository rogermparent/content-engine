# @discontent/cms

The core CMS engine providing generic, reusable primitives for managing file-backed content. All functionality is driven by a `ContentTypeConfig` that consumers define to describe their specific content type.

## ContentTypeConfig

`ContentTypeConfig<TData, TIndexValue, TKey>` is the central abstraction. It describes how a content type is stored, indexed, and referenced:

```ts
interface ContentTypeConfig<TData, TIndexValue, TKey extends Key> {
  contentType: string; // identifier, e.g. "recipes"
  dataDirectory: string; // subdirectory for data files
  indexDirectory: string; // subdirectory for the LMDB index
  dataFilename: string; // filename for each content item, e.g. "recipe.json"
  buildIndexValue(data: TData): TIndexValue;
  buildIndexKey(slug: string, data: TData): TKey;
  createDefaultSlug?(data: TData): string;
  uploadsDirectory?: string;
  referencedBy?: ReferenceSpec[]; // other types that reference this one by slug
}
```

## Sub-modules

### `content/`

Core CRUD operations and indexing.

| Export                      | Description                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `createContent(options)`    | Creates a new content item on the filesystem and writes its index entry. Throws `SlugConflictError` if the slug is already taken. |
| `updateContent(options)`    | Updates an existing content item. Handles slug renames, index key changes, and optional upload processing.                        |
| `deleteContent(options)`    | Deletes a content item from the filesystem and removes its index entry.                                                           |
| `readContentFile(options)`  | Reads and returns the data file for a single content item by slug.                                                                |
| `readContentIndex(options)` | Reads paginated entries from the LMDB index. Returns `{ entries, total, more }`. Supports `limit`, `offset`, and `reverse`.       |
| `rebuildIndex(options)`     | Scans all data files and rebuilds the LMDB index from scratch.                                                                    |

All mutation functions accept an optional `author` and `commitMessage` to record a git commit after the change.

### `fs/`

Filesystem helpers.

| Export                        | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `getContentDirectory()`       | Returns the content directory path. Respects `CONTENT_DIRECTORY` env var; falls back to `test-content` in `TEST_MODE`, then `content`. |
| `contentDirectory`            | Pre-resolved content directory path (evaluated at import time).                                                                        |
| `collectFiles(dir, filename)` | Recursively collects all files with a given name under a directory.                                                                    |

### `git/`

Git integration.

| Export                                                      | Description                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `commitChanges(contentDirectory, message, author?, paths?)` | Stages the given paths and creates a git commit. No-ops if the content directory is not a git repo. |
| `directoryIsGitRepo(dir)`                                   | Returns `true` if the directory contains a `.git` folder.                                           |

### `forms/`

Form data parsing.

| Export                            | Description                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parseFormData(schema, formData)` | Validates a `FormData` object against a Zod schema, using lodash `set` for nested field assignment. Returns the parsed data or throws on validation failure. |

### `hooks/`

React hooks.

| Export                 | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| `useCurrentTimezone()` | Returns the browser's current IANA timezone string using `Intl.DateTimeFormat`. |

## Key Types

- **`ReferenceSpec`** — Describes a content type that references another by slug. Used by `updateContent` to automatically update references when a slug changes.
- **`UploadSpec`** — Per-field upload specification: a `File`, a `fileImportUrl`, a `clearFile` flag, or an existing filename.
- **`FileUploadData`** — Resolved upload data passed to custom `processUploads` callbacks.

## Part of [Discontent](https://github.com/rogermparent/discontent)
