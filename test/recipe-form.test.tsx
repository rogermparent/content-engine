import React from "react";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { test, expect } from "vitest";
import RecipeFields from "recipe-website-common/components/Form/index";
import { GitUI } from "recipe-editor/src/app/(editor)/git/page";

test('should be able to paste ingredients with nested "per" or "each" parentheses without multiplying', async function () {
  render(await GitUI({}));
  screen.debug();
});
