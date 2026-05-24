import { ComponentProps } from "react";
import {
  Button as ShadcnButton,
  buttonVariants,
} from "@discontent/component-library/components/ui/button";

export function Button({
  type = "button",
  ...props
}: ComponentProps<typeof ShadcnButton>) {
  return <ShadcnButton type={type} {...props} />;
}

export { buttonVariants };
