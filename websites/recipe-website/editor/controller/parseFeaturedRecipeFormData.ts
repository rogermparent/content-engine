import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const FeaturedRecipeFormSchema = z.object({
  recipe: z.string().min(1),
  date: z.optional(dateEpochSchema),
  note: z.string().optional(),
  slug: z.string().optional(),
});

export type ParsedFeaturedRecipeFormData = z.infer<
  typeof FeaturedRecipeFormSchema
>;

export default function parseFeaturedRecipeFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedFeaturedRecipeFormData> {
  return parseFormData(formData, FeaturedRecipeFormSchema);
}
