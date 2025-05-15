import React from "react";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, expect } from "vitest";
import RecipeFields from "recipe-website-common/components/Form/index";

const testRecipe = {
  name: "Recipe 6",
  description: "",
  image: "recipe-6-test-image.png",
  date: 1701998172622,
  ingredients: [
    { ingredient: '<Multiplyable baseNumber="1 1/2" /> tsp salt' },
    { ingredient: '<Multiplyable baseNumber="1" /> cup water' },
  ],
  instructions: [
    { text: 'Sprinkle <Multiplyable baseNumber="1/2" /> tsp salt in water' },
    { text: "Boil water for a minute" },
    {
      name: "Storage",
      instructions: [
        { text: "Let come to room temp" },
        { text: "Refrigerate indefinitely" },
      ],
    },
  ],
};

test("Can check off and reset ingredients", async () => {
  render(<RecipeFields />);
  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    "asdf 123",
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Import Ingredients" }),
  );

  screen.debug();
});

// Create tests focusing on individual edge cases
test("should be able to paste ingredients with different indentation levels", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1 cup flour
  - 1 cup water
  - 2 tsp sugar
   - 2 tsp baking powder
 - 1 tsp salt
    - 1 tsp pepper
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup flour`);
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup water`);
  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp sugar`);
  expect(
    container.querySelector('[name="ingredients[3].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp baking powder`);
  expect(
    container.querySelector('[name="ingredients[4].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp salt`);
  expect(
    container.querySelector('[name="ingredients[5].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp pepper`);
});

test("should be able to paste ingredients with trailing whitespace", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1 cup flour
- 1 cup water  
- 2 tsp sugar	
   - 2 tsp baking powder	 
- 1 tsp salt			 
    - 1 tsp pepper                         
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup flour`);
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup water`);
  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp sugar`);
  expect(
    container.querySelector('[name="ingredients[3].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp baking powder`);
  expect(
    container.querySelector('[name="ingredients[4].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp salt`);
  expect(
    container.querySelector('[name="ingredients[5].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp pepper`);
});

test("should be able to paste ingredients with multiple multiplyable amounts", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1/2 large onion (100g)
- 400g or 1 1/2 cups chicken broth
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="1/2" /> large onion (<Multiplyable baseNumber="100" />g)`,
  );
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="400" />g or <Multiplyable baseNumber="1 1/2" /> cups chicken broth`,
  );
});

test("should be able to paste ingredients with normal fractions", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1/2 onion
- 1 1/2 cups chicken broth
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1/2" /> onion`);
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1 1/2" /> cups chicken broth`);
});

test("should be able to paste ingredients with vulgar fractions", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
¼ One Quarter

½ One Half

¾ Three Quarters

⅐ One Seventh

⅑ One Ninth

⅒ One Tenth

⅓ One Third

⅔ Two Thirds

⅕ One Fifth

⅖ Two Fifths

⅗ Three Fifths

⅘ Four Fifths

⅙ One Sixth

⅚ Five Sixths

⅛ One Eighth

⅜ Three Eighths

⅝ Five Eighths

⅞ Seven Eighths

⅟7 Fraction Numerator One

↉ Zero Thirds
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  /*

  */

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1/2" /> onion`);
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="1 2/3" /> cups cooked Japanese short-grain rice`,
  );
  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1 1/2" /> cups chicken broth`);
});

test("should be able to paste ingredients with different bullet styles", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
* 1 cup flour
- 1 cup water
• 2 tsp sugar
▪ 2 tsp baking powder
-- 1 tsp salt
- - 1 tsp pepper
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup flour`);
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup water`);
  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp sugar`);
  expect(
    container.querySelector('[name="ingredients[3].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp baking powder`);
  expect(
    container.querySelector('[name="ingredients[4].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp salt`);
  expect(
    container.querySelector('[name="ingredients[5].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> tsp pepper`);
});

test("should be able to paste a list of ingredients with many overlapping edge cases", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
 * 1 cup water ((for the dashi packet))
 - 1 dashi packet  
 • 2 tsp sugar
 ▪ 2 Tbsp mirin
* 2 Tbsp soy sauce
- ½ onion ((4 oz 113 g))
• 1 green onion/scallion ((for garnish))
▪ 3 large eggs
       2 tonkatsu
 - - 3⅔ cups cooked Japanese short-grain rice
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  // Verify all ingredients
  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="1" /> cup water ((for the dashi packet))`,
  );
  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> dashi packet`);
  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tsp sugar`);
  expect(
    container.querySelector('[name="ingredients[3].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> Tbsp mirin`);
  expect(
    container.querySelector('[name="ingredients[4].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> Tbsp soy sauce`);
  expect(
    container.querySelector('[name="ingredients[5].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="1/2" /> onion ((<Multiplyable baseNumber="4" /> oz <Multiplyable baseNumber="113" /> g))`,
  );
  expect(
    container.querySelector('[name="ingredients[6].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="1" /> green onion/scallion ((for garnish))`,
  );
  expect(
    container.querySelector('[name="ingredients[7].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="3" /> large eggs`);
  expect(
    container.querySelector('[name="ingredients[8].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="2" /> tonkatsu`);
  expect(
    container.querySelector('[name="ingredients[9].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="3 2/3" /> cups cooked Japanese short-grain rice`,
  );
});

test("should be able to paste ingredients with percentages without automatically multiplying", async function () {
  const { container } = render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
 * 1 cup 2% milk
 * 200g 100 % whole wheat flour
 * 400g bread flour (11.7% - 13.5 % protein)
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  // Verify first ingredient
  expect(
    container.querySelector('[name="ingredients[0].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="1" /> cup 2% milk`);

  expect(
    container.querySelector('[name="ingredients[1].ingredient"]'),
  ).toHaveValue(`<Multiplyable baseNumber="200" />g 100 % whole wheat flour`);

  expect(
    container.querySelector('[name="ingredients[2].ingredient"]'),
  ).toHaveValue(
    `<Multiplyable baseNumber="400" />g bread flour (11.7% - 13.5 % protein)`,
  );
});
