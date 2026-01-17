"use client";

import { Button } from "component-library/components/Button";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { useSearch } from "./SearchContext";

export function SearchInput() {
  const { inputValue, setInputValue, submitSearch } = useSearch();

  console.log({ inputValue });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const elements = form.elements as typeof form.elements & {
          query: { value: string };
        };
        submitSearch(elements.query.value || "");
      }}
    >
      <TextInput
        name="query"
        label="Query"
        value={inputValue || ""}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
