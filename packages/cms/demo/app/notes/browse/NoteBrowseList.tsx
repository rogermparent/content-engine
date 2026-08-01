import Link from "next/link";
import type { PaginationPage } from "@discontent/cms/pagination/types";
import type { NoteListItem } from "@/lib/notePagination";

function href(pageIndex: number | null): string {
  return pageIndex === null ? "/notes/browse" : `/notes/browse/${pageIndex}`;
}

/**
 * One surface of the paginated notes index.
 *
 * Navigation is relative — "Older" / "Newer", never "page 3 of 12". Page ids
 * are anchored at the oldest item so URLs stay stable, which means a
 * human-facing number counted from the newest end would move as the corpus
 * grows.
 */
export function NoteBrowseList({
  page,
  isLanding,
}: {
  page: PaginationPage<NoteListItem>;
  isLanding: boolean;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{isLanding ? "Browse Notes" : "Older Notes"}</h2>
        <Link href="/">All notes</Link>
      </div>

      {page.items.length === 0 ? (
        <p style={{ color: "#666" }}>No notes yet.</p>
      ) : (
        <ul data-testid="browse-list" style={{ listStyle: "none", padding: 0 }}>
          {page.items.map((item) => (
            <li
              key={item.slug}
              style={{
                padding: "15px",
                marginBottom: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <Link
                href={`/notes/${item.slug}`}
                style={{
                  textDecoration: "none",
                  color: "#0070f3",
                  fontSize: "18px",
                  fontWeight: "500",
                }}
              >
                {item.title}
              </Link>
              <p style={{ color: "#666", fontSize: "14px", margin: "5px 0 0" }}>
                {new Date(item.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <nav
        data-testid="browse-nav"
        style={{ display: "flex", gap: "15px", marginTop: "20px" }}
      >
        {page.newerPage !== null || !isLanding ? (
          <Link href={href(page.newerPage)}>Newer notes</Link>
        ) : null}
        {page.olderPage !== null ? (
          <Link href={href(page.olderPage)}>Older notes</Link>
        ) : null}
      </nav>

      {/*
       * Only the landing prints a total. A numbered page must not: `total`
       * lives behind its own cache tag precisely so that the corpus growing
       * does not invalidate every sealed page, and rendering it here would
       * hand that separation straight back.
       */}
      {isLanding ? (
        <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
          Total notes: {page.total}
        </p>
      ) : null}
    </div>
  );
}

export default NoteBrowseList;
