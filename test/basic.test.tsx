import React from "react";
import { render, screen } from "@testing-library/react";

import { expect, test } from "vitest";
import StyledMarkdown from "component-library/components/Markdown";

test("calls correct function on click", () => {
  render(
    <StyledMarkdown>{`Link to [youtube.com](https://www.youtube.com)`}</StyledMarkdown>,
  );

  screen.debug();
});
