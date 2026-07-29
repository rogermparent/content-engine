import { ZodSafeParseResult, z } from "zod";
import parseFormData from "@discontent/cms/forms/parseFormData";
import dateEpochSchema from "@discontent/cms/forms/schema/dateEpoch";

/**
 * A link row. `links` is a repeatable field, and an empty repeatable emits no
 * FormData key at all — so "no links" parses as `undefined`, not `[]`. The form
 * submits a sentinel when the list is deliberately empty; see the `links` field
 * in the project form.
 */
const ProjectLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const ProjectFormSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  summary: z.string().optional(),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
  role: z.string().optional(),
  client: z.string().optional(),
  status: z.enum(["shipped", "wip", "archived"]).optional(),
  featured: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(ProjectLinkSchema).optional(),
});

export type ParsedProjectFormData = z.infer<typeof ProjectFormSchema>;

export default function parseProjectFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedProjectFormData> {
  return parseFormData(formData, ProjectFormSchema);
}
