import { auth, signIn } from "@/auth";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { SubmitButton } from "component-library/components/SubmitButton";
import { revalidatePath } from "next/cache";
import { BranchSelector } from "./BranchSelector";
import { CreateBranchForm } from "./CreateBranchForm";

const INITIALIZE_BUTTON_TEXT = "Initialize";
const INITIAL_COMMIT_MESSAGE = "Initial commit";

async function initializeContentGit() {
  "use server";

  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    const git = simpleGit(contentDirectory);
    await git.init();
    await git.add(".");
    await git.commit(INITIAL_COMMIT_MESSAGE);
  }
  revalidatePath("/git");
}

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
  const branchSummary = await contentGit.branch();
  const branches = Object.values(branchSummary.branches);
  return (
    <>
      <h2 className="text-lg font-bold my-3">Branches</h2>
      <BranchSelector branches={branches} />
      <div className="pl-1 my-3">
        <h3 className="font-bold border-b border-white">New Branch</h3>
        <CreateBranchForm />
      </div>
    </>
  );
}

export default async function GitPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/git`,
    });
  }

  const contentDirectory = getContentDirectory();
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
