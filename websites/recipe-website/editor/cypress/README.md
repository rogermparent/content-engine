# Cypress E2E Tests

This directory contains end-to-end tests for the recipe editor using Cypress.

## Running Tests

### Interactive Mode (Cypress UI)

Run tests with the Cypress Test Runner UI for development:

```bash
# From the recipe-editor directory
pnpm e2e-dev
```

This will:

1. Start the Next.js dev server with test content
2. Open the Cypress Test Runner
3. Allow you to select and run individual tests

### Headless Mode

Run tests in headless mode (useful for CI):

```bash
# From the recipe-editor directory
pnpm e2e-dev:headless
```

### Production Build Testing

Test against a production build:

```bash
# From the recipe-editor directory
pnpm build
pnpm e2e-start  # Interactive
pnpm e2e-start:headless  # Headless
```

## Test Structure

```
cypress/
├── e2e/                    # Test files
│   ├── edit.cy.ts         # Recipe editing tests
│   ├── ingredient-preview.cy.ts  # Ingredient preview tests
│   ├── new-recipe.cy.ts   # New recipe creation tests
│   ├── recipe.cy.ts       # Recipe viewing tests
│   └── ...
├── fixtures/              # Test data
│   ├── test-content/      # Content fixtures
│   ├── images/            # Test images
│   ├── videos/            # Test videos
│   └── users/             # User credentials
└── support/               # Support files
    ├── commands.ts        # Custom Cypress commands
    └── e2e.ts            # Global configuration

```

## Test Files

### `ingredient-preview.cy.ts`

Tests the auto-preview feature for ingredient inputs:

- Side-by-side layout verification
- Auto-updating preview as you type
- Markdown rendering in preview
- Empty state handling
- Preview persistence after form submission
- Ingredient import with preview

### `edit.cy.ts`

Tests recipe editing functionality:

- Recipe title and metadata editing
- Image upload and management
- Ingredient and instruction management
- Toggle ingredient/heading
- Time calculations (prep, cook, total)

### `new-recipe.cy.ts`

Tests creating new recipes from scratch

### `recipe.cy.ts`

Tests recipe viewing functionality

## Custom Commands

The following custom commands are available (defined in `support/commands.ts`):

- `cy.resetData(fixture?)` - Reset test data to a specific fixture
- `cy.fillSignInForm(options?)` - Fill in and submit the sign-in form
- `cy.signIn(options?)` - Navigate to sign-in and authenticate
- `cy.checkNamesInOrder(names)` - Verify list items appear in specific order
- `cy.loadGitFixture(fixture)` - Load a git repository fixture
- `cy.initializeContentGit()` - Initialize git in test content directory
- `cy.getContentGitLog()` - Get git log from test content directory

## Fixtures

Test fixtures are stored in `cypress/fixtures/`:

- `test-content/` - Various content states for testing
  - `two-pages/` - Basic setup with multiple recipes
  - Other fixtures for specific test scenarios
- `users/` - User authentication data
- `images/` - Test images for upload testing
- `videos/` - Test videos for video upload testing

## Writing Tests

### Basic Structure

```typescript
describe("Feature Name", function () {
  beforeEach(function () {
    cy.resetData("fixture-name");
    cy.visit("/path/to/page");
    cy.fillSignInForm(); // If authentication is required
  });

  it("should do something", function () {
    // Test assertions
  });
});
```

### Best Practices

1. **Use Testing Library queries**: Prefer `cy.findByText()`, `cy.findByLabelText()`, etc.
2. **Reset data before each test**: Use `cy.resetData()` to ensure clean state
3. **Wait for elements**: Cypress automatically waits, but use timeouts when needed
4. **Test user flows**: Focus on realistic user interactions
5. **Keep tests independent**: Each test should work in isolation

## Debugging

### Visual Debugging

When running in interactive mode, you can:

- Click on test steps to see DOM snapshots
- Use the time-travel debugger
- Open DevTools for detailed inspection

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots (saved to `cypress/screenshots/`)
- Videos of the entire test run (saved to `cypress/videos/`)

## Continuous Integration

Tests can be run in CI with:

```bash
pnpm e2e-dev:headless
```

The configuration includes automatic retries (2 attempts) for flaky tests in run mode.
