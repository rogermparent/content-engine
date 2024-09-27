import { auth, signIn } from "@/auth";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { SubmitButton } from "component-library/components/SubmitButton";
import { revalidatePath } from "next/cache";
import { BranchSelector } from "./BranchSelector";
import { BRANCH_NAME_KEY, GIT_PATH, INITIAL_COMMIT_MESSAGE } from "./constants";

async function createBranch(formData: FormData) {
  "use server";
  const contentDirectory = getContentDirectory();
  const branchName = formData.get(BRANCH_NAME_KEY) as string;
  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      await simpleGit(contentDirectory).checkout(["-b", branchName]);
    } catch (e) {
      // Log the error and provide user feedback
      console.error(e);
      throw new Error("Failed to create branch.");
    }
  }
  revalidatePath(GIT_PATH);
}

async function initializeContentGit() {
  "use server";
  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    const git = simpleGit(contentDirectory);
    try {
      await git.init();
      await git.add(".");
      await git.commit(INITIAL_COMMIT_MESSAGE);
    } catch (e) {
      // Log the error and provide user feedback
      console.error(e);
      throw new Error("Failed to initialize Git repository.");
    }
  }
  revalidatePath(GIT_PATH);
}

async function GitPageWithoutGit() {
  return (
    <>
      <h2 className="text-lg my-3">
        Content directory is not tracked with Git.
        <form action={initializeContentGit}>
          <SubmitButton>Initialize</SubmitButton>
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
        <form action={createBranch}>
          <TextInput label="Branch Name" name="branchName" />
          <div className="flex flex-row flex-nowrap my-1 gap-1">
            <SubmitButton>Create</SubmitButton>
          </div>
        </form>
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
