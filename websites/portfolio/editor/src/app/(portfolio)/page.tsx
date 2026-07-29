import HomePage from "portfolio-website-common/components/Homepage";

export { generateMetadata } from "portfolio-website-common/components/Homepage";

/**
 * The homepage. Lives in the (portfolio) group so it inherits the single
 * AppLayout — it used to sit in its own (home) group and render a *fourth*
 * footer of its own, on top of the two the layouts already stacked.
 *
 * The owner-facing "Edit Homepage" link moved into the masthead's Manage
 * affordance; a reader-facing page should not carry editor chrome.
 */
export default function EditorHomePage() {
  return <HomePage />;
}
