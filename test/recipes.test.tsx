import { render, screen, act, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, beforeEach } from "vitest";
import { GitUI } from "recipe-editor/src/app/(editor)/git/ui";
import NewRecipeForm from "recipe-editor/src/app/(recipes)/new-recipe/form";
import { emptyDir, ensureDir, open, readdir, readFile } from "fs-extra";
import { getContentDirectory } from "./stub_content_directory";
import { resolve } from "path";

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

  test("should be able to create a recipe with an image and move it", async function () {
    // Make a test recipe

    render(<NewRecipeForm />);

    await userEvent.type(await screen.findByLabelText("Name"), "Test Recipe");
    const fileContents = await readFile(
      resolve(
        "websites",
        "recipe-website",
        "editor",
        "cypress",
        "fixtures",
        "images",
        "recipe-6-test-image.png",
      ),
    );
    const file = new File([fileContents], "test-image.png");
    expect(await screen.findByLabelText("Image")).not.toHaveValue();
    await userEvent.upload(await screen.findByLabelText("Image"), file);
    console.log((await screen.findByLabelText("Image")).files[0].size);
    expect(await screen.findByLabelText("Image")).toHaveValue();
    await waitForButton("Submit");
    console.log(await readdir(resolve(testContentDirectory)));
  });
});
