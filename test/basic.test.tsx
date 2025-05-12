import React from "react";
import { render, screen } from "@testing-library/react";

import { test } from "vitest";
import StyledMarkdown from "component-library/components/Markdown";

test("calls correct function on click", () => {
  render(
    <StyledMarkdown>{`Link to [*YouTube*](https://www.youtube.com)`}</StyledMarkdown>,
  );

  screen.debug();
});
