import Markdown from "react-markdown";
import styles from "./styles.module.css";
import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";
import { Url } from "url";

function MarkdownLink({
  href,
  children,
}: {
  href?: Url | string;
  children?: ReactNode;
}) {
  if (!href) {
    throw new Error("Link given no URL");
  }
  return (
    <Link href={href} target="_blank">
      {children}
    </Link>
  );
}

export default function StyledMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      className={clsx(styles.content, "text-sm")}
      components={{ a: MarkdownLink }}
    >
      {children}
    </Markdown>
  );
}
