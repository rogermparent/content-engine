import simpleGit from "simple-git";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { SubmitButton } from "component-library/components/SubmitButton";
import { BranchSelector } from "./BranchSelector";
import { CreateBranchForm } from "./CreateBranchForm";
import { GitLog } from "./GitLog";
import { RemoteSelector } from "./RemoteSelector";
import { CreateRemoteForm } from "./CreateRemoteForm";
import { initializeContentGit } from "./actions";

const INITIALIZE_BUTTON_TEXT = "Initialize";

async function GitPageWithoutGit() {
  return (
    <>
      <h2 className="text-lg my-3">
        Content directory is not tracked with Git.
        <form action={initializeContentGit}>
          <SubmitButton>{INITIALIZE_BUTTON_TEXT}</SubmitButton>
        </form>
      </h2>
    </>
  );
}

async function GitPageWithGit({
  contentDirectory,
}: {
  contentDirectory: string;
}) {
  const contentGit = simpleGit(contentDirectory);
  const branchSummary = await contentGit.branchLocal();
  const branches = Object.values(branchSummary.branches);
  const remotes = await contentGit.getRemotes(true);
  const log = await contentGit.log();
  const entriesWithDiffs = await Promise.all(
    log.all.map(async (entry) => ({
      ...entry,
      diff: await contentGit.show(entry.hash),
    })),
  );

  return (
    <>
      <h2 className="text-lg font-bold my-3">Branches</h2>
      <BranchSelector branches={branches} />
      <div className="pl-1 my-3">
        <h3 className="font-bold border-b border-white">New Branch</h3>
        <CreateBranchForm />
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-bold">Commit History</h2>
        <GitLog log={entriesWithDiffs} />
      </div>
      <h2 className="text-lg font-bold my-3">Remotes</h2>
      <RemoteSelector remotes={remotes} />
      <details className="pl-1 my-3">
        <summary className="font-bold border-b border-white">
          New Remote
        </summary>
        <CreateRemoteForm />
      </details>
    </>
  );
}

export async function GitUI({
  contentDirectory,
}: {
  contentDirectory: string;
}) {
  const isGit = await directoryIsGitRepo(contentDirectory);
  return (
    <main className="h-full w-full p-2 max-w-prose mx-auto grow">
      <h1 className="text-xl font-bold my-3">Git-tracked Content Settings</h1>
      {isGit ? (
        <GitPageWithGit contentDirectory={contentDirectory} />
      ) : (
        <GitPageWithoutGit />
      )}
    </main>
  );
}
