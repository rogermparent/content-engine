import z from "zod";

const dateEpochSchema = z.union([
  z.enum([""]),
  z.string().transform((value, ctx) => {
    const epoch = Date.parse(`${value}Z`);
    if (Number.isNaN(epoch)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
      });
      return z.NEVER;
    }
    return epoch;
  }),
]);

export default dateEpochSchema;
