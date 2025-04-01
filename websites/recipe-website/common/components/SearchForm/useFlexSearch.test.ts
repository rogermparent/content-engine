import { useFlexSearch } from "./useFlexSearch";
import { Document } from "flexsearch";
import { renderHook } from "@testing-library/react";

test("useFlexSearch", () => {
  const index = new Document({
    preset: "default",
    tokenize: "forward",
    document: { store: true, id: "slug", index: ["name", "ingredients"] },
  });
  index.update({ slug: "test", name: "Test", ingredients: ["a", "b", "c"] });
  const { result } = renderHook(() => useFlexSearch("tes", index));
  expect(result.current).toBe("test");
});
