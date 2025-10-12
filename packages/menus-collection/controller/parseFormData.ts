import { ZodSafeParseResult, z } from "zod";
import parseFormData from "content-engine/forms/parseFormData";

const baseMenuItemSchema = z.object({
  name: z.string(),
  href: z.string(),
});

type MenuItem = z.infer<typeof baseMenuItemSchema> & {
  children?: MenuItem[];
};

const MenuItemSchema: z.ZodType<MenuItem> = baseMenuItemSchema.extend({
  children: z.lazy(() => z.optional(MenuItemSchema.array())),
});

const MenuSchema = z.object({
  items: z.optional(z.array(MenuItemSchema)),
});

export type ParsedMenuFormData = z.infer<typeof MenuSchema>;

export default function parseMenuFormData(
  formData: FormData,
): ZodSafeParseResult<ParsedMenuFormData> {
  return parseFormData(formData, MenuSchema);
}
