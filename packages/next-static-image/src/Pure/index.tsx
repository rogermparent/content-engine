import React from "react";
import Image, { ImageLoaderProps, getImageProps } from "next/image";
import { parse } from "path";

export function pureLoader({ src, width, quality = 75 }: ImageLoaderProps) {
  const { name } = parse(src);
  const resultFilename = `${name}-w${width}q${quality}.webp`;
  const resultSrc = encodeURI(`/image${src}/${resultFilename}`);
  return resultSrc;
}

interface PureStaticImageProps {
  slug: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function getPureStaticImageProps({
  slug,
  image,
  alt,
  width,
  height,
  className,
}: PureStaticImageProps) {
  const {
    props: { children, ...rest },
  } = getImageProps({
    loader: pureLoader,
    src: `/uploads/recipe/${slug}/uploads/${image}`,
    alt,
    width,
    height,
    className,
  });

  return { props: rest };
}

export function PureStaticImage(inputProps: PureStaticImageProps) {
  if (inputProps.image) {
    const image = getPureStaticImageProps(inputProps);
    return (
      <Image {...image.props} alt={inputProps.alt} unoptimized={true}>
        {null}
      </Image>
    );
  }
}
