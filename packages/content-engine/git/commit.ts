import { join } from "path";
import { access } from "fs-extra";
import simpleGit from "simple-git";
import { getContentDirectory } from "../fs/getContentDirectory";

export async function directoryIsGitRepo(contentDirectory: string) {
  try {
    await access(join(contentDirectory, ".git"));
    return true;
  } catch {
    return false;
  }
}

export async function commitChanges(
  contentDirectory: string,
  message: string,
  author?: { name: string; email: string },
) {
  const git = simpleGit({ baseDir: contentDirectory });
  await git.add("./*");

  if (author) {
    await git.commit(message, {
      "--author": `${author.name} <${author.email}>`,
    });
  } else {
    await git.commit(message);
  }
}

export async function commitContentChanges(
  message: string,
  author?: { name: string; email: string },
) {
  const contentDirectory = getContentDirectory();
  if (await directoryIsGitRepo(contentDirectory)) {
    await commitChanges(contentDirectory, message, author);
  }
}
