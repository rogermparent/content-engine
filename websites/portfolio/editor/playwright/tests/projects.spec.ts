import type { Page } from "@playwright/test";
import { test, expect } from "../support/test";
import {
  fillSignInForm,
  fillMarkdownField,
  markdownEditorReady,
} from "../support/helpers";

/*
 * The project form's coverage.
 *
 * Worth stating what this is guarding, because the failure it replaces was
 * silent: the write path already accepted summary, tags, role, client, status,
 * featured and links — only the *UI* was missing, so those fields round-tripped
 * perfectly in code and were simply uneditable. Nothing failed; the editor just
 * could not express most of a project.
 */

/**
 * Open a project form and wait for it to be interactive.
 *
 * The gate is not optional. The fields are controlled, so a `fill()` that lands
 * before the island hydrates writes a DOM value that React then overwrites with
 * the (empty) default — which surfaces as a server-side "Name is required" on a
 * form the test can see it typed into. Recipe's new-recipe spec gates on the
 * same signal for the same reason; `markdownEditorReady` waits on Lexical's own
 * `data-lexical-editor` marker, which is set in the hydration commit that also
 * attaches the form's handlers.
 */
async function openProjectForm(page: Page): Promise<void> {
  await markdownEditorReady(page, "content");
}

test.describe("Project Editor", () => {
  test.beforeEach(async ({ page, resetData }) => {
    await resetData();
    await page.goto("/projects");
    await fillSignInForm(page);
  });

  test("creates a project with the full field set", async ({ page }) => {
    await expect(page.getByText("There are no projects yet.")).toBeVisible();
    await page.getByRole("link", { name: "New Project", exact: true }).click();
    await openProjectForm(page);

    await page.getByLabel("Name").fill("Field Guide");
    await page.getByLabel("Summary").fill("A short line about the work.");
    await fillMarkdownField(page, "content", "## Overview\n\nThe case study.");
    await page.getByLabel("Role").fill("Design & build");
    await page.getByLabel("Client").fill("Self");
    await page.getByLabel("Status").selectOption("shipped");
    await page.getByLabel("Featured").check();

    const tagInput = page.getByLabel("Add a tag");
    await tagInput.fill("typography");
    await tagInput.press("Enter");
    await tagInput.fill("print");
    await tagInput.press("Enter");
    await expect(
      page.getByRole("button", { name: "Remove tag typography" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Append link", exact: true })
      .click();
    await page.getByLabel("Label").fill("Source");
    await page.getByLabel("URL").fill("https://example.com/source");

    await page.getByRole("button", { name: "Submit", exact: true }).click();

    // Redirects to the case study, which proves the record was written.
    await expect(
      page.getByRole("heading", { name: "Field Guide", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("The case study.")).toBeVisible();

    // And the index — which reads LMDB, not the files — sees it too.
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Field Guide/ }).first(),
    ).toBeVisible();
  });

  test("round-trips every field back into the edit form", async ({ page }) => {
    await page.getByRole("link", { name: "New Project", exact: true }).click();
    await openProjectForm(page);

    await page.getByLabel("Name").fill("Round Trip");
    await page.getByLabel("Summary").fill("Summary text");
    await page.getByLabel("Role").fill("Lead engineer");
    await page.getByLabel("Status").selectOption("wip");
    const tagInput = page.getByLabel("Add a tag");
    await tagInput.fill("systems");
    await tagInput.press("Enter");
    await page
      .getByRole("button", { name: "Append link", exact: true })
      .click();
    await page.getByLabel("Label").fill("Demo");
    await page.getByLabel("URL").fill("https://example.com/demo");
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Round Trip", level: 1 }),
    ).toBeVisible();

    await page.goto("/projects/edit/round-trip");
    await openProjectForm(page);
    await expect(page.getByLabel("Name")).toHaveValue("Round Trip");
    await expect(page.getByLabel("Summary")).toHaveValue("Summary text");
    await expect(page.getByLabel("Role")).toHaveValue("Lead engineer");
    await expect(page.getByLabel("Status")).toHaveValue("wip");
    await expect(page.getByLabel("Label")).toHaveValue("Demo");
    await expect(page.getByLabel("URL")).toHaveValue(
      "https://example.com/demo",
    );
    await expect(
      page.getByRole("button", { name: "Remove tag systems" }),
    ).toBeVisible();
  });

  test("creates a project with no status chosen", async ({ page }) => {
    // Status is optional, and the "none" option submits "". `z.enum().optional()`
    // accepts `undefined`, not `""`, so without the schema's blank-as-absent
    // decode this failed with `Invalid option: expected one of "shipped"|…` —
    // i.e. an optional field that could not be left unset.
    await page.getByRole("link", { name: "New Project", exact: true }).click();
    await openProjectForm(page);

    await page.getByLabel("Name").fill("No Status");
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "No Status", level: 1 }),
    ).toBeVisible();
  });

  test("a validation error preserves what was typed", async ({ page }) => {
    // The regression this pins: `useForm` reads its defaults at mount, so
    // without the echoed `formData` *and* the remount key, a refused submission
    // re-rendered the form with its original defaults — throwing away the edit
    // it was complaining about.
    await page.getByRole("link", { name: "New Project", exact: true }).click();
    await openProjectForm(page);

    await page.getByLabel("Name").fill("Nearly Valid");
    await page.getByLabel("Summary").fill("Worth keeping.");
    await page
      .getByRole("button", { name: "Append link", exact: true })
      .click();
    await page.getByLabel("Label").fill("Broken");
    // Not a URL, so the server refuses the whole submission.
    await page.getByLabel("URL").fill("not-a-url");

    await page.getByRole("button", { name: "Submit", exact: true }).click();

    // Still on the form, and everything typed survived the round trip.
    await expect(page.getByLabel("Name")).toHaveValue("Nearly Valid");
    await expect(page.getByLabel("Summary")).toHaveValue("Worth keeping.");
    await expect(page.getByLabel("Label")).toHaveValue("Broken");
    await expect(page.getByLabel("URL")).toHaveValue("not-a-url");
  });

  test("removing every link persists as an empty list", async ({ page }) => {
    // The empty-repeatable sentinel. With no rows the form emits no
    // `links[...]` key at all, so without the hidden input "the user removed
    // every link" would be indistinguishable from "links were never here".
    await page.getByRole("link", { name: "New Project", exact: true }).click();
    await openProjectForm(page);

    await page.getByLabel("Name").fill("Linkless");
    await page
      .getByRole("button", { name: "Append link", exact: true })
      .click();
    await page.getByLabel("Label").fill("Temp");
    await page.getByLabel("URL").fill("https://example.com/temp");
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Linkless", level: 1 }),
    ).toBeVisible();

    await page.goto("/projects/edit/linkless");
    await openProjectForm(page);
    await expect(page.getByLabel("Label")).toHaveValue("Temp");
    await page
      .getByRole("button", { name: "Remove link", exact: true })
      .click();
    await expect(page.getByLabel("Label")).toHaveCount(0);
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Linkless", level: 1 }),
    ).toBeVisible();
    await page.goto("/projects/edit/linkless");
    await openProjectForm(page);
    await expect(page.getByLabel("Label")).toHaveCount(0);
  });
});
