import React from "react";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, expect } from "vitest";
import RecipeFields from "recipe-website-common/components/Form/index";

test("should be able to paste ingredients with different indentation levels", async function () {
  render(<RecipeFields />);

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

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1" /> cup flour",
      "<Multiplyable baseNumber="1" /> cup water",
      "<Multiplyable baseNumber="2" /> tsp sugar",
      "<Multiplyable baseNumber="2" /> tsp baking powder",
      "<Multiplyable baseNumber="1" /> tsp salt",
      "<Multiplyable baseNumber="1" /> tsp pepper",
    ]
  `);
});

test("should be able to paste ingredients with trailing whitespace", async function () {
  render(<RecipeFields />);

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

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1" /> cup flour",
      "<Multiplyable baseNumber="1" /> cup water",
      "<Multiplyable baseNumber="2" /> tsp sugar",
      "<Multiplyable baseNumber="2" /> tsp baking powder",
      "<Multiplyable baseNumber="1" /> tsp salt",
      "<Multiplyable baseNumber="1" /> tsp pepper",
    ]
  `);
});

test("should be able to paste ingredients with multiple multiplyable amounts", async function () {
  render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1/2 large onion (100g)
- 400g or 1 1/2 cups chicken broth
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1/2" /> large onion (<Multiplyable baseNumber="100" />g)",
      "<Multiplyable baseNumber="400" />g or <Multiplyable baseNumber="1 1/2" /> cups chicken broth",
    ]
  `);
});

test("should be able to paste ingredients with normal fractions", async function () {
  render(<RecipeFields />);

  await userEvent.click(await screen.findByText("Paste Ingredients"));
  await userEvent.type(
    await screen.findByTitle("Ingredients Paste Area"),
    `
- 1/2 onion
- 1 1/2 cups chicken broth
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1/2" /> onion",
      "<Multiplyable baseNumber="1 1/2" /> cups chicken broth",
    ]
  `);
});

function getIngredientValues() {
  return within(
    screen.getByText("Ingredients", { selector: "label" })
      .parentElement as HTMLElement,
  )
    .getAllByRole("listitem")
    .map((e) => within(e).getByRole<HTMLInputElement>("textbox").value);
}

test("should be able to paste ingredients with vulgar and mixed fractions", async function () {
  render(<RecipeFields />);

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
⅟77 Fraction Numerator One
↉ Zero Thirds
5⁄33 Unicode Fraction Separator


1 and ¼ One Quarter Mixed with space and "and"
1 ¼ One Quarter Mixed with space
1¼ One Quarter Mixed
1½ One Half Mixed
1¾ Three Quarters Mixed
1⅐ One Seventh Mixed
1⅑ One Ninth Mixed
1⅒ One Tenth Mixed
1⅓ One Third Mixed
1⅔ Two Thirds Mixed
1⅕ One Fifth Mixed
1⅖ Two Fifths Mixed
1⅗ Three Fifths Mixed
1⅘ Four Fifths Mixed
1⅙ One Sixth Mixed
1⅚ Five Sixths Mixed
1⅛ One Eighth Mixed
1⅜ Three Eighths Mixed
1⅝ Five Eighths Mixed
1⅞ Seven Eighths Mixed
1⅟77 Fraction Numerator One Mixed
1↉ Zero Thirds Mixed
1 5⁄33 Unicode Fraction Separator Mixed
`,
  );

  await userEvent.click(await screen.findByText("Import Ingredients"));

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1/4" /> One Quarter",
      "<Multiplyable baseNumber="1/2" /> One Half",
      "<Multiplyable baseNumber="3/4" /> Three Quarters",
      "<Multiplyable baseNumber="1/7" /> One Seventh",
      "<Multiplyable baseNumber="1/9" /> One Ninth",
      "<Multiplyable baseNumber="1/10" /> One Tenth",
      "<Multiplyable baseNumber="1/3" /> One Third",
      "<Multiplyable baseNumber="2/3" /> Two Thirds",
      "<Multiplyable baseNumber="1/5" /> One Fifth",
      "<Multiplyable baseNumber="2/5" /> Two Fifths",
      "<Multiplyable baseNumber="3/5" /> Three Fifths",
      "<Multiplyable baseNumber="4/5" /> Four Fifths",
      "<Multiplyable baseNumber="1/6" /> One Sixth",
      "<Multiplyable baseNumber="5/6" /> Five Sixths",
      "<Multiplyable baseNumber="1/8" /> One Eighth",
      "<Multiplyable baseNumber="3/8" /> Three Eighths",
      "<Multiplyable baseNumber="5/8" /> Five Eighths",
      "<Multiplyable baseNumber="7/8" /> Seven Eighths",
      "<Multiplyable baseNumber="1/77" /> Fraction Numerator One",
      "<Multiplyable baseNumber="0/3" /> Zero Thirds",
      "<Multiplyable baseNumber="5/33" /> Unicode Fraction Separator",
      "<Multiplyable baseNumber="1 1/4" /> One Quarter Mixed with space and "and"",
      "<Multiplyable baseNumber="1 1/4" /> One Quarter Mixed with space",
      "<Multiplyable baseNumber="1 1/4" /> One Quarter Mixed",
      "<Multiplyable baseNumber="1 1/2" /> One Half Mixed",
      "<Multiplyable baseNumber="1 3/4" /> Three Quarters Mixed",
      "<Multiplyable baseNumber="1 1/7" /> One Seventh Mixed",
      "<Multiplyable baseNumber="1 1/9" /> One Ninth Mixed",
      "<Multiplyable baseNumber="1 1/10" /> One Tenth Mixed",
      "<Multiplyable baseNumber="1 1/3" /> One Third Mixed",
      "<Multiplyable baseNumber="1 2/3" /> Two Thirds Mixed",
      "<Multiplyable baseNumber="1 1/5" /> One Fifth Mixed",
      "<Multiplyable baseNumber="1 2/5" /> Two Fifths Mixed",
      "<Multiplyable baseNumber="1 3/5" /> Three Fifths Mixed",
      "<Multiplyable baseNumber="1 4/5" /> Four Fifths Mixed",
      "<Multiplyable baseNumber="1 1/6" /> One Sixth Mixed",
      "<Multiplyable baseNumber="1 5/6" /> Five Sixths Mixed",
      "<Multiplyable baseNumber="1 1/8" /> One Eighth Mixed",
      "<Multiplyable baseNumber="1 3/8" /> Three Eighths Mixed",
      "<Multiplyable baseNumber="1 5/8" /> Five Eighths Mixed",
      "<Multiplyable baseNumber="1 7/8" /> Seven Eighths Mixed",
      "<Multiplyable baseNumber="1 1/77" /> Fraction Numerator One Mixed",
      "<Multiplyable baseNumber="1 0/3" /> Zero Thirds Mixed",
      "<Multiplyable baseNumber="1 5/33" /> Unicode Fraction Separator Mixed",
    ]
  `);
});

test("should be able to paste ingredients with different bullet styles", async function () {
  render(<RecipeFields />);

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

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1" /> cup flour",
      "<Multiplyable baseNumber="1" /> cup water",
      "<Multiplyable baseNumber="2" /> tsp sugar",
      "<Multiplyable baseNumber="2" /> tsp baking powder",
      "<Multiplyable baseNumber="1" /> tsp salt",
      "<Multiplyable baseNumber="1" /> tsp pepper",
    ]
  `);
});

test("should be able to paste a list of ingredients with many overlapping edge cases", async function () {
  render(<RecipeFields />);

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

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1" /> cup water ((for the dashi packet))",
      "<Multiplyable baseNumber="1" /> dashi packet",
      "<Multiplyable baseNumber="2" /> tsp sugar",
      "<Multiplyable baseNumber="2" /> Tbsp mirin",
      "<Multiplyable baseNumber="2" /> Tbsp soy sauce",
      "<Multiplyable baseNumber="1/2" /> onion ((<Multiplyable baseNumber="4" /> oz <Multiplyable baseNumber="113" /> g))",
      "<Multiplyable baseNumber="1" /> green onion/scallion ((for garnish))",
      "<Multiplyable baseNumber="3" /> large eggs",
      "<Multiplyable baseNumber="2" /> tonkatsu",
      "<Multiplyable baseNumber="3 2/3" /> cups cooked Japanese short-grain rice",
    ]
  `);
});

test("should be able to paste ingredients with percentages without automatically multiplying", async function () {
  render(<RecipeFields />);

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

  expect(getIngredientValues()).toMatchInlineSnapshot(`
    [
      "<Multiplyable baseNumber="1" /> cup 2% milk",
      "<Multiplyable baseNumber="200" />g 100 % whole wheat flour",
      "<Multiplyable baseNumber="400" />g bread flour (11.7% - 13.5 % protein)",
    ]
  `);
});
