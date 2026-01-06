import { PageView } from "pages-collection/components/View";
import { Page } from "pages-collection/controller/types";
import { ReactNode } from "react";
import {
  PageMain,
  PageSection,
  PageActions,
} from "recipe-website-common/components/PageLayout";

export interface RenderedPageProps {
  page: Page;
  actions?: ReactNode;
}

export default function RenderedPage({ page, actions }: RenderedPageProps) {
  return (
    <PageMain>
      <PageSection maxWidth="none" className="py-0" grow>
        <PageView page={page} />
      </PageSection>
      {actions && <PageActions>{actions}</PageActions>}
    </PageMain>
  );
}
