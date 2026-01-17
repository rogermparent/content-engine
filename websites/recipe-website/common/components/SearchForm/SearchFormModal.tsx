"use client";

import { useEffect, useState } from "react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "component-library/components/ui/dialog";
import SearchForm from "./index";
import {
  MassagedRecipeEntry,
  ReadRecipeIndexResult,
} from "../../controller/data/read";

interface SearchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: MassagedRecipeEntry) => void;
}

export default function SearchFormModal({
  isOpen,
  onClose,
  onSelectRecipe,
}: SearchFormModalProps) {
  const [firstPage, setFirstPage] = useState<ReadRecipeIndexResult | null>(
    null,
  );

  useEffect(() => {
    if (isOpen && !firstPage) {
      fetch(`/search/page/1`)
        .then((res) => res.json())
        .then((data: ReadRecipeIndexResult) => {
          setFirstPage(data);
        })
        .catch((err) => {
          console.error("Failed to fetch recipes", err);
        });
    }
  }, [isOpen, firstPage]);

  const handleRecipeSelect = (recipe: MassagedRecipeEntry) => {
    onSelectRecipe(recipe);
    onClose();
  };

  if (!firstPage) {
    return null;
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Recipe</DialogTitle>
        </DialogHeader>
        <SearchForm
          firstPage={firstPage}
          onRecipeSelect={handleRecipeSelect}
          isModal={true}
        />
      </DialogContent>
    </DialogRoot>
  );
}
