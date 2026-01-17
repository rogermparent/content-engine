"use client";

import { useState, useEffect } from "react";
import { Errors, FieldWrapper } from "component-library/components/Form";
import { Button } from "component-library/components/Button";
import SearchFormModal from "../../../SearchForm/SearchFormModal";
import { MassagedRecipeEntry } from "../../../../controller/data/read";

export function RecipeSelectInput({
  name,
  id = name,
  defaultValue,
  label,
  errors,
  required = false,
}: {
  name: string;
  id?: string;
  label?: string;
  defaultValue?: string;
  errors?: string[];
  required?: boolean;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    defaultValue || null,
  );
  const [selectedRecipe, setSelectedRecipe] =
    useState<MassagedRecipeEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(defaultValue));

  // Fetch recipe data if defaultValue is provided
  useEffect(() => {
    if (isLoading) {
      const value = selectedSlug || defaultValue;
      if (value) {
        fetch(`/api/recipe/${value}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch recipe: ${res.status}`);
            }
            return res.json();
          })
          .then((recipe: MassagedRecipeEntry) => {
            setSelectedRecipe(recipe);
          })
          .catch((err) => {
            console.error("Failed to fetch recipe", value, err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [defaultValue, selectedSlug, isLoading]);

  const handleSelectRecipe = (recipe: MassagedRecipeEntry) => {
    setSelectedSlug(recipe.slug);
    setSelectedRecipe(recipe);
  };

  const handleClear = () => {
    setSelectedSlug(null);
    setSelectedRecipe(null);
  };

  return (
    <FieldWrapper label={label} id={id}>
      <Errors errors={errors} />
      <input
        type="hidden"
        name={name}
        id={id}
        value={selectedSlug || ""}
        required={required}
      />
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm">Loading recipe...</p>
        ) : selectedRecipe ? (
          <div className="flex items-center gap-2">
            <p className="text-sm">Selected: {selectedRecipe.name}</p>
            <Button type="button" onClick={handleClear}>
              Clear
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            Select Recipe
          </Button>
        )}
      </div>
      <SearchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectRecipe={handleSelectRecipe}
      />
    </FieldWrapper>
  );
}
