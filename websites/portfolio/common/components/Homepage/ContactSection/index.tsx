import { join } from "path";
import Link from "next/link";
import { readFile } from "fs-extra";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import {
  ContactLink,
  HomepageContent,
} from "../../../homepage-controller/types";

const baseLinkLabelStyle = "w-6 h-6 inline-block align-middle";

async function ContactLinkLabel({
  item: { icon, iconType },
}: {
  item: ContactLink;
}) {
  switch (iconType) {
    case "text":
      return (
        <span
          className={`${baseLinkLabelStyle} text-3xl font-bold leading-0 font-mono text-center mb-2`}
        >
          {icon}
        </span>
      );
    default:
      return (
        <span
          className={baseLinkLabelStyle}
          dangerouslySetInnerHTML={{
            __html: String(
              await readFile(join(getContentDirectory(), "icons", icon)),
            ),
          }}
        />
      );
  }
}

async function ContactLinkComponent({ item }: { item: ContactLink }) {
  return (
    <li>
      <Link
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="items-center w-auto block py-2 my-2 leading-5 whitespace-nowrap"
      >
        <ContactLinkLabel item={item} />{" "}
        <span className="underline">{item.label}</span>
      </Link>
    </li>
  );
}

export default async function ContactSection({
  contactSectionTitle,
  contactLinks,
}: HomepageContent) {
  return (
    <section className="py-6 bg-backgroundAlt-light dark:bg-backgroundAlt-dark">
      <div className="max-w-xl mx-auto">
        {contactSectionTitle && (
          <h2 className="text-2xl md:text-3xl font-bold px-2 my-4 text-center text-primary-light dark:text-primary-dark">
            {contactSectionTitle}
          </h2>
        )}
        <ul className="text-center flex flex-col flex-nowrap justify-center w-auto mx-auto text-xl sm:text-2xl px-2 my-10">
          {contactLinks?.map((contactLink, i) => {
            return <ContactLinkComponent key={i} item={contactLink} />;
          })}
        </ul>
      </div>
    </section>
  );
}
