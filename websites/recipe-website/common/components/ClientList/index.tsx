import Link from "next/link";
import { MassagedRecipeEntry } from "../../controller/data/read";
import BookmarkButton from "../BookmarkButton";

export function ClientRecipeListItem({
  slug,
  date,
  name,
  image,
}: MassagedRecipeEntry) {
  return (
    <div className="my-1 rounded-lg bg-slate-900 overflow-hidden w-full h-full md:text-sm relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <BookmarkButton recipe={{ slug, date, name, image }} />
      </div>
      <Link
        href={`/recipe/${slug}`}
        className="block flex flex-col flex-nowrap h-full"
      >
        <div className="w-full h-64 sm:h-40 overflow-hidden bg-gray-800">
          {image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/uploads/recipe/${slug}/uploads/${image}`}
              alt="Recipe thumbnail"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
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

export default function ClientRecipeList({
  recipes,
}: {
  recipes: MassagedRecipeEntry[];
}) {
  return (
    <ul className="mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-center">
      {recipes.map((entry) => {
        const { date, slug, name, image } = entry;
        return (
          <li key={slug} className="w-full sm:p-1 sm:w-1/2 md:w-1/3 lg:w-1/4">
            <ClientRecipeListItem slug={slug} date={date} name={name} image={image} />
          </li>
        );
      })}
    </ul>
  );
}

