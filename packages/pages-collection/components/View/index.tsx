import { Page } from "../../controller/types";

import Markdown from "component-library/components/Markdown";

export const PageView = ({ page }: { page?: Page }) => {
  if (!page) {
    throw new Error("Page data not found!");
  }

  const { name, content } = page;

  return (
    <div className="w-full h-full p-2 print:p-0 grow flex flex-col flex-nowrap max-w-xl">
      <h1 className="text-3xl font-bold mt-4 mb-6">{name}</h1>
      {content && <Markdown forceBlock={true}>{content}</Markdown>}
    </div>
  );
};
