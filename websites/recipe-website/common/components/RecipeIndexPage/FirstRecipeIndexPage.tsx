import { MassagedRecipeEntry } from "../../controller/data/read";
import { RecipeIndexPageWrapper } from "./shared";

export default function FirstRecipeIndexPage({
  recipes,
  more,
}: {
  recipes: MassagedRecipeEntry[];
  more: boolean;
}) {
  return <RecipeIndexPageWrapper recipes={recipes} pageNumber={1} more={more} />;
}
