import { PageView } from "pages-collection/components/View";
import { Page } from "pages-collection/controller/types";
import { ReactNode } from "react";

export interface RenderedPageProps {
  page: Page;
  actions?: ReactNode;
}

export default function RenderedPage({ page, actions }: RenderedPageProps) {
  return (
    <main className="flex flex-col items-center w-full h-full grow">
      <div className="flex flex-row grow w-full h-full">
        <div className="grow flex flex-col flex-nowrap items-center">
          <PageView page={page} />
        </div>
      </div>
      {actions && (
        <>
          <hr className="w-full border-slate-700 print:hidden" />
          <div className="flex flex-row justify-center m-1 print:hidden">
            {actions}
          </div>
        </>
      )}
    </main>
  );
}
