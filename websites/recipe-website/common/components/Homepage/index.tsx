import Link from "next/link";
import RecipeList from "../List";
import { MassagedRecipeEntry, getAllTags } from "../../controller/data/read";
import { recipeItems } from "../../controller/data/readRecipeItem";
import { Recipe } from "../../controller/types";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { Button } from "@discontent/component-library/components/ui/button";
import { EmptyState } from "recipe-website-common/components/EmptyState";
import { HeroBench } from "./HeroBench";
import { BrowseChips } from "./BrowseChips";

function RecipeSection({
  title,
  recipes,
  linkHref,
  linkText,
  emptyText,
}: {
  title: string;
  recipes: MassagedRecipeEntry[];
  linkHref?: string;
  linkText?: string;
  emptyText?: string;
}) {
  if (recipes.length === 0 && !emptyText) {
    return null;
  }

  return (
    <div className="mb-8">
      <PageHeading className="font-display">{title}</PageHeading>
      {recipes.length > 0 ? (
        <RecipeList recipes={recipes} />
      ) : (
        emptyText && <EmptyState message={emptyText} />
      )}
      {recipes.length > 0 && linkHref && linkText && (
        <div className="flex flex-row items-center justify-center my-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={linkHref}>{linkText}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default async function Homepage({
  recipes,
  featuredRecipes,
  moreRecipes,
}: {
  recipes: MassagedRecipeEntry[];
  featuredRecipes: MassagedRecipeEntry[];
  moreRecipes: boolean;
}) {
  // The hero leads with a featured recipe when there is one; otherwise it falls
  // back to the latest recipe. The grids below still list every recipe.
  const heroSlug = featuredRecipes[0]?.slug ?? recipes[0]?.slug;
  const heroLabel: "Featured" | "Latest" =
    featuredRecipes.length > 0 ? "Featured" : "Latest";

  /*
   * The hero reads the chosen recipe's *whole* data file — far more than any
   * projection carries — at a URL that is `/`. That is the case F19 exists for
   * (§2): editing this recipe's description changes what the homepage renders
   * and dirties no page, moves no aggregate, and cannot be reached by
   * `revalidatePath(itemBasePath + "/" + slug)`. `item:recipes:<slug>` is what
   * reaches it, and the read is now cached under that tag.
   *
   * Nothing needs to fire specially when the *hero changes recipe*: which slug
   * is chosen comes from the strips, which read pagination heads the featured
   * and recipe writes already expire (F10a). A different hero is simply a
   * different cache key.
   *
   * The `catch` stays, and no longer looks vestigial: a missing recipe is now
   * `null` rather than a throw, so this only swallows genuine I/O failures —
   * which is the difference between a homepage with no hero and a 500.
   */
  const [tags, heroRecipe] = await Promise.all([
    getAllTags(),
    heroSlug
      ? recipeItems.read(heroSlug).catch(() => undefined)
      : Promise.resolve<Recipe | undefined>(undefined),
  ]);

  return (
    <PageMain>
      <PageSection>
        {heroRecipe && heroSlug && (
          <HeroBench recipe={heroRecipe} slug={heroSlug} label={heroLabel} />
        )}
        <BrowseChips tags={tags} />
        <RecipeSection
          title="Featured Recipes"
          recipes={featuredRecipes}
          linkHref="/featured-recipes"
          linkText="More Featured Recipes"
        />
        <RecipeSection
          title="Latest Recipes"
          recipes={recipes}
          linkHref={moreRecipes ? "/recipes" : undefined}
          linkText="More Latest Recipes"
          emptyText="There are no recipes yet."
        />
      </PageSection>
    </PageMain>
  );
}
