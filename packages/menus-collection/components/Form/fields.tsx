"use client";

import { Menu } from "../../controller/types";
import { MenuFormState } from "../../controller/formState";
import { StaticImageProps } from "@discontent/next-static-image/src";
import { ItemsListInput } from "./Items";

export default function MenuFields({
  menu,
}: {
  menu?: Partial<Menu>;
  slug?: string;
  state: MenuFormState;
  defaultImage?: StaticImageProps;
}) {
  const { items } = menu || {};
  return (
    <>
      <ItemsListInput
        label="Items"
        name="items"
        id="menu-form-items"
        defaultValue={items}
      />
    </>
  );
}
