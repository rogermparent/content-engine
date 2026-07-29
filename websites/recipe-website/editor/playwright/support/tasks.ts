import {
  copy,
  ensureDir,
  outputJSON,
  readJSON,
  remove,
  writeFile,
} from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";

const projectRoot = resolve(__dirname, "..", "..");
const testContentDir = resolve(projectRoot, "test-content");
const testSettingsDir = resolve(projectRoot, "test-settings");
const testRemotesDir = resolve(projectRoot, "test-remotes");
const testClonesDir = resolve(projectRoot, "test-clones");
const fixturesRoot = resolve(projectRoot, "playwright", "fixtures");

export function fixturePath(...segments: string[]): string {
  return resolve(fixturesRoot, ...segments);
}

export function projectPath(relative: string): string {
  return resolve(projectRoot, relative);
}

export async function resetData(fixture?: string): Promise<void> {
  await remove(testSettingsDir);
  await remove(testContentDir);
  await remove(testRemotesDir);
  await remove(testClonesDir);
  if (fixture) {
    await copy(fixturePath("test-content", fixture), testContentDir);
  }
  await copy(fixturePath("users"), resolve(testContentDir, "users"));
}

export async function copyFixtures(fixtureName: string): Promise<void> {
  const fixtureDir = fixturePath("test-content", fixtureName);
  await remove(fixtureDir);
  await copy(testContentDir, fixtureDir);
}

export async function getContentGitLog(): Promise<string[]> {
  const log = await simpleGit(testContentDir).log();
  return log.all.map((item) => item.message);
}

export async function initializeContentGit(): Promise<void> {
  const git = simpleGit(testContentDir);
  await git.init();
  await writeFile(
    resolve(testContentDir, ".gitignore"),
    `\n/transformed-images\n/recipes/index\n/pages/index\n`,
  );
  await git.add(".").commit("Initial commit");
}

export async function writeSettings(
  settings: Record<string, unknown>,
): Promise<void> {
  await outputJSON(resolve(testSettingsDir, "settings.json"), settings, {
    spaces: 2,
  });
}

export async function loadGitFixture(fixture: string): Promise<void> {
  await remove(testContentDir);
  const fixtureBundlePath = fixturePath("git-test-content", fixture);
  await simpleGit().clone(fixtureBundlePath, testContentDir);
}

/** Create an empty bare repo to act as a sync remote. Returns its path. */
export async function createBareRemote(name = "origin"): Promise<string> {
  const remotePath = resolve(testRemotesDir, `${name}.git`);
  await remove(remotePath);
  await ensureDir(remotePath);
  await simpleGit().raw(["init", "--bare", remotePath]);
  return remotePath;
}

/** Point the content repo at a remote and push the current branch, setting upstream. */
export async function addRemoteAndPush(
  remoteUrl: string,
  name = "origin",
): Promise<void> {
  const git = simpleGit(testContentDir);
  await git.addRemote(name, remoteUrl);
  const status = await git.status();
  await git.push(["-u", name, status.current ?? "main"]);
}

/** Clone a remote into a scratch dir representing another app instance. */
export async function cloneFromRemote(
  remoteUrl: string,
  name = "clone",
): Promise<string> {
  const cloneDir = resolve(testClonesDir, name);
  await remove(cloneDir);
  await ensureDir(testClonesDir);
  await simpleGit().clone(remoteUrl, cloneDir);
  const git = simpleGit(cloneDir);
  await git.addConfig("user.email", "other@instance.test");
  await git.addConfig("user.name", "Other Instance");
  return cloneDir;
}

function recipeData(name: string) {
  return {
    name,
    description: "",
    date: 1767734335998,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    recipeYield: "",
  };
}

/** Add a brand-new recipe in a clone and commit it. */
export async function addRecipeInClone(
  cloneDir: string,
  slug: string,
  name: string,
): Promise<void> {
  const file = resolve(cloneDir, "recipes", "data", slug, "recipe.json");
  await outputJSON(file, recipeData(name));
  await simpleGit(cloneDir).add(".").commit(`Add new recipe: ${slug}`);
}

/** Change an existing recipe's name in a clone and commit it. */
export async function editRecipeInClone(
  cloneDir: string,
  slug: string,
  name: string,
): Promise<void> {
  const file = resolve(cloneDir, "recipes", "data", slug, "recipe.json");
  const data = await readJSON(file);
  data.name = name;
  await outputJSON(file, data);
  await simpleGit(cloneDir).add(".").commit(`Update recipe: ${slug}`);
}

/** Push a clone's commits back to its remote. */
export async function pushClone(cloneDir: string): Promise<void> {
  await simpleGit(cloneDir).push();
}

/** Read commit messages directly from a bare remote (empty repo → []). */
export async function getRemoteLog(remoteUrl: string): Promise<string[]> {
  try {
    const log = await simpleGit(remoteUrl).log();
    return log.all.map((item) => item.message);
  } catch {
    return [];
  }
}
