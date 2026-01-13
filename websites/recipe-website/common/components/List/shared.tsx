import Link from "next/link";
import { ReactNode } from "react";

// Shared card container for recipe list items
export function RecipeCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-slate-900 overflow-hidden w-full h-full text-sm ${className}`}
    >
      {children}
    </div>
  );
}

// Link wrapper for recipe cards with hover group
export function RecipeCardLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block group flex flex-col flex-nowrap ${className}`}
    >
      {children}
    </Link>
  );
}

// Image container with consistent aspect ratio and hover effects
export function RecipeCardImageContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full aspect-[2/3] overflow-hidden bg-gray-800">
      {children}
    </div>
  );
}

// Shared image className for hover zoom effect
export const recipeCardImageClassName =
  "w-full h-full object-cover group-hover:scale-105 transition duration-300";

// Recipe name display
export function RecipeCardName({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={`text-sm my-1 mx-2 ${className}`}>{children}</h3>;
}

// Recipe date display with formatting
export function RecipeCardDate({
  date,
  showTime = false,
}: {
  date: string | number | Date;
  showTime?: boolean;
}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const formattedDate = showTime
    ? dateObj.toLocaleString()
    : dateObj.toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });

  return (
    <div className="text-xs italic px-2 text-gray-400 mb-1">
      {formattedDate}
    </div>
  );
}

// Grid container for recipe lists
export function RecipeGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {children}
    </ul>
  );
}

// Standard image props for recipe cards
export const standardRecipeImageProps = {
  width: 400,
  height: 600,
  sizes: "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw",
};
