import { test, beforeEach } from "vitest";
import { emptyDir, ensureDir, readFile } from "fs-extra";
import { getContentDirectory } from "./stub_content_directory";
import { resolve } from "path";
import { fdir } from "fdir";

const testContentDirectory = getContentDirectory();
process.env.CONTENT_DIRECTORY = testContentDirectory;

beforeEach(async () => {
  await ensureDir(testContentDirectory);
  await emptyDir(testContentDirectory);
});

import { auth } from "./stub_auth";
import { createRecipe, updateRecipe } from "recipe-editor/controller/actions";
import readIndex from "recipe-website-common/controller/data/readIndex";

// Create a crawler function so we can easily test the contents of the test content dir
const crawler = new fdir()
  .withRelativePaths()
  .normalize()
  .withPathSeparator("/");

async function getTestContentFiles() {
  return (await crawler.crawl(testContentDirectory).withPromise()).sort();
}

describe("When authenticated", () => {
  beforeEach(() => {
    auth.mockImplementation((async () => ({
      user: { email: "vitest@example.com", name: "Vitest Tester" },
    })) as typeof auth);
  });

  test("should be able to create a recipe with an image", async function () {
    // Grab a test image from the e2e fixtures
    const testImageFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "images",
            "recipe-6-test-image.png",
          ),
        ),
      ],
      "test-image.png",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    await createRecipe(null, createRecipeFormData);

    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "ingredients": undefined,
          "name": "Test Recipe",
          "slug": "test-recipe",
        },
      ]
    `);

    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
          "uploads/recipe/test-recipe/uploads/test-image.png",
        ]
      `);

    const recipeData = JSON.parse(
      String(
        await readFile(
          resolve(
            testContentDirectory,
            "recipes",
            "data",
            "test-recipe",
            "recipe.json",
          ),
        ),
      ),
    );

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
      }
    `);
  });

  test("should be able to create a recipe and move it", async function () {
    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    await createRecipe(null, createRecipeFormData);

    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1750107600000,
          "image": undefined,
          "ingredients": undefined,
          "name": "Test Recipe",
          "slug": "test-recipe",
        },
      ]
    `);
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `);

    const recipeData = JSON.parse(
      String(
        await readFile(
          resolve(
            testContentDirectory,
            "recipes",
            "data",
            "test-recipe",
            "recipe.json",
          ),
        ),
      ),
    );

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Test Recipe",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");

    await updateRecipe(
      recipeData.date,
      "test-recipe",
      null,
      updateRecipeFormData,
    );

    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1750107600000,
          "image": undefined,
          "ingredients": undefined,
          "name": "Edited Recipe",
          "slug": "edited-recipe",
        },
      ]
    `);
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
      [
        "recipes/data/edited-recipe/recipe.json",
        "recipes/index/data.mdb",
        "recipes/index/lock.mdb",
      ]
    `);
  });

  test("should be able to create a recipe with an image and move it", async function () {
    // Grab a test image from the e2e fixtures
    const testImageFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "images",
            "recipe-6-test-image.png",
          ),
        ),
      ],
      "test-image.png",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    await createRecipe(null, createRecipeFormData);

    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "ingredients": undefined,
          "name": "Test Recipe",
          "slug": "test-recipe",
        },
      ]
    `);
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
          "uploads/recipe/test-recipe/uploads/test-image.png",
        ]
      `);

    const recipeData = JSON.parse(
      String(
        await readFile(
          resolve(
            testContentDirectory,
            "recipes",
            "data",
            "test-recipe",
            "recipe.json",
          ),
        ),
      ),
    );

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");

    await updateRecipe(
      recipeData.date,
      "test-recipe",
      null,
      updateRecipeFormData,
    );

    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "ingredients": undefined,
          "name": "Edited Recipe",
          "slug": "edited-recipe",
        },
      ]
    `);

    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
      [
        "recipes/data/edited-recipe/recipe.json",
        "recipes/index/data.mdb",
        "recipes/index/lock.mdb",
        "uploads/recipe/edited-recipe/uploads/test-image.png",
      ]
    `);
  });
});
