/* eslint-disable @next/next/no-img-element */
import { join } from "path";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import {
  TransformedStaticImageProps,
  getStaticImageProps,
} from "next-static-image/src";
import { getRecipeUploadPath } from "../../controller/filesystemDirectories";

const localOutputDirectory = join(getContentDirectory(), "transformed-images");

export async function getTransformedRecipeImageProps({
  slug,
  image,
  alt,
  width,
  height,
  loading,
  sizes,
  className,
}: TransformedStaticImageProps) {
  if (!image) return undefined;
  const srcPath = getRecipeUploadPath(getContentDirectory(), slug, image);
  try {
    const transformedProps = await getStaticImageProps(
      { srcPath, localOutputDirectory },
      {
        src: `/uploads/recipe/${slug}/uploads/${image}`,
        alt,
        width,
        height,
        className,
        loading,
        sizes,
      },
    );
    return transformedProps;
  } catch (e) {
    const { code, message } = e as { code?: string; message?: string };
    console.warn(
      `RecipeImage "${image}" failed with error` +
        (message ? `: ${message}` : code ? ` code ${code}` : ""),
    );
  }
}

export async function RecipeImage(inputProps: TransformedStaticImageProps) {
  const image = await getTransformedRecipeImageProps(inputProps);
  if (image) {
    return <img {...image.props} alt={inputProps.alt} />;
  }
}
