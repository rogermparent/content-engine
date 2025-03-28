"use server";

import rebuildRecipeIndex from "recipe-website-common/controller/actions/rebuildIndex";
import simpleGit from "simple-git";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { directoryIsGitRepo } from "content-engine/git/commit";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const remoteSchema = z.object({
  remoteName: z.string().min(1, "Remote Name is required"),
  remoteUrl: z.string().min(1, "Remote URL is required"),
});

export async function createRemote(
  _state: string | undefined,
  formData: FormData,
) {
  "use server";
  const contentDirectory = getContentDirectory();
  const result = remoteSchema.safeParse({
    remoteName: formData.get("remoteName"),
    remoteUrl: formData.get("remoteUrl"),
  });

  if (!result.success) {
    return (
      result.error.flatten().fieldErrors.remoteName?.[0] ??
      result.error.flatten().fieldErrors.remoteUrl?.[0]
    );
  }

  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      await simpleGit(contentDirectory).addRemote(
        result.data.remoteName,
        result.data.remoteUrl,
      );
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
  }
  revalidatePath("/git");
}

export async function createBranch(
  _state: string | undefined,
  formData: FormData,
) {
  "use server";
  const contentDirectory = getContentDirectory();
  const branchName = formData.get("branchName") as string;
  if (!branchName) {
    return "Branch Name is required";
  }
  if (await directoryIsGitRepo(contentDirectory)) {
    try {
      await simpleGit(contentDirectory).checkout(["-b", branchName]);
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
  }
  revalidatePath("/git");
}

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
    return "No command provided!";
  }
  const commandHandler = commandHandlers[command];
  if (!commandHandler) {
    return `Invalid command: ${command}`;
  }
  const branch = formData.get("branch");
  if (typeof branch !== "string") {
    return `Invalid branch`;
  }
  const contentDirectory = getContentDirectory();
  if (!(await directoryIsGitRepo(contentDirectory))) {
    return "Content directory is not a Git repository.";
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

export async function remoteCommandAction(
  _previousState: string | null,
  _formData: FormData,
): Promise<string | null> {
  return null;
}
