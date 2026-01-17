"use client";

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "component-library/components/ui/dialog";
import { SearchProvider } from "./SearchContext";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { useSearchURLSync } from "./useSearchURLSync";
import { MassagedRecipeEntry } from "../../controller/data/read";

interface SearchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: MassagedRecipeEntry) => void;
}

function SearchModalContent() {
  useSearchURLSync(false); // Disable URL sync

  return (
    <>
      <SearchInput />
      <SearchResults />
    </>
  );
}

export default function SearchFormModal({
  isOpen,
  onClose,
  onSelectRecipe,
}: SearchFormModalProps) {
  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background-light dark:bg-background-dark">
        <DialogHeader>
          <DialogTitle>Select a Recipe</DialogTitle>
        </DialogHeader>
        <SearchProvider
          config={{
            mode: "modal",
            onRecipeSelect: (recipe) => {
              onSelectRecipe(recipe);
              onClose();
            },
          }}
        >
          <SearchModalContent />
        </SearchProvider>
      </DialogContent>
    </DialogRoot>
  );
}
