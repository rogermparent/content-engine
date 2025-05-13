import React from "react";
import { render, screen, within } from "@testing-library/react";

import { test, expect } from "vitest";
import { RecipeView } from "recipe-website-common/components/View";
import userEvent from "@testing-library/user-event";

test("Can check off and reset ingredients", async () => {
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

  render(await RecipeView({ recipe: testRecipe, slug: "recipe-6" }));

  const saltRegex = /1 1\/2 tsp salt/;
  const waterRegex = /1 cup water/;

  expect(await screen.findByLabelText(saltRegex)).not.toBeChecked();

  await userEvent.click(await screen.findByLabelText(saltRegex));

  expect(await screen.findByLabelText(saltRegex)).toBeChecked();

  expect(await screen.findByLabelText(waterRegex)).not.toBeChecked();

  await userEvent.click(await screen.findByLabelText(waterRegex));

  expect(await screen.findByLabelText(waterRegex)).toBeChecked();

  await userEvent.click(
    await within(
      (await screen.findByText("Ingredients")).parentElement as HTMLElement,
    ).findByText("Reset"),
  );

  expect(await screen.findByLabelText(saltRegex)).not.toBeChecked();
  expect(await screen.findByLabelText(waterRegex)).not.toBeChecked();
});

test("Can check off and reset top-level instructions", async () => {
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
    ],
  };

  render(await RecipeView({ recipe: testRecipe, slug: "recipe-6" }));

  const steps = [/Sprinkle 1\/2 tsp salt in water/, /Boil water for a minute/];

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();

    await userEvent.click(await screen.findByLabelText(stepRegex));

    expect(await screen.findByLabelText(stepRegex)).toBeChecked();
  }

  await userEvent.click(
    await within(
      (await screen.findByText("Instructions")).parentElement as HTMLElement,
    ).findByText("Reset"),
  );

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();
  }
});

test("Can check off and reset instruction groups", async () => {
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
      {
        name: "Storage",
        instructions: [
          { text: "Let come to room temp" },
          { text: "Refrigerate indefinitely" },
        ],
      },
    ],
  };

  render(await RecipeView({ recipe: testRecipe, slug: "recipe-6" }));

  const steps = [
    /Sprinkle 1\/2 tsp salt in water/,
    /Boil water for a minute/,
    /Let come to room temp/,
    /Refrigerate indefinitely/,
  ];

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();

    await userEvent.click(await screen.findByLabelText(stepRegex));

    expect(await screen.findByLabelText(stepRegex)).toBeChecked();
  }

  await userEvent.click(
    await within(
      (await screen.findByText("Instructions")).parentElement as HTMLElement,
    ).findByText("Reset"),
  );

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();
  }
});
test("Can check off and reset instructions", async () => {
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

  render(await RecipeView({ recipe: testRecipe, slug: "recipe-6" }));

  const steps = [
    /Sprinkle 1\/2 tsp salt in water/,
    /Boil water for a minute/,
    /Let come to room temp/,
    /Refrigerate indefinitely/,
  ];

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();

    await userEvent.click(await screen.findByLabelText(stepRegex));

    expect(await screen.findByLabelText(stepRegex)).toBeChecked();
  }

  await userEvent.click(
    await within(
      (await screen.findByText("Instructions")).parentElement as HTMLElement,
    ).findByText("Reset"),
  );

  for (const stepRegex of steps) {
    expect(await screen.findByLabelText(stepRegex)).not.toBeChecked();
  }
});
