import { hash, genSalt } from "bcrypt";
import { mkdir, writeFile } from "fs-extra";
import { resolve } from "path";
import { read } from "read";
import process from "node:process";

async function createUser() {
  const email = await read({ prompt: "Enter an email: " });
  const passwordPromise = read({
    prompt: "Enter a password: ",
    silent: true,
    replace: "*",
  });

  const salt = await genSalt();
  const password = await passwordPromise;
  const hashedPassword = await hash(password, salt);
  const userData = { email, password: hashedPassword };
  const usersDir = resolve(process.env.CONTENT_DIRECTORY || "content", "users");
  await mkdir(usersDir, { recursive: true });
  await writeFile(resolve(usersDir, email), JSON.stringify(userData));
  process.exit(0);
}

createUser();
