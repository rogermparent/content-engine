import { describe, expect, it } from "vitest";

import { flattenMarkdown } from "recipe-website-common/controller/buildIndexValue";

/*
 * F23. `flattenMarkdown` used to concatenate a compiled node only when it was a
 * string, or when its `props.children` was a *string*. Real prose does not
 * compile to that: two paragraphs, a link, or a list all arrive with array
 * children, contributed nothing, and flattened to `""`.
 *
 * Two consumers were reading that empty string. The content index's
 * `description` — which drives the ⌘K subtitle, the search-card snippet,
 * FlexSearch's `description` seat and the `description:` filter — and the
 * JSON-LD `HowToStep.text` for every recipe instruction.
 *
 * The constraint that shapes the fix is `Multiplyable`: `parseIngredients`
 * wraps every number in a pasted ingredient in one, and it is self-closing, so
 * a rewrite that recursed into children instead of reading `props.baseNumber`
 * would lose every quantity while looking correct on prose.
 */
describe("flattenMarkdown", () => {
  it("returns a plain sentence unchanged", () => {
    expect(flattenMarkdown("A simple description.")).toBe(
      "A simple description.",
    );
  });

  it("keeps both paragraphs of a two-paragraph description", () => {
    const flattened = flattenMarkdown(
      "The first paragraph introduces it.\n\nThe second names the technique.",
    );
    expect(flattened).toBe(
      "The first paragraph introduces it. The second names the technique.",
    );
  });

  it("keeps the text of an inline link, and the prose around it", () => {
    expect(
      flattenMarkdown(
        "Adapted from [an older recipe](https://example.com/older) of ours.",
      ),
    ).toBe("Adapted from an older recipe of ours.");
  });

  it("keeps every item of a list, separated", () => {
    expect(flattenMarkdown("- first\n- second\n- third")).toBe(
      "first second third",
    );
  });

  it("keeps emphasis against its neighbouring punctuation", () => {
    // The inline case the block separator must not touch.
    expect(flattenMarkdown("This one is **important**.")).toBe(
      "This one is important.",
    );
  });

  it("substitutes a Multiplyable's base number rather than dropping it", () => {
    // What `parseIngredients` produces for "2 cups flour".
    expect(flattenMarkdown('<Multiplyable baseNumber="2" /> cups flour')).toBe(
      "2 cups flour",
    );
  });

  it("keeps quantities inside prose that also has structure", () => {
    expect(
      flattenMarkdown(
        '- <Multiplyable baseNumber="1/2" /> cup sugar\n- <Multiplyable baseNumber="3" /> eggs',
      ),
    ).toBe("1/2 cup sugar 3 eggs");
  });

  it("is empty for empty input", () => {
    expect(flattenMarkdown("")).toBe("");
  });
});
