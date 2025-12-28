import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const PageFormSchema = z.object({
  name: z.string().min(1),
  content: z
    .string()
    .transform((rawString) => rawString.replaceAll("\r\n", "\n")),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
});

export type ParsedPageFormData = z.infer<typeof PageFormSchema>;

export default function parsePageFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedPageFormData> {
  return parseFormData(formData, PageFormSchema);
}
