import { render, screen, act, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, beforeEach } from "vitest";
import {
  emptyDir,
  ensureDir,
  open,
  outputJSON,
  readdir,
  readFile,
  writeFile,
} from "fs-extra";
import { getContentDirectory } from "./stub_content_directory";

import { SiteFooter } from "recipe-editor/src/app";
import { join } from "path";

const testContentDirectory = getContentDirectory();
process.env.CONTENT_DIRECTORY = testContentDirectory;

const testMenusDirectory = join(testContentDirectory, "menus");
const testFooterMenuDirectory = join(testMenusDirectory, "footer");
const testFooterMenuPath = join(testFooterMenuDirectory, "menu.json");

beforeEach(async () => {
  await ensureDir(testContentDirectory);
  await emptyDir(testContentDirectory);
});

async function waitForButton(text: string) {
  await userEvent.click(await screen.findByText(text));

  // Wait for form action to resolve
  await waitFor(async () => {
    expect(await screen.findByText(text)).not.toBeDisabled();
  });
}

import { auth } from "./stub_auth";

const createObjectURL = vi.fn((file: File) => `/WINDOWURL/${file.name}`);
const revokeObjectURL = vi.fn((_file: File) => undefined);

vi.stubGlobal(
  "URL",
  Object.assign(window.URL, { createObjectURL, revokeObjectURL }),
);

describe("When authenticated", () => {
  beforeEach(() => {
    auth.mockImplementation((async () => ({
      user: { email: "vitest@example.com", name: "Vitest Tester" },
    })) as typeof auth);
  });

  test("should show existing buttons", async function () {
    render(await SiteFooter());
    expect(await screen.findByText("New Recipe")).toBeDefined();
    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Sign Out")).toBeDefined();
  });

  test("should show existing buttons and a Search button", async function () {
    render(await SiteFooter());
    expect(await screen.findByText("Search")).toBeDefined();
    expect(await screen.findByText("New Recipe")).toBeDefined();
    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Sign Out")).toBeDefined();
  });

  describe("With a custom footer menu defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, {
        items: [{ name: "Test", href: "/test" }],
      });
    });

    test("should overwrite all menu items with the custom menu", async function () {
      render(await SiteFooter());
      expect(await screen.findByText("Search")).not.toBeDefined();
      expect(await screen.findByText("New Recipe")).not.toBeDefined();
      expect(await screen.findByText("Settings")).not.toBeDefined();
      expect(await screen.findByText("Sign Out")).not.toBeDefined();
      expect(await screen.findByText("Test")).toBeDefined();
    });
  });
});

describe("When unauthenticated", () => {
  beforeEach(() => {
    auth.mockImplementation((async () => null) as typeof auth);
  });

  test("should show existing buttons", async function () {
    render(await SiteFooter());
    expect(await screen.findByText("New Recipe")).toBeDefined();
    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Sign In")).toBeDefined();
  });

  test("should show existing buttons and a Search button", async function () {
    render(await SiteFooter());
    expect(await screen.findByText("Search")).toBeDefined();
    expect(await screen.findByText("New Recipe")).toBeDefined();
    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Sign Out")).toBeDefined();
  });

  describe("With a custom footer menu defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, {
        items: [{ name: "Test", href: "/test" }],
      });
    });

    test("should overwrite all menu items with the custom menu", async function () {
      render(await SiteFooter());
      expect(await screen.findByText("Search")).not.toBeDefined();
      expect(await screen.findByText("New Recipe")).not.toBeDefined();
      expect(await screen.findByText("Settings")).not.toBeDefined();
      expect(await screen.findByText("Sign Out")).not.toBeDefined();
      expect(await screen.findByText("Test")).toBeDefined();
    });
  });
});
