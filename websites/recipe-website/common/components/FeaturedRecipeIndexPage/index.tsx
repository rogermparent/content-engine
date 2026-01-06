import { MassagedFeaturedRecipeEntry } from "../../controller/data/readFeaturedRecipes";
import { FeaturedRecipeIndexPageWrapper } from "./shared";

export default function FeaturedRecipeIndexPage({
  featuredRecipes,
  pageNumber,
  more,
}: {
  featuredRecipes: MassagedFeaturedRecipeEntry[];
  pageNumber: number;
  more: boolean;
}) {
  return (
    <FeaturedRecipeIndexPageWrapper featuredRecipes={featuredRecipes} pageNumber={pageNumber} more={more} />
  );
}
