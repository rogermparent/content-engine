# @discontent/menus-collection

A content module for managing navigation menus. Provides a `ContentTypeConfig`-driven controller with CRUD server actions, form data parsing, and React components for creating and displaying menus with nested `MenuItem` entries.

## Types

```ts
interface MenuItem {
  name: string;
  href: string;
  children?: MenuItem[];
}

interface Menu {
  items?: MenuItem[];
}
```

## Controller (`controller/`)

### Filesystem utilities

| Export                          | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `menusBaseDirectory`            | Absolute path to the menus data directory   |
| `getMenuDirectory(slug)`        | Path to a specific menu's directory         |
| `getMenuFilePath(slug)`         | Path to a specific menu's JSON data file    |
| `getMenuUploadsDirectory(slug)` | Path to a specific menu's uploads directory |

### Data

| Export                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `getMenuBySlug(slug)` | Reads and returns the `Menu` data for the given slug |

### Server actions

| Export                 | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `updateMenu(formData)` | Persists changes to an existing menu and triggers revalidation |
| `deleteMenu(slug)`     | Deletes a menu's directory and index entry                     |

### Utilities

| Export                    | Description                                 |
| ------------------------- | ------------------------------------------- |
| `createSlug(data)`        | Derives a default slug from the menu name   |
| `parseFormData(formData)` | Parses and validates a menu form submission |

## Components (`components/`)

| Component        | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `MenuForm`       | Base form wrapper for menu data                                             |
| `MenuFields`     | Field inputs for menu name and items                                        |
| `ItemsListInput` | Dynamic list input for adding/removing/reordering nested `MenuItem` entries |
| `CreateMenuForm` | Standalone form for creating a new menu                                     |
| `UpdateMenuForm` | Standalone form for editing an existing menu                                |
| `MenuView`       | Display component that renders a menu's name and item list                  |

## Part of [Discontent](https://github.com/rogermparent/discontent)
