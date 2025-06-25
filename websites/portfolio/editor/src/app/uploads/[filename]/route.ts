import { uploadsDirectory } from "portfolio-website-common/homepage-controller/paths";
import { ReadStream } from "fs";
import { open } from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ filename: string }>;
  },
) {
  const { filename } = await params;
  try {
    const uploadFilePath = resolve(uploadsDirectory, filename);
    const handle = await open(uploadFilePath);
    const stream = ReadStream.toWeb(
      handle.createReadStream(),
    ) as ReadableStream;
    return new NextResponse(stream);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      notFound();
    }
    throw e;
  }
}
