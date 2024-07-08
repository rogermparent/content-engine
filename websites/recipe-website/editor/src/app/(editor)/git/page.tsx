import rebuildRecipeIndex from "recipes-collection/controller/actions/rebuildIndex";
import { auth, signIn } from "@/auth";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import clsx from "clsx";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { SubmitButton } from "component-library/components/SubmitButton";
import { revalidatePath } from "next/cache";

async function checkout(branch: string) {
  "use server";
  const contentDirectory = getContentDirectory();
  if (await directoryIsGitRepo(contentDirectory)) {
    await simpleGit(contentDirectory).checkout(branch);
    await rebuildRecipeIndex();
  }
  revalidatePath("/git");
}

async function createBranch(formData: FormData) {
  "use server";
  const contentDirectory = getContentDirectory();
  const branchName = formData.get("branchName") as string;
  if (await directoryIsGitRepo(contentDirectory)) {
    await simpleGit(contentDirectory).checkout(["-b", branchName]);
  }
  revalidatePath("/git");
}

async function GitPageWithoutGit() {
  return (
    <>
      <h2 className="text-lg my-3">
        Content directory is not tracked with Git
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
  const branches = await contentGit.branchLocal();
  return (
    <>
      <h2 className="text-lg font-bold my-3">Branches</h2>
      <div className="pl-1 my-3">
        <h3 className="font-bold border-b border-white">Checkout Branch</h3>
        {branches.all.map((branch) => {
          const checkoutThisBranch = checkout.bind(null, branch);
          const branchIsSelected = branch === branches.current;
          return (
            <form key={branch} action={checkoutThisBranch}>
              <SubmitButton
                overrideDefaultStyles={true}
                className={clsx("underline", branchIsSelected && "font-bold")}
              >
                {branchIsSelected ? "* " : "  "}
                {branch}
              </SubmitButton>
            </form>
          );
        })}
      </div>
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
