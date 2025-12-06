"use client";

import { useBookmarks } from "recipe-website-common/context/BookmarksContext";
import ClientRecipeList from "recipe-website-common/components/ClientList";
import Link from "next/link";

export default function BookmarksPage() {
  const [{ bookmarks }] = useBookmarks();

  return (
    <main className="flex flex-col items-center w-full p-2 max-w-4xl mx-auto grow">
      <div className="m-2 text-left w-full grow">
        <h2 className="font-bold text-2xl mb-4">My Bookmarks</h2>
        {bookmarks && bookmarks.length > 0 ? (
          <ClientRecipeList recipes={bookmarks} />
        ) : (
          <div className="text-center my-8">
            <p className="mb-4">You haven't bookmarked any recipes yet.</p>
            <Link
              href="/recipes/1"
              className="text-center p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
            >
              Browse Recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
