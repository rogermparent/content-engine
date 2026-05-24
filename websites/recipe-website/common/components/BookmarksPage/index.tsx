"use client";

import { useBookmarks } from "recipe-website-common/context/BookmarksContext";
import ClientRecipeList from "recipe-website-common/components/ClientList";
import Link from "next/link";
import {
  PageMain,
  PageSection,
  PageHeading,
} from "recipe-website-common/components/PageLayout";
import { EmptyState } from "recipe-website-common/components/EmptyState";
import { Button } from "@discontent/component-library/components/ui/button";

export default function BookmarksPage() {
  const [{ bookmarks }] = useBookmarks();

  return (
    <PageMain>
      <PageSection grow>
        <PageHeading>My Bookmarks</PageHeading>
        {bookmarks && bookmarks.length > 0 ? (
          <ClientRecipeList recipes={bookmarks} />
        ) : (
          <EmptyState
            message="You have not bookmarked any recipes yet."
            action={
              <Button asChild>
                <Link href="/recipes/1">Browse Recipes</Link>
              </Button>
            }
          />
        )}
      </PageSection>
    </PageMain>
  );
}
