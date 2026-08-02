import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@discontent/component-library/components/ui/pagination";
import type { PaginationPage } from "@discontent/cms/pagination/types";

/**
 * Paged navigation for an index that reads through a pagination keyspace.
 *
 * Everything is derived from the page it is handed — where the ends are, what
 * the neighbours are numbered — so it never does offset arithmetic and never
 * links to a page that does not exist.
 *
 * Two things it deliberately does not render:
 *
 *  - **A total, or a "page N of M".** `total` lives behind its own cache tag
 *    precisely so that the corpus growing does not invalidate every sealed
 *    page; printing it on a numbered page would hand that separation straight
 *    back.
 *  - **A number on the landing page.** The displayed number is the stable page
 *    id plus one, and a sealed page keeps it forever. The landing sits on the
 *    head, whose id moves every time the head seals, so numbering it would
 *    break the one promise the number makes.
 */
export function RecipePagination({
  basePath,
  page,
  isLanding,
  firstPageNumber = 1,
}: {
  /** The listing root, e.g. "/recipes". */
  basePath: string;
  page: Pick<PaginationPage<unknown>, "pageIndex" | "newerPage" | "olderPage">;
  isLanding: boolean;
  /** The URL number of page 0, the oldest page. */
  firstPageNumber?: number;
}) {
  const href = (pageIndex: number) =>
    `${basePath}/${pageIndex + firstPageNumber}`;

  /*
   * A null `newerPage` on a numbered page does not mean "nothing newer" — it
   * means the next-newer surface is the landing, which has no number.
   */
  const newerHref = page.newerPage !== null ? href(page.newerPage) : basePath;
  const olderHref = page.olderPage !== null ? href(page.olderPage) : null;

  return (
    <Pagination className="my-2">
      <PaginationContent>
        <PaginationItem>
          {isLanding ? (
            <PaginationLink asChild>
              <Link href="/" aria-label="Go to home">
                <HomeIcon />
              </Link>
            </PaginationLink>
          ) : (
            <PaginationLink asChild size="default">
              <Link href={newerHref}>
                <ChevronLeftIcon aria-hidden="true" />
                Newer
              </Link>
            </PaginationLink>
          )}
        </PaginationItem>
        {!isLanding && page.pageIndex !== null && (
          <PaginationItem>
            <span
              data-testid="pagination-page-number"
              className="text-muted-foreground px-2 text-xs tabular-nums"
            >
              {page.pageIndex + firstPageNumber}
            </span>
          </PaginationItem>
        )}
        {olderHref && (
          <PaginationItem>
            <PaginationLink asChild size="default">
              <Link href={olderHref}>
                Older
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

/**
 * The offset-based control, kept for the featured-recipe index.
 *
 * Featured recipes still page by `offset`/`limit` and have no keyspace to ask
 * where the ends are, so they cannot use the control above. P4 moves them onto
 * a pagination index and deletes this.
 */
export function OffsetPagination({
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
