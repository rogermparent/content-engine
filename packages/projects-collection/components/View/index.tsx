import { Project } from "../../controller/types";

import Markdown from "component-library/components/Markdown";

export const ProjectView = ({ project }: { project?: Project }) => {
  if (!project) {
    throw new Error("Project data not found!");
  }

  const { name, content } = project;

  return (
    <div className="w-full h-full p-2 print:p-0 grow flex flex-col flex-nowrap max-w-xl">
      <h1 className="text-3xl font-bold mt-4 mb-6">{name}</h1>
      {content && <Markdown>{content}</Markdown>}
    </div>
  );
};
