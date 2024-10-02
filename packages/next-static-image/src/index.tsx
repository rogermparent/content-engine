import { ImageLoaderProps, ImageProps, getImageProps } from "next/image";
import { join, parse, posix } from "path";
import sharp from "sharp";
import { ImgProps } from "next/dist/shared/lib/get-img-props";
import { queuePossibleImageResize } from "./resizeImage";
import { stat } from "fs/promises";

export interface LocalTransformProps {
  srcPath: string;
  localOutputDirectory: string;
}

export interface StaticImageProps {
  props: ImgProps;
}

export interface TransformedStaticImageProps {
  slug: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: ImageProps["loading"];
  sizes?: ImageProps["sizes"];
}

export async function getStaticImageProps(
  { srcPath, localOutputDirectory }: LocalTransformProps,
  imagePropsArgs: ImageProps & { src: string },
): Promise<StaticImageProps> {
  const { src } = imagePropsArgs;

  const { mtime } = await stat(srcPath);
  const imageSharp = sharp(srcPath);

  const resultDirectory = join(localOutputDirectory, src);
  const promisedResizedImages: Promise<void>[] = [];

  function loader({ src, width, quality = 75 }: ImageLoaderProps) {
    const { name } = parse(src);
    const resultFilename = `${name}-w${width}q${quality}.webp`;
    const resultPath = join(resultDirectory, resultFilename);

    promisedResizedImages.push(
      queuePossibleImageResize({
        sharp: imageSharp,
        width,
        quality,
        resultPath,
        resultFilename,
        srcMtime: mtime,
      }),
    );

    const resultSrc = posix.join(
      "/image",
      encodeURI(src),
      encodeURI(resultFilename),
    );

    return resultSrc;
  }

  const imageProps = getImageProps({ loader, ...imagePropsArgs });

  await Promise.all(promisedResizedImages);

  return imageProps;
}
