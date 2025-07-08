import { render, screen, within } from "@testing-library/react";

import { test, beforeEach } from "vitest";
import { emptyDir, ensureDir, outputJSON } from "fs-extra";
import { getContentDirectory } from "./stub_content_directory";

import { SiteFooter, SiteHeader } from "recipe-editor/src/app";
import { join } from "path";

const testContentDirectory = getContentDirectory();
process.env.CONTENT_DIRECTORY = testContentDirectory;

const testMenusDirectory = join(testContentDirectory, "menus");
const testFooterMenuDirectory = join(testMenusDirectory, "footer");
const testFooterMenuPath = join(testFooterMenuDirectory, "menu.json");
const testHeaderMenuDirectory = join(testMenusDirectory, "header");
const testHeaderMenuPath = join(testHeaderMenuDirectory, "menu.json");

const menuWithTest = {
  items: [{ name: "Test", href: "/test" }],
};
const menuWithSignIn = {
  items: [{ name: "Test", href: "/test" }, { type: "sign-in" }],
};
const menuWithCustomSignIn = {
  items: [
    { name: "Test", href: "/test" },
    { type: "sign-in", signInText: "Login", signOutText: "Logout" },
  ],
};
const menuWithTwoSignIn = {
  items: [
    { name: "Test", href: "/test" },
    { type: "sign-in" },
    { type: "sign-in" },
  ],
};

beforeEach(async () => {
  vi.clearAllMocks();
  await ensureDir(testContentDirectory);
  await emptyDir(testContentDirectory);
});

import { auth } from "./stub_auth";

const createObjectURL = vi.fn((file: File) => `/WINDOWURL/${file.name}`);
const revokeObjectURL = vi.fn((_file: File) => undefined);

vi.stubGlobal(
  "URL",
  Object.assign(window.URL, { createObjectURL, revokeObjectURL }),
);

describe("Site Footer", async () => {
  describe("when authenticated", () => {
    beforeEach(() => {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
    });

    describe("with an undefined menu", async () => {
      test("should keep the same styles", async function () {
        render(await SiteFooter());
        expect(screen.getByText("New Recipe")).toHaveClass(
          "inline-block",
          "p-2",
          "hover:underline",
        );
        expect(screen.getByText("Settings")).toHaveClass(
          "inline-block",
          "p-2",
          "hover:underline",
        );
        expect(screen.getByText("Sign Out")).toHaveClass(
          "inline-block",
          "p-2",
          "hover:underline",
          "cursor-pointer",
        );
      });

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

    describe("with a single test item defined", () => {
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

    describe("with a test item and sign in button defined", () => {
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

  describe("when unauthenticated", () => {
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

    describe("with a single test item defined", () => {
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

    describe("with a test item and sign in button defined", () => {
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

  describe("with a test item and custom sign in button defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithCustomSignIn);
    });

    test("should be able to display Sign Out in a custom menu", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteFooter());
      expect(screen.getByText("Logout")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });

    test("should be able to display Sign In in a custom menu", async function () {
      auth.mockImplementation((async () => null) as typeof auth);
      render(await SiteFooter());
      expect(screen.getByText("Login")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("with a test item and two sign in buttons defined", () => {
    beforeEach(async () => {
      await ensureDir(testFooterMenuDirectory);
      await outputJSON(testFooterMenuPath, menuWithTwoSignIn);
    });

    test("should be able to display Sign Out buttons only calling auth once", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteFooter());
      expect(screen.getAllByText("Sign Out")).toHaveLength(2);
      expect(screen.getByText("Test")).toBeDefined();
      expect(vi.mocked(auth)).toBeCalledTimes(1);
    });

    test("should be able to display Sign In buttons only calling auth once", async function () {
      auth.mockImplementation((async () => null) as typeof auth);
      render(await SiteFooter());
      expect(screen.getAllByText("Sign In")).toHaveLength(2);
      expect(screen.getByText("Test")).toBeDefined();
      expect(vi.mocked(auth)).toBeCalledTimes(1);
    });
  });
});

describe("Site Header", async () => {
  describe("with an undefined menu", async () => {
    test("should show the site heading and no other links", async function () {
      render(await SiteHeader());
    });
  });

  describe("with a single test item defined", () => {
    beforeEach(async () => {
      await ensureDir(testHeaderMenuDirectory);
      await outputJSON(testHeaderMenuPath, menuWithTest);
    });

    test("should keep the same styles", async function () {
      render(await SiteHeader());
      expect(screen.getByText("Test")).toHaveClass(
        "p-1",
        "inline-block",
        "hover:underline",
      );
    });

    test("should show the one menu item in the custom menu", async function () {
      render(await SiteHeader());
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("with a test item and sign in button defined", () => {
    beforeEach(async () => {
      await ensureDir(testHeaderMenuDirectory);
      await outputJSON(testHeaderMenuPath, menuWithSignIn);
    });

    test("should keep the same styles", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteHeader());
      expect(screen.getByText("Sign Out")).toHaveClass(
        "p-1",
        "inline-block",
        "hover:underline",
        "cursor-pointer",
      );
      expect(screen.getByText("Test")).toHaveClass(
        "p-1",
        "inline-block",
        "hover:underline",
      );
    });

    test("should be able to display Sign Out in a custom menu", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteHeader());
      expect(screen.getByText("Sign Out")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });

    test("should be able to display Sign In in a custom menu", async function () {
      auth.mockImplementation((async () => null) as typeof auth);
      render(await SiteHeader());
      expect(screen.getByText("Sign In")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("with a test item and custom sign in button defined", () => {
    beforeEach(async () => {
      await ensureDir(testHeaderMenuDirectory);
      await outputJSON(testHeaderMenuPath, menuWithCustomSignIn);
    });

    test("should be able to display Sign Out in a custom menu", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteHeader());
      expect(screen.getByText("Logout")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });

    test("should be able to display Sign In in a custom menu", async function () {
      auth.mockImplementation((async () => null) as typeof auth);
      render(await SiteHeader());
      expect(screen.getByText("Login")).toBeDefined();
      expect(screen.getByText("Test")).toBeDefined();
    });
  });

  describe("with a test item and two sign in buttons defined", () => {
    beforeEach(async () => {
      await ensureDir(testHeaderMenuDirectory);
      await outputJSON(testHeaderMenuPath, menuWithTwoSignIn);
    });

    test("should be able to display Sign Out buttons only calling auth once", async function () {
      auth.mockImplementation((async () => ({
        user: { email: "vitest@example.com", name: "Vitest Tester" },
      })) as typeof auth);
      render(await SiteHeader());
      expect(screen.getAllByText("Sign Out")).toHaveLength(2);
      expect(screen.getByText("Test")).toBeDefined();
      expect(vi.mocked(auth)).toBeCalledTimes(1);
    });

    test("should be able to display Sign In buttons only calling auth once", async function () {
      auth.mockImplementation((async () => null) as typeof auth);
      render(await SiteHeader());
      expect(screen.getAllByText("Sign In")).toHaveLength(2);
      expect(screen.getByText("Test")).toBeDefined();
      expect(vi.mocked(auth)).toBeCalledTimes(1);
    });
  });
});
