import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const durationSchema = z
  .object({
    hours: z.string().optional(),
    minutes: z.string().optional(),
  })
  .transform((arg, ctx) => {
    if (!arg) {
      return undefined;
    }
    const { hours, minutes } = arg;
    const hoursNumber = hours ? Number(hours) : 0;
    const minutesNumber = minutes ? Number(minutes) : 0;
    if (isNaN(hoursNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["hours"],
        message: "Invalid number",
      });
    }
    if (isNaN(minutesNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["minutes"],
        message: "Invalid number",
      });
    }
    return hoursNumber * 60 + minutesNumber;
  });

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
  prepTime: durationSchema.optional(),
  cookTime: durationSchema.optional(),
  totalTime: durationSchema.optional(),
  recipeYield: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        ingredient: z.string().min(1),
        type: z.enum(["heading"]).optional(),
      }),
    )
    .optional(),
  instructions: z
    .array(
      z.union([
        z.object({
          name: z.string().optional(),
          text: z.string().min(1),
        }),
        z.object({
          name: z.string().min(1),
          instructions: z.array(
            z.object({
              name: z.string().optional(),
              text: z.string().min(1),
            }),
          ),
        }),
      ]),
    )
    .optional(),
});

export type ParsedRecipeFormData = z.infer<typeof RecipeFormSchema>;

export default function parseRecipeFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedRecipeFormData> {
  return parseFormData(formData, RecipeFormSchema);
}
