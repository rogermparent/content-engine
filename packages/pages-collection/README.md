# @discontent/pages-collection

A content module for managing generic CMS pages. Provides a `ContentTypeConfig`-driven controller with CRUD server actions, form data parsing, and React components for creating, editing, and viewing pages.

## Types

```ts
interface Page {
  name: string;
  date: number; // Unix timestamp
  content: string; // Markdown body
}
```

## Controller (`controller/`)

### Filesystem utilities

| Export                          | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `pagesBaseDirectory`            | Absolute path to the pages data directory   |
| `getPageDirectory(slug)`        | Path to a specific page's directory         |
| `getPageFilePath(slug)`         | Path to a specific page's JSON data file    |
| `getPageUploadsDirectory(slug)` | Path to a specific page's uploads directory |

### Data

| Export                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `getPageBySlug(slug)` | Reads and returns the `Page` data for the given slug |

### Server actions

| Export                 | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `updatePage(formData)` | Persists changes to an existing page and triggers revalidation |
| `deletePage(slug)`     | Deletes a page's directory and index entry                     |

### Utilities

| Export                    | Description                                 |
| ------------------------- | ------------------------------------------- |
| `createSlug(data)`        | Derives a default slug from the page name   |
| `parseFormData(formData)` | Parses and validates a page form submission |

## Components (`components/`)

| Component        | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `PageForm`       | Base form wrapper for page data                                   |
| `PageFields`     | Field inputs for name, date, and markdown content                 |
| `CreatePageForm` | Standalone form for creating a new page                           |
| `UpdatePageForm` | Standalone form for editing an existing page                      |
| `PageView`       | Display component that renders the page name and markdown content |

## Part of [Discontent](https://github.com/rogermparent/discontent)
