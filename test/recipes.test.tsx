import { test, beforeEach, vi } from "vitest";
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
import {
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "recipe-editor/controller/actions";
import readIndex from "recipe-website-common/controller/data/readIndex";
import getRecipeBySlug from "recipe-website-common/controller/data/read";

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
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
        {
          "message": "Recipe creation successful!",
        }
      `);

    // Index should show created recipe
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

    const recipeData = await getRecipeBySlug("test-recipe");

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

    // Directly call the create recipe action and check its result state (using the form doesn't work when trying to write files)
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

    // Index should show created recipe
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

    // Filesystem should show
    expect(await getTestContentFiles()).toMatchInlineSnapshot(
      `
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `,
    );

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Test Recipe",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Edited Recipe",
      }
    `);

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

  test("should be able to create a recipe with an image and move it by name", async function () {
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
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

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

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Edited Recipe",
      }
    `);

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

  test("should be able to create a recipe with an image and move it by name and date", async function () {
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
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("date", "2025-07-17T21:00:00.000");
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1752786000000,
        "image": "test-image.png",
        "name": "Edited Recipe",
      }
    `);
    expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1752786000000,
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

  test("should be able to create a recipe with an image and video and move it by name", async function () {
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

    const testVideoFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "videos",
            "sample-video.mp4",
          ),
        ),
      ],
      "test-video.mp4",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);
    createRecipeFormData.set("video", testVideoFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
        "video": "test-video.mp4",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Edited Recipe",
        "video": "test-video.mp4",
      }
    `);

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
        "uploads/recipe/edited-recipe/uploads/test-video.mp4",
      ]
    `);
  });

  test("should remove old files when clearImage and clearVideo are used", async function () {
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

    const testVideoFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "videos",
            "sample-video.mp4",
          ),
        ),
      ],
      "test-video.mp4",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);
    createRecipeFormData.set("video", testVideoFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
        "video": "test-video.mp4",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Test Recipe");
    updateRecipeFormData.set("clearImage", "checked");
    updateRecipeFormData.set("clearVideo", "checked");

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("test-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Test Recipe",
      }
    `);

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

    // Old files should be deleted
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
      [
        "recipes/data/test-recipe/recipe.json",
        "recipes/index/data.mdb",
        "recipes/index/lock.mdb",
      ]
    `);
  });

  test("should remove old files when moving while clearImage and clearVideo are used", async function () {
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

    const testVideoFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "videos",
            "sample-video.mp4",
          ),
        ),
      ],
      "test-video.mp4",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);
    createRecipeFormData.set("video", testVideoFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
        "video": "test-video.mp4",
      }
    `);

    const updateRecipeFormData = new FormData();
    updateRecipeFormData.set("name", "Edited Recipe");
    updateRecipeFormData.set("slug", "edited-recipe");
    updateRecipeFormData.set("clearImage", "checked");
    updateRecipeFormData.set("clearVideo", "checked");

    expect(
      await updateRecipe(
        recipeData.date,
        "test-recipe",
        null,
        updateRecipeFormData,
      ),
    ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

    expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Edited Recipe",
      }
    `);

    // Index should show edited recipe
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

    // Old files should be deleted
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
      [
        "recipes/data/edited-recipe/recipe.json",
        "recipes/index/data.mdb",
        "recipes/index/lock.mdb",
      ]
    `);
  });
  test("should remove old files when deleting a recipe", async function () {
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

    const testVideoFile = new File(
      [
        await readFile(
          resolve(
            "websites",
            "recipe-website",
            "editor",
            "cypress",
            "fixtures",
            "videos",
            "sample-video.mp4",
          ),
        ),
      ],
      "test-video.mp4",
    );

    const createRecipeFormData = new FormData();

    createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
    createRecipeFormData.set("name", "Test Recipe");
    createRecipeFormData.set("image", testImageFile);
    createRecipeFormData.set("video", testVideoFile);

    // Directly call the create recipe action (using the form doesn't work when trying to write files)
    expect(await createRecipe(null, createRecipeFormData))
      .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

    const recipeData = await getRecipeBySlug("test-recipe");

    expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
        "video": "test-video.mp4",
      }
    `);

    await deleteRecipe(recipeData.date, "test-recipe");

    // Index should not show any recipes
    expect((await readIndex()).recipes).toMatchInlineSnapshot(`[]`);

    // Old files should be deleted
    expect(await getTestContentFiles()).toMatchInlineSnapshot(`
      [
        "recipes/index/data.mdb",
        "recipes/index/lock.mdb",
      ]
    `);
  });

  describe("When counting getContentDirectory calls", () => {
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
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

      // Index should show created recipe
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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
      }
    `);
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should be able to create a recipe and move it", async function () {
      const createRecipeFormData = new FormData();

      createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
      createRecipeFormData.set("name", "Test Recipe");

      // Directly call the create recipe action and check its result state (using the form doesn't work when trying to write files)
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

      // Index should show created recipe
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

      // Filesystem should show
      expect(await getTestContentFiles()).toMatchInlineSnapshot(
        `
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `,
      );

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Test Recipe",
      }
    `);

      const updateRecipeFormData = new FormData();
      updateRecipeFormData.set("name", "Edited Recipe");
      updateRecipeFormData.set("slug", "edited-recipe");

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

      expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "name": "Edited Recipe",
      }
    `);

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
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should be able to create a recipe with an image and move it by name", async function () {
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
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

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

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

      expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Edited Recipe",
      }
    `);

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
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should be able to create a recipe with an image and move it by name and date", async function () {
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
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
      }
    `);

      const updateRecipeFormData = new FormData();
      updateRecipeFormData.set("date", "2025-07-17T21:00:00.000");
      updateRecipeFormData.set("name", "Edited Recipe");
      updateRecipeFormData.set("slug", "edited-recipe");

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
      {
        "message": "Recipe update successful!",
      }
    `);

      expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
      {
        "date": 1752786000000,
        "image": "test-image.png",
        "name": "Edited Recipe",
      }
    `);
      expect((await readIndex()).recipes).toMatchInlineSnapshot(`
      [
        {
          "date": 1752786000000,
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
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should be able to create a recipe with an image and video and move it by name", async function () {
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

      const testVideoFile = new File(
        [
          await readFile(
            resolve(
              "websites",
              "recipe-website",
              "editor",
              "cypress",
              "fixtures",
              "videos",
              "sample-video.mp4",
            ),
          ),
        ],
        "test-video.mp4",
      );

      const createRecipeFormData = new FormData();

      createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
      createRecipeFormData.set("name", "Test Recipe");
      createRecipeFormData.set("image", testImageFile);
      createRecipeFormData.set("video", testVideoFile);

      // Directly call the create recipe action (using the form doesn't work when trying to write files)
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
      {
        "message": "Recipe creation successful!",
      }
    `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
      {
        "date": 1750107600000,
        "image": "test-image.png",
        "name": "Test Recipe",
        "video": "test-video.mp4",
      }
    `);

      const updateRecipeFormData = new FormData();
      updateRecipeFormData.set("name", "Edited Recipe");
      updateRecipeFormData.set("slug", "edited-recipe");

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
        {
          "message": "Recipe update successful!",
        }
      `);

      expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "name": "Edited Recipe",
          "video": "test-video.mp4",
        }
      `);

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
          "uploads/recipe/edited-recipe/uploads/test-video.mp4",
        ]
      `);
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should remove old files when clearImage and clearVideo are used", async function () {
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

      const testVideoFile = new File(
        [
          await readFile(
            resolve(
              "websites",
              "recipe-website",
              "editor",
              "cypress",
              "fixtures",
              "videos",
              "sample-video.mp4",
            ),
          ),
        ],
        "test-video.mp4",
      );

      const createRecipeFormData = new FormData();

      createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
      createRecipeFormData.set("name", "Test Recipe");
      createRecipeFormData.set("image", testImageFile);
      createRecipeFormData.set("video", testVideoFile);

      // Directly call the create recipe action (using the form doesn't work when trying to write files)
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
          {
            "message": "Recipe creation successful!",
          }
        `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "name": "Test Recipe",
          "video": "test-video.mp4",
        }
      `);

      const updateRecipeFormData = new FormData();
      updateRecipeFormData.set("name", "Test Recipe");
      updateRecipeFormData.set("clearImage", "checked");
      updateRecipeFormData.set("clearVideo", "checked");

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
        {
          "message": "Recipe update successful!",
        }
      `);

      expect(await getRecipeBySlug("test-recipe")).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "name": "Test Recipe",
        }
      `);

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

      // Old files should be deleted
      expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/data/test-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `);
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });

    test("should remove old files when moving while clearImage and clearVideo are used", async function () {
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

      const testVideoFile = new File(
        [
          await readFile(
            resolve(
              "websites",
              "recipe-website",
              "editor",
              "cypress",
              "fixtures",
              "videos",
              "sample-video.mp4",
            ),
          ),
        ],
        "test-video.mp4",
      );

      const createRecipeFormData = new FormData();

      createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
      createRecipeFormData.set("name", "Test Recipe");
      createRecipeFormData.set("image", testImageFile);
      createRecipeFormData.set("video", testVideoFile);

      // Directly call the create recipe action (using the form doesn't work when trying to write files)
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
          {
            "message": "Recipe creation successful!",
          }
        `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "name": "Test Recipe",
          "video": "test-video.mp4",
        }
      `);

      const updateRecipeFormData = new FormData();
      updateRecipeFormData.set("name", "Edited Recipe");
      updateRecipeFormData.set("slug", "edited-recipe");
      updateRecipeFormData.set("clearImage", "checked");
      updateRecipeFormData.set("clearVideo", "checked");

      expect(
        await updateRecipe(
          recipeData.date,
          "test-recipe",
          null,
          updateRecipeFormData,
        ),
      ).toMatchInlineSnapshot(`
        {
          "message": "Recipe update successful!",
        }
      `);

      expect(await getRecipeBySlug("edited-recipe")).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "name": "Edited Recipe",
        }
      `);

      // Index should show edited recipe
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

      // Old files should be deleted
      expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/data/edited-recipe/recipe.json",
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `);
      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });
    test("should remove old files when deleting a recipe", async function () {
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

      const testVideoFile = new File(
        [
          await readFile(
            resolve(
              "websites",
              "recipe-website",
              "editor",
              "cypress",
              "fixtures",
              "videos",
              "sample-video.mp4",
            ),
          ),
        ],
        "test-video.mp4",
      );

      const createRecipeFormData = new FormData();

      createRecipeFormData.set("date", "2025-06-16T21:00:00.000");
      createRecipeFormData.set("name", "Test Recipe");
      createRecipeFormData.set("image", testImageFile);
      createRecipeFormData.set("video", testVideoFile);

      // Directly call the create recipe action (using the form doesn't work when trying to write files)
      expect(await createRecipe(null, createRecipeFormData))
        .toMatchInlineSnapshot(`
          {
            "message": "Recipe creation successful!",
          }
        `);

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

      const recipeData = await getRecipeBySlug("test-recipe");

      expect(recipeData).toMatchInlineSnapshot(`
        {
          "date": 1750107600000,
          "image": "test-image.png",
          "name": "Test Recipe",
          "video": "test-video.mp4",
        }
      `);

      await deleteRecipe(recipeData.date, "test-recipe");

      // Index should not show any recipes
      expect((await readIndex()).recipes).toMatchInlineSnapshot(`[]`);

      // Old files should be deleted
      expect(await getTestContentFiles()).toMatchInlineSnapshot(`
        [
          "recipes/index/data.mdb",
          "recipes/index/lock.mdb",
        ]
      `);

      expect(vi.mocked(getContentDirectory)).toBeCalledTimes(1);
    });
  });
});
