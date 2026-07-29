import { AppLayout } from "portfolio-website-common/components/AppLayout";
import { EditorNavExtras } from "@/components/EditorNavExtras";

/**
 * Reader-facing chrome in the editor app. Same AppLayout the export renders,
 * plus the owner-only affordances — which are passed in as a slot rather than
 * imported inside `common/`, because `next-auth` is editor-only and `common/`
 * is compiled by the export app too.
 */
export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout extraNavItems={<EditorNavExtras />}>{children}</AppLayout>;
}
