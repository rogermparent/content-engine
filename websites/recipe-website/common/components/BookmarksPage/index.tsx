"use client";

import { useBookmarks } from "recipe-website-common/context/BookmarksContext";
import ClientRecipeList from "recipe-website-common/components/ClientList";
import Link from "next/link";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";

export default function BookmarksPage() {
  const [{ bookmarks }] = useBookmarks();

  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>My Bookmarks</PageHeading>
        {bookmarks && bookmarks.length > 0 ? (
          <ClientRecipeList recipes={bookmarks} />
        ) : (
          <div className="text-center my-8">
            <p className="mb-4">You have not bookmarked any recipes yet.</p>
            <Link
              href="/recipes/1"
              className="text-center p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
            >
              Browse Recipes
            </Link>
          </div>
        )}
      </PageSection>
    </PageMain>
  );
}
