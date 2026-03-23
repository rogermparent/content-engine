import { getContentDirectory } from "@discontent/cms/fs/getContentDirectory";
import { join } from "path";

export const homepageDirectory = join(getContentDirectory(), "homepage");

export const uploadsDirectory = join(getContentDirectory(), "uploads");
export const transformedImageOutputDirectory = join(
  getContentDirectory(),
  "transformed-images",
);

export const homepageUploadsPath = join(homepageDirectory, "uploads");

export const homepageContentFilePath = join(homepageDirectory, "homepage.json");
