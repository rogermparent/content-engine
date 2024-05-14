import { uploadsDirectory } from "@/app/(editor)/homepage/paths";
import { ReadStream } from "fs";
import { open } from "fs/promises";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";

export async function GET(
  _request: NextRequest,
  { params: { filename } }: { params: { filename: string } },
) {
  try {
    const uploadFilePath = resolve(uploadsDirectory, filename);
    const handle = await open(uploadFilePath);
    const stream = ReadStream.toWeb(
      handle.createReadStream(),
    ) as ReadableStream;
    return new NextResponse(stream);
  } catch (e) {
    notFound();
  }
}
