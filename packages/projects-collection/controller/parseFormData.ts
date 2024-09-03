import { SafeParseReturnType, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const ProjectFormSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
});

export type ParsedProjectFormData = z.infer<typeof ProjectFormSchema>;

interface RawProjectFormData {
  name: string;
  content: string;
  date: string;
  slug: string;
}

export default function parseProjectFormData(
  formData: FormData,
): SafeParseReturnType<RawProjectFormData, ParsedProjectFormData> {
  return parseFormData(formData, ProjectFormSchema);
}
