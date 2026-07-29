import { ProjectFormState } from "../../controller/formState";
import ProjectFields from "./fields";

/**
 * The project fields, for a page wrapper that has already mounted a
 * `ProjectFormShell` around them — the shell owns the TanStack Form instance
 * and seeds it from `project`/`slug`, so those are no longer threaded through
 * here.
 */
export default function ProjectForm({
  state,
  allTags,
}: {
  state?: ProjectFormState;
  allTags?: string[];
}) {
  return <ProjectFields state={state} allTags={allTags} />;
}
