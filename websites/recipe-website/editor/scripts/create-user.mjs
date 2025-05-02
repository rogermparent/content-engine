import { hash, genSalt } from "bcrypt";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { read } from "read";
import process from "node:process";
import { parseArgs } from "node:util";

const options = {
  email: {
    type: "string",
  },
  password: {
    type: "string",
  },
};

async function getInput() {
  // If the user provides an email and password via command line, use them
  const { values } = parseArgs({ options });
  if (values.email) {
    return { email: values.email, password: values.password || "password" };
  }
  // Otherwise, prompt the user for an email and password
  const email = await read({ prompt: "Enter an email: " });
  const password = await read({
    prompt: "Enter a password: ",
    silent: true,
    replace: "*",
  });
  return { email, password };
}

async function createUser() {
  const inputPromise = getInput();
  const salt = await genSalt();
  const { email, password } = await inputPromise;
  const hashedPassword = await hash(password, salt);
  const userData = { email, password: hashedPassword };
  const usersDir = resolve(process.env.CONTENT_DIRECTORY || "content", "users");
  await mkdir(usersDir, { recursive: true });
  await writeFile(resolve(usersDir, email), JSON.stringify(userData));
  process.exit(0);
}

createUser();
