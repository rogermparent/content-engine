import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@discontent/component-library/components/ui/pagination";

/**
 * Shared paged navigation for the recipe and featured-recipe index pages.
 * `basePath` is the listing root (e.g. "/recipes" or "/featured-recipes").
 */
export function RecipePagination({
  basePath,
  pageNumber,
  more,
}: {
  basePath: string;
  pageNumber: number;
  more: boolean;
}) {
  const isFirstPage = pageNumber === 1;
  const previousHref =
    pageNumber === 2 ? basePath : `${basePath}/${pageNumber - 1}`;
  const nextHref = `${basePath}/${pageNumber + 1}`;

  return (
    <Pagination className="my-2">
      <PaginationContent>
        <PaginationItem>
          {isFirstPage ? (
            <PaginationLink asChild>
              <Link href="/" aria-label="Go to home">
                <HomeIcon />
              </Link>
            </PaginationLink>
          ) : (
            <PaginationLink asChild>
              <Link href={previousHref} aria-label="Go to previous page">
                <ChevronLeftIcon />
              </Link>
            </PaginationLink>
          )}
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive aria-label={`Page ${pageNumber}`}>
            {pageNumber}
          </PaginationLink>
        </PaginationItem>
        {more && (
          <PaginationItem>
            <PaginationLink asChild>
              <Link href={nextHref} aria-label="Go to next page">
                <ChevronRightIcon />
              </Link>
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
