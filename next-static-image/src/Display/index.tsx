import { StaticImageProps } from "../index";

export function StaticImageDisplay({
  image: { props },
}: {
  image: StaticImageProps;
}) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
}