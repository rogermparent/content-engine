import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import type { MassagedRecipeEntry } from "../../controller/data/readIndex";

export function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="">
      {children}
    </Link>
  );
}

export function RecipeListItem({
  slug,
  date,
  name,
  image,
  placeholderURL,
}: MassagedRecipeEntry) {
  return (
    <div className="my-1 rounded-lg bg-slate-900 overflow-hidden w-full h-full md:text-sm">
      <Link
        href={`/recipe/${slug}`}
        className="block group flex flex-col flex-nowrap h-full"
      >
        <div className="w-full h-64 sm:h-40 overflow-hidden bg-gray-800">
          {image && (
            <Image
              src={`/recipe/${slug}/uploads/${image}/thumbnail`}
              alt="Recipe thumbnail"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              placeholder={placeholderURL ? "blur" : undefined}
              blurDataURL={placeholderURL}
            />
          )}
        </div>
        <div className="sm:text-sm my-1 mx-3 sm:h-12 md:text-xs">{name}</div>
        <div className="text-sm italic px-2 text-gray-400 my-1 sm:h-5">
          {new Date(date).toLocaleString()}
        </div>
      </Link>
    </div>
  );
}

export default function RecipeList({
  recipes,
}: {
  recipes: MassagedRecipeEntry[];
}) {
  return (
    <ul className="mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-center">
      {recipes.map((entry) => {
        const { date, slug, name, image, placeholderURL } = entry;
        return (
          <li key={slug} className="w-full sm:p-1 sm:w-1/2 md:w-1/3 lg:w-1/4">
            <RecipeListItem
              slug={slug}
              date={date}
              name={name}
              image={image}
              placeholderURL={placeholderURL}
            />
          </li>
        );
      })}
    </ul>
  );
}
