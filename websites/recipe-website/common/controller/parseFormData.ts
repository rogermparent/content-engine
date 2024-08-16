import { SafeParseReturnType, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const RecipeFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.instanceof(File).optional(),
  clearImage: z.coerce.boolean(),
  video: z.instanceof(File).optional(),
  clearVideo: z.coerce.boolean(),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
  imageImportUrl: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        ingredient: z.string(),
        type: z.enum(["heading"]).optional(),
      }),
    )
    .optional(),
  instructions: z
    .array(
      z.union([
        z.object({
          name: z.string().optional(),
          text: z.string(),
        }),
        z.object({
          name: z.string(),
          instructions: z.array(
            z.object({
              name: z.string().optional(),
              text: z.string(),
            }),
          ),
        }),
      ]),
    )
    .optional(),
});

export type ParsedRecipeFormData = z.infer<typeof RecipeFormSchema>;

interface RawRecipeFormData {
  name: string;
  description: string;
  date: string;
  slug: string;
  image?: File;
  video?: string;
  clearImage?: boolean;
  ingredients: { ingredient: string; heading?: string }[];
  instructions: { name: string; text: string }[];
}

export default function parseRecipeFormData(
  formData: FormData,
): SafeParseReturnType<RawRecipeFormData, ParsedRecipeFormData> {
  return parseFormData(formData, RecipeFormSchema);
}
