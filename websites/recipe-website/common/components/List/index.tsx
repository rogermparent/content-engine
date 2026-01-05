import Link from "next/link";
import { ReactNode } from "react";
import { MassagedRecipeEntry } from "../../controller/data/read";
import { RecipeImage } from "../RecipeImage";
import BookmarkButton from "../BookmarkButton";

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
}: MassagedRecipeEntry) {
  return (
    <div className="rounded-lg bg-slate-900 overflow-hidden w-full h-full text-sm relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <BookmarkButton recipe={{ slug, date, name, image }} />
      </div>
      <Link
        href={`/recipe/${slug}`}
        className="block flex flex-col flex-nowrap h-full"
      >
        <div className="w-full aspect-[2/3] overflow-hidden bg-gray-800">
          {image && (
            <RecipeImage
              slug={slug}
              image={image}
              alt="Recipe thumbnail"
              width={400}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
          )}
        </div>
        <div className="text-sm my-1 mx-2">{name}</div>
        <div className="text-xs italic px-2 text-gray-400 mb-1">
          {new Date(date).toLocaleString(undefined, {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          })}
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
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {recipes.map((entry) => {
        const { date, slug, name, image } = entry;
        return (
          <li key={slug}>
            <RecipeListItem slug={slug} date={date} name={name} image={image} />
          </li>
        );
      })}
    </ul>
  );
}
