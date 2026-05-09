import { copy, outputJSON, remove, writeFile } from "fs-extra";
import { resolve } from "node:path";
import simpleGit from "simple-git";

const projectRoot = resolve(__dirname, "..", "..");
const testContentDir = resolve(projectRoot, "test-content");
const testSettingsDir = resolve(projectRoot, "test-settings");
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
    `\n/transformed-images\n/recipes/index\n`,
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
