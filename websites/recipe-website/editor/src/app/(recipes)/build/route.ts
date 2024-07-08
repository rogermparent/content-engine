import { NextRequest, NextResponse } from "next/server";
import { execa } from "execa";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { unstable_noStore } from "next/cache";
import { auth, signIn } from "@/auth";
import { resolve } from "path";
import { Readable } from "stream";

let currentStream: ReadableStream | undefined;

export async function GET(_request: NextRequest) {
  unstable_noStore();
  const user = await auth();
  if (!user) {
    return signIn();
  }
  if (currentStream) {
    return new NextResponse("A build is already currently running!");
  }
  const contentDirectory = getContentDirectory();
  const cwd = resolve("..", "export");
  const newBuild = execa("pnpm", ["run", "build"], {
    cwd: cwd,
    all: true,
    env: {
      NODE_ENV: "production",
      CONTENT_DIRECTORY: contentDirectory,
    },
  });
  if (!newBuild.all) {
    throw new Error("Run has no all stream");
  }
  const webStream = Readable.toWeb(newBuild.all);
  currentStream = webStream as ReadableStream;
  newBuild.finally(() => {
    currentStream = undefined;
  });

  return new NextResponse(currentStream);
}
