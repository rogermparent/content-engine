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

const menuWithTest = {
  items: [{ name: "Test", href: "/test" }],
};
const menuWithSignIn = {
  items: [{ name: "Test", href: "/test" }, { type: "sign-in" }],
};

beforeEach(async () => {
  await ensureDir(testContentDirectory);
  await emptyDir(testContentDirectory);
});

async function waitForButton(text: string) {
  await userEvent.click(screen.getByText(text));

  // Wait for form action to resolve
  await waitFor(async () => {
    expect(screen.queryByText(text)).not.toBeDisabled();
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

  describe("with an undefined menu", async () => {
    test("should show existing buttons", async function () {
      render(await SiteFooter());
      expect(screen.getByText("New Recipe")).toBeDefined();
      expect(screen.getByText("Settings")).toBeDefined();
      expect(screen.getByText("Sign Out")).toBeDefined();
    });

    test("should show existing buttons and a Search button", async function () {
      render(await SiteFooter());
      expect(screen.getByText("Search")).toBeDefined();
      expect(screen.getByText("New Recipe")).toBeDefined();
      expect(screen.getByText("Settings")).toBeDefined();
      expect(screen.getByText("Sign Out")).toBeDefined();
    });
  });

  describe("With only a test item defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithTest);
    });

    test("should overwrite all menu items with the custom menu", async function () {
      render(await SiteFooter());
      expect(screen.queryByText("Search")).toBeNull();
      expect(screen.queryByText("New Recipe")).toBeNull();
      expect(screen.queryByText("Settings")).toBeNull();
      expect(screen.queryByText("Sign Out")).toBeNull();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("With a test item and sign in button defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithSignIn);
    });

    test("should be able to display Sign Out in a custom menu", async function () {
      render(await SiteFooter());
      expect(screen.queryByText("Search")).toBeNull();
      expect(screen.queryByText("New Recipe")).toBeNull();
      expect(screen.queryByText("Settings")).toBeNull();
      expect(screen.getByText("Sign Out")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });
});

describe("When unauthenticated", () => {
  beforeEach(() => {
    auth.mockImplementation((async () => null) as typeof auth);
  });

  describe("with an undefined menu", async () => {
    test("should show existing buttons", async function () {
      render(await SiteFooter());
      expect(screen.getByText("New Recipe")).toBeDefined();
      expect(screen.getByText("Settings")).toBeDefined();
      expect(screen.getByText("Sign In")).toBeDefined();
    });

    test("should show existing buttons and a Search button", async function () {
      render(await SiteFooter());
      expect(screen.getByText("Search")).toBeDefined();
      expect(screen.getByText("New Recipe")).toBeDefined();
      expect(screen.getByText("Settings")).toBeDefined();
      expect(screen.getByText("Sign In")).toBeDefined();
    });
  });

  describe("With only a test item defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithTest);
    });

    test("should overwrite all menu items with the custom menu", async function () {
      render(await SiteFooter());
      expect(screen.queryByText("Search")).toBeNull();
      expect(screen.queryByText("New Recipe")).toBeNull();
      expect(screen.queryByText("Settings")).toBeNull();
      expect(screen.queryByText("Sign In")).toBeNull();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("With a test item and sign in button defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithSignIn);
    });

    test("should be able to display Sign In in a custom menu", async function () {
      render(await SiteFooter());
      expect(screen.queryByText("Search")).toBeNull();
      expect(screen.queryByText("New Recipe")).toBeNull();
      expect(screen.queryByText("Settings")).toBeNull();
      expect(screen.getByText("Sign In")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });
});
