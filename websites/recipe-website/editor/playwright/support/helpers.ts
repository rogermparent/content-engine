import { expect, type Page } from "@playwright/test";

export interface SignInOptions {
  email?: string;
  password?: string;
}

export async function fillSignInForm(
  page: Page,
  { email = "admin@nextmail.com", password = "password" }: SignInOptions = {},
): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByText("Sign in with Credentials").click();
}

export async function signIn(
  page: Page,
  options?: SignInOptions,
): Promise<void> {
  await page.getByText("Sign In").click();
  await fillSignInForm(page, options);
}

export async function checkNamesInOrder(
  page: Page,
  names: string[],
): Promise<void> {
  const items = page.getByRole("listitem");
  await expect(items).toHaveCount(names.length);
  for (let i = 0; i < names.length; i++) {
    await expect(items.nth(i).getByText(names[i])).toBeVisible();
  }
}
