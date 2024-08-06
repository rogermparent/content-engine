import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { ReadStream } from "fs";
import { open } from "fs/promises";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";

export async function GET(
  _request: NextRequest,
  { params: { filePath } }: { params: { filePath: string[] } },
) {
  const filename = join(...filePath);
  try {
    const transformedImagePath = resolve(
      getContentDirectory(),
      "transformed-images",
      filename,
    );
    const handle = await open(transformedImagePath);
    const stream = ReadStream.toWeb(
      handle.createReadStream(),
    ) as ReadableStream;
    return new NextResponse(stream);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    } else {
      throw e;
    }
  }
}
