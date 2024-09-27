"use server";

import rebuildRecipeIndex from "recipe-website-common/controller/actions/rebuildIndex";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { revalidatePath } from "next/cache";

const commandHandlers: Record<
  string,
  (args: { contentDirectory: string; branch: string }) => Promise<void>
> = {
  async checkout({ contentDirectory, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await simpleGit(contentDirectory).checkout(branch);
    await rebuildRecipeIndex();
  },
  async delete({ contentDirectory, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await simpleGit(contentDirectory).deleteLocalBranch(branch);
  },
  async forceDelete({ contentDirectory, branch }) {
    if (!branch) {
      throw new Error("Invalid branch");
    }
    await simpleGit(contentDirectory).deleteLocalBranch(branch, true);
  },
};

export async function branchCommandAction(
  _previousState: string | null,
  formData: FormData,
): Promise<string | null> {
  const command = formData.get("command");
  if (typeof command !== "string") {
    throw new Error("No command provided!");
  }
  const commandHandler = commandHandlers[command];
  if (!commandHandler) {
    throw new Error(`Invalid command: ${command}`);
  }
  const branch = formData.get("branch");
  if (typeof branch !== "string") {
    throw new Error(`Invalid branch: ${branch}`);
  }
  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    throw new Error("Content directory is not a Git repository.");
  }
  try {
    await commandHandler({ contentDirectory, branch });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "message" in e &&
      typeof e.message === "string"
    ) {
      return e.message;
    } else {
      throw e;
    }
  }
  await rebuildRecipeIndex();
  revalidatePath("/git");
  return null;
}
