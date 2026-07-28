import { describe, expect, it } from "vitest";
import {
  countFilterTerms,
  matchesFilter,
  parseQuery,
  positiveTagValues,
  removeFilterTerms,
  tagSearchHref,
  toggleTagTerm,
  type FilterableRecipe,
} from "recipe-website-common/components/SearchForm/queryLanguage";

/** A day at local midnight, matching how `before:`/`after:` parse their operand. */
const day = (year: number, month: number, date: number) =>
  new Date(year, month - 1, date).getTime();

const CAKE: FilterableRecipe = {
  name: "Chocolate Truffle Cake",
  date: day(2026, 3, 14),
  description: "A dense flourless chocolate cake with a molten center.",
  ingredients: ["200 g dark chocolate", "4 eggs", "1/2 cup butter"],
  tags: ["dessert", "chocolate"],
  prepTime: 20,
  cookTime: 40,
};

const BRULEE: FilterableRecipe = {
  name: "Crème Brûlée",
  date: day(2025, 1, 5),
  description: "A classic French custard baked slow and low.",
  ingredients: ["2 cups heavy cream", "6 egg yolks"],
  tags: ["dessert", "french"],
  totalTime: 180,
};

const SLAW: FilterableRecipe = {
  name: "Carrot Slaw",
  date: day(2026, 6, 1),
  description: "A bright raw salad dressed with rice vinegar.",
  ingredients: ["4 carrots", "1 tbsp grated ginger"],
  tags: ["salad", "quick"],
  prepTime: 10,
};

/** No tags, no times, no description — the filler shape the corpus is full of. */
const PANTRY: FilterableRecipe = {
  name: "Pantry Staple 1",
  date: day(2024, 2, 2),
};

const CORPUS = [CAKE, BRULEE, SLAW, PANTRY];

/** Names of the recipes a whole query keeps, ignoring the free-text half. */
function filtered(raw: string): string[] {
  const { filter } = parseQuery(raw);
  return CORPUS.filter((recipe) => matchesFilter(recipe, filter)).map(
    (recipe) => recipe.name,
  );
}

describe("parseQuery — free text vs typed terms", () => {
  it("passes bare words straight through as free text", () => {
    const parsed = parseQuery("chocolate cake");
    expect(parsed.text).toBe("chocolate cake");
    expect(parsed.filter).toBeUndefined();
    expect(parsed.hasAdvancedSyntax).toBe(false);
  });

  it("splits a mixed query into text and filter", () => {
    const parsed = parseQuery("chocolate cake tag:dessert");
    expect(parsed.text).toBe("chocolate cake");
    expect(parsed.filter).toEqual({
      type: "text",
      field: "tag",
      value: "dessert",
    });
    expect(parsed.hasAdvancedSyntax).toBe(true);
  });

  it("treats an unknown prefix as free text, colon and all", () => {
    const parsed = parseQuery("foo:bar");
    expect(parsed.text).toBe("foo:bar");
    expect(parsed.filter).toBeUndefined();
    expect(parsed.hasAdvancedSyntax).toBe(false);
  });

  it("keeps a quoted value with spaces in one term", () => {
    const parsed = parseQuery('tag:"slow cooker"');
    expect(parsed.text).toBe("");
    expect(parsed.filter).toEqual({
      type: "text",
      field: "tag",
      value: "slow cooker",
    });
  });

  it("keeps a quoted colon out of the operator position", () => {
    const parsed = parseQuery('"pasta: the sequel"');
    expect(parsed.text).toBe("pasta: the sequel");
    expect(parsed.filter).toBeUndefined();
  });

  it("folds accents off the operand", () => {
    expect(parseQuery("tag:Crème").filter).toEqual({
      type: "text",
      field: "tag",
      value: "creme",
    });
  });

  it("is case-insensitive about field names", () => {
    expect(parseQuery("TAG:dessert").filter).toEqual({
      type: "text",
      field: "tag",
      value: "dessert",
    });
  });
});

describe("parseQuery — booleans, grouping and negation", () => {
  it("implies AND between adjacent terms", () => {
    expect(parseQuery("tag:dessert tag:chocolate").filter).toEqual({
      type: "and",
      children: [
        { type: "text", field: "tag", value: "dessert" },
        { type: "text", field: "tag", value: "chocolate" },
      ],
    });
  });

  it("accepts an explicit AND for the same result", () => {
    expect(parseQuery("tag:dessert AND tag:chocolate").filter).toEqual(
      parseQuery("tag:dessert tag:chocolate").filter,
    );
  });

  it("binds OR looser than the implicit AND", () => {
    expect(parseQuery("tag:a tag:b OR tag:c").filter).toEqual({
      type: "or",
      children: [
        {
          type: "and",
          children: [
            { type: "text", field: "tag", value: "a" },
            { type: "text", field: "tag", value: "b" },
          ],
        },
        { type: "text", field: "tag", value: "c" },
      ],
    });
  });

  it("lets parentheses override that precedence", () => {
    expect(parseQuery("tag:a (tag:b OR tag:c)").filter).toEqual({
      type: "and",
      children: [
        { type: "text", field: "tag", value: "a" },
        {
          type: "or",
          children: [
            { type: "text", field: "tag", value: "b" },
            { type: "text", field: "tag", value: "c" },
          ],
        },
      ],
    });
  });

  it("reads -field:value and NOT field:value the same way", () => {
    const dash = parseQuery("-tag:baked").filter;
    expect(dash).toEqual({
      type: "not",
      child: { type: "text", field: "tag", value: "baked" },
    });
    expect(parseQuery("NOT tag:baked").filter).toEqual(dash);
  });

  it("turns a negated bare word into an all-fields exclusion, not free text", () => {
    const parsed = parseQuery("-chocolate");
    expect(parsed.text).toBe("");
    expect(parsed.filter).toEqual({
      type: "not",
      child: { type: "text", field: "any", value: "chocolate" },
    });
    expect(parsed.hasAdvancedSyntax).toBe(true);
  });

  it("does not mistake an interior hyphen for a negation", () => {
    expect(parseQuery("slow-cooked").text).toBe("slow-cooked");
  });

  it("parses the locked example shape", () => {
    const parsed = parseQuery(
      "tag:dessert (ingredient:molasses OR ingredient:chocolate)",
    );
    expect(parsed.text).toBe("");
    expect(parsed.filter).toEqual({
      type: "and",
      children: [
        { type: "text", field: "tag", value: "dessert" },
        {
          type: "or",
          children: [
            { type: "text", field: "ingredient", value: "molasses" },
            { type: "text", field: "ingredient", value: "chocolate" },
          ],
        },
      ],
    });
  });
});

describe("parseQuery — comparisons and dates", () => {
  it("parses each comparison operator", () => {
    expect(parseQuery("time:<30").filter).toEqual({
      type: "time",
      op: "<",
      minutes: 30,
    });
    expect(parseQuery("time:>=90").filter).toEqual({
      type: "time",
      op: ">=",
      minutes: 90,
    });
  });

  it("reads a bare duration as 'or less'", () => {
    expect(parseQuery("time:30").filter).toEqual({
      type: "time",
      op: "<=",
      minutes: 30,
    });
  });

  it("parses before:/after: as local midnight", () => {
    expect(parseQuery("before:2026-01-01").filter).toEqual({
      type: "date",
      field: "before",
      timestamp: day(2026, 1, 1),
    });
  });

  it("drops an unparseable operand rather than failing the query", () => {
    expect(parseQuery("cake time:soon").filter).toBeUndefined();
    expect(parseQuery("cake before:yesterday").text).toBe("cake");
    expect(parseQuery("before:2026-13-40").filter).toBeUndefined();
  });
});

describe("parseQuery — half-typed input never throws or blanks", () => {
  const fragments = [
    "",
    " ",
    "tag:",
    "tag: ",
    "time:<",
    "time:",
    "-",
    "(",
    ")",
    "((",
    "cake (",
    "(ingredient:beef OR",
    "tag:a OR",
    "OR tag:a",
    "AND",
    "NOT",
    'tag:"slow coo',
    "cake )stray(",
  ];

  it.each(fragments)("survives %j", (fragment) => {
    expect(() => parseQuery(fragment)).not.toThrow();
    const parsed = parseQuery(fragment);
    expect(() =>
      CORPUS.map((r) => matchesFilter(r, parsed.filter)),
    ).not.toThrow();
  });

  it("keeps the typed half of a dangling group working", () => {
    expect(filtered("(ingredient:beef OR")).toEqual([]);
    expect(filtered("(tag:dessert OR")).toEqual([
      "Chocolate Truffle Cake",
      "Crème Brûlée",
    ]);
  });

  it("drops a known field with no operand yet, rather than searching for it", () => {
    // `tag:` is a filter one keystroke from existing. Passing it on as free
    // text would search for the literal word "tag" and blank the page.
    const parsed = parseQuery("cake tag:");
    expect(parsed.filter).toBeUndefined();
    expect(parsed.text).toBe("cake");
    expect(parseQuery("time:<").text).toBe("");
    expect(parseQuery("time:<").filter).toBeUndefined();
  });

  it("still keeps an unknown prefix's whole atom as free text", () => {
    expect(parseQuery("cake foo:").text).toBe("cake foo:");
  });
});

describe("matchesFilter", () => {
  it("matches tags, prefix-first, accent-insensitively", () => {
    expect(filtered("tag:dessert")).toEqual([
      "Chocolate Truffle Cake",
      "Crème Brûlée",
    ]);
    expect(filtered("tag:fren")).toEqual(["Crème Brûlée"]);
  });

  it("matches ingredients within a line", () => {
    expect(filtered("ingredient:ginger")).toEqual(["Carrot Slaw"]);
    expect(filtered("ingredient:egg")).toEqual([
      "Chocolate Truffle Cake",
      "Crème Brûlée",
    ]);
  });

  it("matches name and description separately", () => {
    expect(filtered("name:carrot")).toEqual(["Carrot Slaw"]);
    // "chocolate" is in the cake's name *and* description; "flourless" only the
    // description — so description: is doing its own work here.
    expect(filtered("description:flourless")).toEqual([
      "Chocolate Truffle Cake",
    ]);
    expect(filtered("name:flourless")).toEqual([]);
  });

  it("combines terms with AND, OR and NOT", () => {
    expect(filtered("tag:dessert -tag:chocolate")).toEqual(["Crème Brûlée"]);
    expect(filtered("tag:salad OR tag:french")).toEqual([
      "Crème Brûlée",
      "Carrot Slaw",
    ]);
    expect(
      filtered("tag:dessert (ingredient:yolks OR ingredient:butter)"),
    ).toEqual(["Chocolate Truffle Cake", "Crème Brûlée"]);
  });

  it("compares durations, summing prep + cook when totalTime is absent", () => {
    // Cake is 20 + 40; Slaw is prep-only at 10; Brûlée carries totalTime: 180.
    expect(filtered("time:<30")).toEqual(["Carrot Slaw"]);
    expect(filtered("time:60")).toEqual([
      "Chocolate Truffle Cake",
      "Carrot Slaw",
    ]);
    expect(filtered("time:>120")).toEqual(["Crème Brûlée"]);
  });

  it("never counts a recipe with no timing data as fast", () => {
    expect(filtered("time:<10000")).not.toContain("Pantry Staple 1");
  });

  it("bounds by date, excluding the named day on both sides", () => {
    expect(filtered("before:2026-01-01")).toEqual([
      "Crème Brûlée",
      "Pantry Staple 1",
    ]);
    expect(filtered("after:2026-03-14")).toEqual(["Carrot Slaw"]);
    expect(filtered("after:2026-01-01 before:2026-06-01")).toEqual([
      "Chocolate Truffle Cake",
    ]);
  });

  it("excludes across every field for a negated bare word", () => {
    // "chocolate" is a tag, a name word and an ingredient — all have to go.
    expect(filtered("-chocolate")).toEqual([
      "Crème Brûlée",
      "Carrot Slaw",
      "Pantry Staple 1",
    ]);
  });

  it("drops an unconstrained OR operand instead of widening to everything", () => {
    // Free text can't be evaluated here — the engine already applied it — so the
    // tag is the only operand that can constrain the set.
    expect(filtered("(tag:salad OR chocolate)")).toEqual(["Carrot Slaw"]);
  });
});

describe("positiveTagValues / countFilterTerms", () => {
  it("reports the tags a query selects", () => {
    expect(positiveTagValues(parseQuery("tag:a tag:b").filter)).toEqual([
      "a",
      "b",
    ]);
    expect(positiveTagValues(parseQuery("(tag:a OR tag:b)").filter)).toEqual([
      "a",
      "b",
    ]);
  });

  it("does not count an excluded tag as selected", () => {
    expect(positiveTagValues(parseQuery("tag:a -tag:b").filter)).toEqual(["a"]);
  });

  it("counts leaf terms, not operators", () => {
    expect(countFilterTerms(parseQuery("cake").filter)).toBe(0);
    expect(
      countFilterTerms(parseQuery("tag:a (tag:b OR tag:c) -time:<30").filter),
    ).toBe(4);
  });
});

describe("query rewrites", () => {
  it("adds a tag term to an empty query", () => {
    expect(toggleTagTerm("", "dessert")).toBe("tag:dessert");
  });

  it("appends without disturbing existing free text", () => {
    expect(toggleTagTerm("chocolate cake", "dessert")).toBe(
      "chocolate cake tag:dessert",
    );
  });

  it("removes the term it previously added", () => {
    expect(toggleTagTerm("chocolate cake tag:dessert", "dessert")).toBe(
      "chocolate cake",
    );
  });

  it("round-trips", () => {
    const once = toggleTagTerm("cake", "dessert");
    expect(toggleTagTerm(once, "dessert")).toBe("cake");
  });

  it("quotes a tag with spaces, and finds it again", () => {
    const added = toggleTagTerm("", "slow cooker");
    expect(added).toBe('tag:"slow cooker"');
    expect(parseQuery(added).filter).toEqual({
      type: "text",
      field: "tag",
      value: "slow cooker",
    });
    expect(toggleTagTerm(added, "slow cooker")).toBe("");
  });

  it("matches exactly when toggling, unlike evaluation's prefix rule", () => {
    // `tag:b` *matches* "baked" when filtering, but the "baked" chip is not the
    // thing that put `tag:b` there, so toggling adds rather than removes.
    expect(toggleTagTerm("tag:b", "baked")).toBe("tag:b tag:baked");
  });

  it("takes the long-hand NOT away with the term it negated", () => {
    expect(removeFilterTerms("cake NOT tag:baked", "tag")).toBe("cake");
    expect(removeFilterTerms("cake -tag:baked", "tag")).toBe("cake");
  });

  it("clears one field and leaves the rest of the query alone", () => {
    expect(removeFilterTerms("chocolate tag:a time:<30 tag:b", "tag")).toBe(
      "chocolate time:<30",
    );
  });

  it("clears every typed term when no field is named", () => {
    expect(removeFilterTerms("chocolate tag:a time:<30")).toBe("chocolate");
  });

  it("tidies the parentheses and operators a removal orphans", () => {
    expect(removeFilterTerms("cake (tag:a OR tag:b)", "tag")).toBe("cake");
    expect(removeFilterTerms("(tag:a OR tag:b) time:<30", "tag")).toBe(
      "time:<30",
    );
  });

  it("is a no-op on a query with nothing to remove", () => {
    expect(removeFilterTerms("chocolate cake", "tag")).toBe("chocolate cake");
  });
});

describe("tagSearchHref", () => {
  it("writes a readable q= deep link", () => {
    expect(tagSearchHref("dessert")).toBe("/search?q=tag:dessert");
  });

  it("quotes and encodes a tag with spaces", () => {
    expect(tagSearchHref("slow cooker")).toBe(
      "/search?q=tag:%22slow%20cooker%22",
    );
    // …and the link's own query parses back to the tag it names.
    expect(parseQuery('tag:"slow cooker"').filter).toEqual({
      type: "text",
      field: "tag",
      value: "slow cooker",
    });
  });
});
