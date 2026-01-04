import { getStaticImageProps } from "next-static-image/src";
import { HomepageContent } from "../../../homepage-controller/types";
import Markdown from "component-library/components/Markdown";
import { join } from "path";
import {
  transformedImageOutputDirectory,
  uploadsDirectory,
} from "../../../homepage-controller/paths";
import Image from "next/image";

async function HomepageStaticImage({
  src,
  alt,
  width = 600,
  height = 400,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const image = await getStaticImageProps(
    {
      srcPath: join(uploadsDirectory, src),
      localOutputDirectory: transformedImageOutputDirectory,
    },
    {
      src: `/image/${src}`,
      alt,
      width,
      height,
      className,
    },
  );

  return (
    <Image {...image.props} alt={alt} unoptimized={true}>
      {null}
    </Image>
  );
}

export default function AboutSection({ about }: HomepageContent) {
  return (
    about && (
      <section className="flex flex-col flex-nowrap py-12 px-3 bg-backgroundAlt-light dark:bg-backgroundAlt-dark w-full min-h-96 h-screen lg:h-auto items-center justify-center relative">
        <div className="max-w-xl mx-auto">
          <Markdown
            forceWrapper={true}
            className="markdown-body bg-inherit"
            components={{ img: HomepageStaticImage }}
          >
            {about}
          </Markdown>
        </div>
        <a
          href="#projects"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center lg:hidden"
          aria-label="Scroll to next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            width={48}
            height={48}
            className="w-12 h-12 text-gray-500 hover:text-gray-700 animate-bounce"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </a>
      </section>
    )
  );
}
