import { StaticImageProps } from "@discontent/next-static-image/src";

export interface LinkItem {
  label: string;
  link: string;
}

export interface ContactLink {
  link: string;
  label: string;
  icon: string;
  iconType?: "text" | "inlineSVG";
}

export interface HomepageProjectItem {
  name: string;
  description: string;
  image?: string;
  existingImage?: StaticImageProps;
  links?: LinkItem[];
}

export interface HomepageContent {
  title?: string;
  about?: string;
  projects?: HomepageProjectItem[];
  contactLinks?: ContactLink[];
  contactSectionTitle?: string;
  projectSectionTitle?: string;
}
