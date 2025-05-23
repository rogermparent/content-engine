import { test, expect, beforeEach } from "vitest";
import { execa } from "execa";
import { mkdir, readFile, remove } from "fs-extra";
import { User } from "recipe-editor/src/auth";
import { resolve } from "path";

const cwd = resolve("websites", "recipe-website", "editor");
const contentDirectory = resolve(cwd, "test-content");
const usersDirectory = resolve(contentDirectory, "users");

async function getUserFileContents(email: string): Promise<User> {
  const userFileContents = JSON.parse(
    String(await readFile(resolve(usersDirectory, email))),
  ) as User;

  return userFileContents;
}

beforeEach(async function () {
  await remove(contentDirectory);
  await mkdir(contentDirectory);
});

const testEmail = "admin@example.com";
const testPassword = "password";

test("should be able to create a user with CLI flags", async function () {
  const scriptProcess = execa(
    "pnpm",
    ["run", "create-user", "--password", testPassword, "--email", testEmail],
    {
      cwd: cwd,
      all: true,
      env: {
        CONTENT_DIRECTORY: contentDirectory,
      },
    },
  );

  await scriptProcess;
  const userFileContents = await getUserFileContents("admin@example.com");
  expect(userFileContents.email).toBe(testEmail);
  expect(userFileContents.password).toBeTruthy();
  expect(userFileContents.password).not.toBe(testPassword);
});

test("should be able to create a user with text input", async function () {
  let output: string[] = [];
  const scriptProcess = execa("pnpm", ["run", "create-user"], {
    cwd: cwd,
    all: true,
    env: {
      CONTENT_DIRECTORY: contentDirectory,
    },
  });
  scriptProcess.all.on("data", (data) => {
    output.push(String(data));
  });

  await expect.poll(() => output.join("")).toMatch(/Enter an email:/);

  scriptProcess.stdin.write("admin@example.com\n");

  await expect.poll(() => output.join("")).toMatch(/Enter a password:/);

  scriptProcess.stdin.write("password\n");

  await scriptProcess;
  const userFileContents = await getUserFileContents("admin@example.com");
  expect(userFileContents.email).toBe(testEmail);
  expect(userFileContents.password).toBeTruthy();
  expect(userFileContents.password).not.toBe(testPassword);
});

test("should be able to create a user with only email flag", async function () {
  let output: string[] = [];
  const scriptProcess = execa(
    "pnpm",
    ["run", "create-user", "--email", testEmail],
    {
      cwd: cwd,
      all: true,
      env: {
        CONTENT_DIRECTORY: contentDirectory,
      },
    },
  );
  scriptProcess.all.on("data", (data) => {
    output.push(String(data));
  });

  await expect.poll(() => output.join("")).toMatch(/Enter a password:/);

  scriptProcess.stdin.write("password\n");

  await scriptProcess;
  const userFileContents = await getUserFileContents("admin@example.com");
  expect(userFileContents.email).toBe(testEmail);
  expect(userFileContents.password).toBeTruthy();
  expect(userFileContents.password).not.toBe(testPassword);
});
