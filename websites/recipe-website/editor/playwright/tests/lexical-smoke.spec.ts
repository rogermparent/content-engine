import { test, expect } from "../support/test";
import {
  signIn,
  fillSignInForm,
  markdownEditorReady,
  openMarkdownSource,
} from "../support/helpers";

test.describe("Lexical editor smoke @lexical", () => {
  test("description editor renders, and markdown round-trips through rich mode", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/new-recipe");

    // The rich editor's contenteditable should be present.
    await expect(page.getByLabel("Description")).toBeVisible();

    // Scope to the Description field (other fields are also Lexical editors).
    const descField = page
      .locator('input[type=hidden][name="description"]')
      .locator("xpath=..");

    // Switch to source mode and enter markdown with a custom tag.
    await descField.getByRole("button", { name: "Source" }).click();
    const source = page.getByLabel("Description source");
    await expect(source).toBeVisible();
    const input = 'Hello **world** <Multiplyable baseNumber="2" /> cups';
    await source.fill(input);

    // Hidden FormData input mirrors the source.
    await expect(
      page.locator('input[type=hidden][name="description"]'),
    ).toHaveValue(input);

    // Toggle to rich (parses markdown) then back to source (re-serializes).
    await descField.getByRole("button", { name: "Editor" }).click();
    await expect(page.getByLabel("Description")).toBeVisible();
    await descField.getByRole("button", { name: "Source" }).click();

    const roundTripped = await page
      .getByLabel("Description source")
      .inputValue();
    expect(roundTripped).toContain("**world**");
    expect(roundTripped).toContain('<Multiplyable baseNumber="2" />');
  });

  // Regression: editing in *rich* (WYSIWYG) mode must persist. The Source-mode
  // helpers the rest of the suite uses never exercised this path, so the bug
  // (rich edits silently dropped — the shared markdown value stayed at the
  // imported text) went uncaught.
  test("typing in rich mode updates the submitted value and survives to source", async ({
    page,
    resetData,
  }) => {
    await resetData("three-recipes");
    await page.goto("/");
    await signIn(page);
    await page.goto("/new-recipe");

    const editable = await markdownEditorReady(page, "description");
    await editable.click();
    const typed = "Typed directly in the rich editor";
    await page.keyboard.type(typed);

    // The bug: this hidden input (submitted as FormData) stayed empty because
    // the rich-mode edit never reached the shared markdown value.
    await expect(
      page.locator('input[type=hidden][name="description"]'),
    ).toHaveValue(typed);

    // Switching rich → Source must carry the edit, not revert to imported text.
    const source = await openMarkdownSource(page, "description");
    await expect(source).toHaveValue(typed);
  });

  test("editing an existing recipe in rich mode persists through submit and reload", async ({
    page,
    resetData,
  }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6/edit");
    await fillSignInForm(page);

    const editable = await markdownEditorReady(page, "description");
    await editable.click();
    await page.keyboard.press("ControlOrMeta+a");
    const rewritten = "Rewritten in the rich editor";
    await page.keyboard.type(rewritten);

    await expect(
      page.locator('input[type=hidden][name="description"]'),
    ).toHaveValue(rewritten);

    await page.getByRole("button", { name: "Submit", exact: true }).click();

    // The edited description renders on the recipe view page.
    await expect(
      page.getByRole("heading", { level: 1, name: "Recipe 6" }),
    ).toBeVisible();
    await expect(page.getByText(rewritten)).toBeVisible();

    // Re-open the editor: the persisted markdown round-trips back (single
    // paragraph text is import/export-stable).
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await expect(page.getByText("Editing Recipe: Recipe 6")).toBeVisible();
    await expect(
      page.locator('input[type=hidden][name="description"]'),
    ).toHaveValue(rewritten);
  });

  // Regression: rows are keyed by index with controlled values, so a reorder
  // rewrites each row's `value` from outside. The composer only imports at
  // mount, so without the external-value sync in LexicalMarkdownInput the
  // editors kept showing the pre-move text (the hidden inputs moved, the
  // visible content didn't).
  test("reordering instructions visibly swaps the rich editors' content", async ({
    page,
    resetData,
  }) => {
    await resetData("two-pages");
    await page.goto("/recipe/recipe-6/edit");
    await fillSignInForm(page);

    // Row 0 mounts from the fixture; add a second row and type into it.
    await markdownEditorReady(page, "instructions[0].text");
    await page
      .getByRole("button", { name: "Add Instruction", exact: true })
      .click();
    const secondText = "Second step typed fresh";
    const editor1 = await markdownEditorReady(page, "instructions[1].text");
    await editor1.click();
    await page.keyboard.type(secondText);
    await expect(
      page.locator('input[type=hidden][name="instructions[1].text"]'),
    ).toHaveValue(secondText);

    // Move instruction 1 down via its row's ArrayItemControls.
    const row0 = page
      .locator('input[type=hidden][name="instructions[0].text"]')
      .locator("xpath=ancestor::li[1]");
    await row0
      .getByRole("button", { name: "Move item down", exact: true })
      .click();

    // The submitted values swapped…
    await expect(
      page.locator('input[type=hidden][name="instructions[0].text"]'),
    ).toHaveValue(secondText);
    await expect(
      page.locator('input[type=hidden][name="instructions[1].text"]'),
    ).toHaveValue(/tsp salt in water/);

    // …and, the point of this spec, so did the *visible* rich content.
    await expect(
      await markdownEditorReady(page, "instructions[0].text"),
    ).toContainText(secondText);
    await expect(
      await markdownEditorReady(page, "instructions[1].text"),
    ).toContainText("tsp salt in water");
  });
});
