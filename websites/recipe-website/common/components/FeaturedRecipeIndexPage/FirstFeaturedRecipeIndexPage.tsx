import { MassagedFeaturedRecipeEntry } from "../../controller/data/readFeaturedRecipes";
import { FeaturedRecipeIndexPageWrapper } from "./shared";

export default function FirstFeaturedRecipeIndexPage({
  featuredRecipes,
  more,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  more: boolean;
}) {
  return <FeaturedRecipeIndexPageWrapper featuredRecipes={featuredRecipes} pageNumber={1} more={more} />;
}
