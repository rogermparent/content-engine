import { MassagedRecipeEntry } from "../../controller/data/read";
import { RecipeIndexPageWrapper } from "./shared";

export default function RecipeIndexPage({
  recipes,
  pageNumber,
  more,
}: {
  recipes: MassagedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <RecipeIndexPageWrapper recipes={recipes} pageNumber={pageNumber} more={more} />
  );
}
