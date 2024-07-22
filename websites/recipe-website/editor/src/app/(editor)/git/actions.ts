"use server";

import rebuildRecipeIndex from "recipes-collection/controller/actions/rebuildIndex";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { revalidatePath } from "next/cache";

export async function checkout(branch: string) {
  const contentDirectory = getContentDirectory();
  if (await directoryIsGitRepo(contentDirectory)) {
    await simpleGit(contentDirectory).checkout(branch);
    await rebuildRecipeIndex();
  }
  revalidatePath("/git");
}

export async function deleteBranch(
  branch: string,
  _previousState: string | null,
): Promise<string | null> {
  const contentDirectory = getContentDirectory();
  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      await simpleGit(contentDirectory).deleteLocalBranch(branch);
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
  }
  return null;
}
