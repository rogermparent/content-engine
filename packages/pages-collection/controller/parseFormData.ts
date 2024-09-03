import { SafeParseReturnType, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const PageFormSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
});

export type ParsedPageFormData = z.infer<typeof PageFormSchema>;

interface RawPageFormData {
  name: string;
  content: string;
  date: string;
  slug: string;
}

export default function parsePageFormData(
  formData: FormData,
): SafeParseReturnType<RawPageFormData, ParsedPageFormData> {
  return parseFormData(formData, PageFormSchema);
}
