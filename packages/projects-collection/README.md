# @discontent/projects-collection

A content module for managing portfolio projects. Provides a `ContentTypeConfig`-driven controller with CRUD server actions, form data parsing, and React components for creating, editing, and viewing projects.

## Types

```ts
interface Project {
  name: string;
  date: number; // Unix timestamp
  content: string; // Markdown description
}
```

## Controller (`controller/`)

### Filesystem utilities

| Export                             | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `projectsBaseDirectory`            | Absolute path to the projects data directory   |
| `getProjectDirectory(slug)`        | Path to a specific project's directory         |
| `getProjectFilePath(slug)`         | Path to a specific project's JSON data file    |
| `getProjectUploadsDirectory(slug)` | Path to a specific project's uploads directory |

### Data

| Export                   | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `getProjectBySlug(slug)` | Reads and returns the `Project` data for the given slug |

### Server actions

| Export                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `updateProject(formData)` | Persists changes to an existing project and triggers revalidation |
| `deleteProject(slug)`     | Deletes a project's directory and index entry                     |

### Utilities

| Export                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `createSlug(data)`        | Derives a default slug from the project name   |
| `parseFormData(formData)` | Parses and validates a project form submission |

## Components (`components/`)

| Component           | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `ProjectForm`       | Base form wrapper for project data                                       |
| `ProjectFields`     | Field inputs for name, date, and markdown content                        |
| `CreateProjectForm` | Standalone form for creating a new project                               |
| `UpdateProjectForm` | Standalone form for editing an existing project                          |
| `ProjectView`       | Display component that renders the project name and markdown description |

## Part of [Discontent](https://github.com/rogermparent/discontent)
