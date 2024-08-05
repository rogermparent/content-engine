import { join } from "path";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import {
  TransformedRecipeImageProps,
  getStaticImageProps,
} from "next-static-image/src";
import Image from "next/image";
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
}: TransformedRecipeImageProps) {
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

export async function RecipeImage(inputProps: TransformedRecipeImageProps) {
  const image = await getTransformedRecipeImageProps(inputProps);
  if (image) {
    return (
      <Image {...image.props} alt={inputProps.alt} unoptimized={true}>
        {null}
      </Image>
    );
  }
}
