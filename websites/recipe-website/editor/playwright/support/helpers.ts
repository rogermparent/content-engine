import { expect, type Page } from "@playwright/test";

export interface SignInOptions {
  email?: string;
  password?: string;
}

/**
 * Sets the value of a Lexical markdown field (description, note, instruction
 * text, yield) by switching it to Source mode and filling the raw-markdown
 * textarea. Playwright's fill() can't reliably drive the Lexical WYSIWYG, and
 * the field's submitted `name` is on a hidden input, so we locate the field's
 * container via that hidden input and use its Source toggle + textarea.
 */
export async function fillMarkdownField(
  page: Page,
  name: string,
  value: string,
): Promise<void> {
  // The hidden input lives in the same FieldWrapper <div> as the editor and its
  // Source toggle, so the parent is a stable container (the toggle's label
  // changes to "Editor" after clicking, so we must not key off button text).
  const container = page
    .locator(`input[type="hidden"][name="${name}"]`)
    .locator("xpath=..");
  await container.getByRole("button", { name: "Source", exact: true }).click();
  await container.locator("textarea").fill(value);
}

export async function fillSignInForm(
  page: Page,
  { email = "admin@nextmail.com", password = "password" }: SignInOptions = {},
): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page
    .getByRole("button", { name: "Sign in with Credentials", exact: true })
    .click();
}

export async function signIn(
  page: Page,
  options?: SignInOptions,
): Promise<void> {
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await fillSignInForm(page, options);
}

export async function checkNamesInOrder(
  page: Page,
  names: string[],
): Promise<void> {
  // Scope to the recipe list so semantic list items elsewhere on the page
  // (e.g. pagination's <ul><li>) are not miscounted as recipe cards.
  const items = page.getByTestId("recipe-list").getByRole("listitem");
  await expect(items).toHaveCount(names.length);
  for (let i = 0; i < names.length; i++) {
    await expect(items.nth(i).getByText(names[i])).toBeVisible();
  }
}
