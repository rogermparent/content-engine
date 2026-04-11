# @discontent/component-library

A shared React UI component library providing form inputs, display components, and shadcn/ui primitives. Consumed by website frontends across the Discontent monorepo.

## Form Inputs (`components/Form/inputs/`)

Each input is a React component intended for use inside a Next.js Server Action form.

| Component                        | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| `TextInput`                      | Single-line text field                                |
| `TextAreaInput`                  | Multi-line text area                                  |
| `PasswordInput`                  | Password field with masked input                      |
| `DateInput`                      | Date picker (date only)                               |
| `DateTimeInput`                  | Date and time picker with timezone support            |
| `SelectInput`                    | Dropdown select                                       |
| `CheckboxInput`                  | Checkbox toggle                                       |
| `FileInput`                      | Generic file upload                                   |
| `ImageInput`                     | Image upload with preview and clear button            |
| `VideoInput`                     | Video field with URL or file upload mode toggle       |
| `DurationNumberInput`            | Numeric input for time durations                      |
| `MarkdownInput`                  | Markdown editor with edit/preview tab toggle          |
| `InlineMarkdownInput`            | Inline variant of the markdown editor                 |
| `KeyListAction` / `KeyListState` | Dynamic ordered list input (add/remove/reorder items) |

Form utilities in `components/Form/` include `Label`, `FieldWrapper`, and the shared `baseInputStyle` class string.

## Display Components

| Component           | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| `Button`            | Styled button wrapping the shadcn/ui `Button` primitive                   |
| `SubmitButton`      | Button that reflects form pending state                                   |
| `StyledMarkdown`    | Markdown renderer using `markdown-to-jsx` with Next.js `Link` integration |
| `VideoPlayer`       | `react-player` wrapper with a React context for shared player state       |
| `StickyVideoPlayer` | `VideoPlayer` with a mode toggle for sticky/floating positioning          |

## UI Primitives (`ui/`)

shadcn/ui components including `button`, `dialog`, and `slot`. Styled with Tailwind CSS and `tw-animate-css`.

## Utilities (`lib/`)

| Export          | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `cn(...inputs)` | Combines `clsx` and `tailwind-merge` for conditional class name merging |

## Part of [Discontent](https://github.com/rogermparent/discontent)
