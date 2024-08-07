import { getRecipeUploadPath } from "recipe-website-common/controller/filesystemDirectories";
import { ReadStream } from "fs";
import { open } from "fs/promises";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";

export async function GET(
  _request: NextRequest,
  {
    params: { slug, filename },
  }: { params: { slug: string; filename: string } },
) {
  try {
    const uploadFilePath = getRecipeUploadPath(
      getContentDirectory(),
      slug,
      filename,
    );
    const handle = await open(uploadFilePath);
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
