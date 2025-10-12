import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";
import dateEpochSchema from "content-engine/forms/schema/dateEpoch";

const ResumeFormSchema = z.object({
  company: z.string().min(1),
  job: z.string().min(1),
  date: z.optional(dateEpochSchema),
  slug: z.string().optional(),
  skills: z.array(z.string().min(1)).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  education: z
    .array(
      z.object({
        school: z.string(),
        achievement: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        url: z.array(z.string()).optional(),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .optional(),
});

export type ParsedResumeFormData = z.infer<typeof ResumeFormSchema>;

export default function parseResumeFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedResumeFormData> {
  return parseFormData(formData, ResumeFormSchema);
}
