export default function createDefaultSlug({
  job,
  company,
}: {
  job?: string;
  company?: string;
}) {
  return [company, job].filter(Boolean).join("-");
}
