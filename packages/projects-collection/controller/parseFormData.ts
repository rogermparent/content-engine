import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const ProjectFormSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
});

export type ParsedProjectFormData = z.infer<typeof ProjectFormSchema>;

export default function parseProjectFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedProjectFormData> {
  return parseFormData(formData, ProjectFormSchema);
}
