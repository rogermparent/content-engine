import { ReactNode } from "react";
import getRecipes from "recipes-collection/controller/data/readIndex";
import { MultiplierProvider } from "recipes-collection/components/View/Multiplier/Provider";

export default function RecipeViewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MultiplierProvider>{children}</MultiplierProvider>;
}

export async function generateStaticParams() {
  const { recipes } = await getRecipes();
  return recipes.map(({ slug }) => ({ slug }));
}
