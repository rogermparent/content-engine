import Image from "next/image";
import Link from "next/link";
import { getStaticImageProps } from "@discontent/next-static-image/src";
import { join } from "path";
import { HomepageProjectItem } from "../../../homepage-controller/types";
import {
  transformedImageOutputDirectory,
  uploadsDirectory,
} from "../../../homepage-controller/paths";

interface ProjectCardProps {
  project: HomepageProjectItem;
}

export default async function ProjectCard({ project }: ProjectCardProps) {
  const imageProps = project.image
    ? await getStaticImageProps(
        {
          srcPath: join(uploadsDirectory, project.image),
          localOutputDirectory: transformedImageOutputDirectory,
        },
        {
          src: `/uploads/${project.image}`,
          alt: `Image for ${project.name}`,
          width: 640,
          height: 384,
        },
      )
    : undefined;

  return (
    <li className="rounded-lg overflow-hidden shadow-md max-w-screen-sm mx-auto">
      <div className="relative overflow-hidden">
        {imageProps && (
          <Image
            {...imageProps.props}
            alt={`Image for ${project.name}`}
            unoptimized={true}
            className="w-full h-96 object-cover transition duration-300 hover:scale-105"
          >
            {null}
          </Image>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-primary-light dark:text-primary-dark">
          {project.name}
        </h3>
        {project.links && (
          <div>
            {project.links.map(({ link, label }, i) => (
              <Link
                href={link}
                key={i}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold p-1 underline text-secondary-light dark:text-secondary-dark inline-block"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
        <p className="mt-2">{project.description}</p>
      </div>
    </li>
  );
}
