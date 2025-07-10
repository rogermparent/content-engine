import simpleGit from "simple-git";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { SubmitButton } from "component-library/components/SubmitButton";
import { BranchSelector } from "./BranchSelector";
import { CreateBranchForm } from "./CreateBranchForm";
import { GitLog } from "./GitLog";
import { RemoteSelector } from "./RemoteSelector";
import { CreateRemoteForm } from "./CreateRemoteForm";
import { initializeContentGit } from "../../../../controller/actions";
import { EntryWithDiff, GitInfo } from "./types";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";

const INITIALIZE_BUTTON_TEXT = "Initialize";

export function GitPageWithoutGit() {
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

export function GitPageWithGit({ gitInfo }: { gitInfo: GitInfo }) {
  const { branches, entriesWithDiffs, remotes } = gitInfo;

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

export async function getGitInfo(
  contentDirectory: string,
): Promise<GitInfo | undefined> {
  const isGit = await directoryIsGitRepo(contentDirectory);

  if (!isGit) {
    return undefined;
  }

  const contentGit = simpleGit({ baseDir: contentDirectory });
  const branchSummary = await contentGit.branchLocal();
  const branches = Object.values(branchSummary.branches);
  const remotes = await contentGit.getRemotes(true);
  const log = await contentGit.log().catch((_e) => undefined);
  const entriesWithDiffs: EntryWithDiff[] = await Promise.all(
    log?.all.map(async (entry) => {
      const diff = await contentGit.show(entry.hash);
      return {
        ...entry,
        diff: String(diff),
      } as EntryWithDiff;
    }) || [],
  );
  return { branches, remotes, entriesWithDiffs };
}

export async function GitUI() {
  const contentDirectory = getContentDirectory();
  const gitInfo = await getGitInfo(contentDirectory);
  return (
    <main className="h-full w-full p-2 max-w-prose mx-auto grow">
      <h1 className="text-xl font-bold my-3">Git-tracked Content Settings</h1>
      {gitInfo ? <GitPageWithGit gitInfo={gitInfo} /> : <GitPageWithoutGit />}
    </main>
  );
}
