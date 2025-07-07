export type MenuItem = {
  type?: undefined;
  name: string;
  href: string;
  children?: MenuItem[];
};

export interface Menu<Item = MenuItem> {
  items?: (Item & { children?: Item[] })[];
}
