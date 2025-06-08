import { render, screen, within, act, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, beforeEach } from "vitest";
import { GitUI } from "recipe-editor/src/app/(editor)/git/ui";
import { emptyDir, ensureDir, readdir } from "fs-extra";
import { getContentDirectory } from "./stub_content_directory";
import NewRecipeForm from "recipe-editor/src/app/(recipes)/new-recipe/form";

const testContentDirectory = getContentDirectory();
process.env.CONTENT_DIRECTORY = testContentDirectory;

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

describe("When authenticated", () => {
  vi.mock("@/auth", () => ({
    auth() {
      return { user: { email: "vitest@example.com" } };
    },
  }));

  test("should be able to initialize a git repo, create recipes, and manage branches", async function () {
    // Initialize a git repo
    const result = render(await GitUI());
    expect(
      await screen.findByText("Content directory is not tracked with Git."),
    ).toBeTruthy();
    await waitForButton("Initialize");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });
    await screen.findByText("Branches");
    await screen.findByText("Initial commit");

    // Make a second branch

    await userEvent.type(
      await screen.findByLabelText("Branch Name"),
      "new-branch",
    );
    await waitForButton("Create");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });

    // Make a third branch

    result.rerender(await GitUI());

    await userEvent.clear(await screen.findByLabelText("Branch Name"));
    await userEvent.type(
      await screen.findByLabelText("Branch Name"),
      "third-branch",
    );
    await waitForButton("Create");

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    // Make a test recipe

    result.rerender(<NewRecipeForm />);

    await userEvent.type(await screen.findByLabelText("Name"), "Test Recipe");
    await waitForButton("Submit");

    result.rerender(await GitUI());

    // We should be on third-branch and can checkout new-branch
    expect(await screen.findByLabelText("third-branch")).toBeDisabled();
    expect(await screen.findByLabelText("new-branch")).not.toBeDisabled();
    await userEvent.click(await screen.findByLabelText("new-branch"));
    expect(await screen.findByLabelText("new-branch")).toBeChecked();

    // The recipe we just made should show up in history
    expect(await screen.findByText("Add new recipe: test-recipe")).toBeTruthy();

    // Do the checkout
    await waitForButton("Checkout");

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    await screen.findByText("Initial commit");
    // The recipe we added in third-branch should be gone
    expect(screen.queryByText("Add new recipe: test-recipe")).not.toBeTruthy();

    expect(await screen.findByLabelText("new-branch")).toBeDisabled();
    expect(await screen.findByLabelText("third-branch")).not.toBeDisabled();
  });

  test("should be able to initialize a git repo and create a recipe", async function () {
    // Initialize a git repo
    const result = render(await GitUI());
    await waitForButton("Initialize");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });
    await screen.findByText("Branches");
    await screen.findByText("Initial commit");

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    // Make a test recipe

    result.rerender(<NewRecipeForm />);

    await userEvent.type(await screen.findByLabelText("Name"), "Test Recipe");
    await waitForButton("Submit");

    result.rerender(await GitUI());

    // The recipe we just made should show up in history
    expect(await screen.findByText("Add new recipe: test-recipe")).toBeTruthy();

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    await screen.findByText("Initial commit");
  });

  test("should be able to initialize a git repo and create a recipe", async function () {
    // Initialize a git repo
    const result = render(await GitUI());
    await waitForButton("Initialize");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });
    await screen.findByText("Branches");
    await screen.findByText("Initial commit");

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    // Make a test recipe

    result.rerender(<NewRecipeForm />);

    await userEvent.type(await screen.findByLabelText("Name"), "Test Recipe");
    await waitForButton("Submit");

    result.rerender(await GitUI());

    // The recipe we just made should show up in history
    expect(await screen.findByText("Add new recipe: test-recipe")).toBeTruthy();

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    await screen.findByText("Initial commit");
  });

  test("should be able to initialize a git repo with an email committer name", async function () {
    // Initialize a git repo
    const result = render(await GitUI());
    await waitForButton("Initialize");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });
    await screen.findByText("Branches");
    await screen.findByText("Initial commit");

    // Manually re-render because revalidatePath doesn't work in tests
    result.rerender(await GitUI());

    await userEvent.click(await screen.findByText("Initial commit"));
    expect(await screen.findByText(/Author: vitest@example.com/));
  });
});

describe("When signed out", () => {
  vi.mock("@/auth", () => ({
    auth() {
      return null;
    },
  }));

  test("should not be able to initialize a git repo", async function () {
    // Initialize a git repo
    const result = render(await GitUI());
    expect(
      await screen.findByText("Content directory is not tracked with Git."),
    ).toBeTruthy();
    await waitForButton("Initialize");

    // Manually re-render because revalidatePath doesn't work in tests
    await act(async () => {
      result.rerender(await GitUI());
    });

    expect(
      await screen.findByText("Content directory is not tracked with Git."),
    ).toBeTruthy();
    expect(screen.queryByText("Branches")).not.toBeTruthy();

    // Make sure git files have not been created
    expect(await readdir(testContentDirectory)).toEqual([]);
  });
});
