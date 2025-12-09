import slugify from "@sindresorhus/slugify";
export default function createDefaultSlug({ name }: { name: string }) {
  return name ? slugify(name) : "";
}
