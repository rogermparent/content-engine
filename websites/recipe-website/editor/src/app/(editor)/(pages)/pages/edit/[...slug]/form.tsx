"use client";

import UpdatePageFields from "pages-collection/components/Form/Update";
import { SubmitButton } from "component-library/components/SubmitButton";
import { Page } from "pages-collection/controller/types";
import { PageFormState } from "pages-collection/controller/formState";
import updatePage from "pages-collection/controller/actions/update";
import Link from "next/link";
import { useActionState } from "react";

export default function EditPageForm({
  page,
  slug,
}: {
  slug: string;
  page: Page;
}) {
  const initialState = { message: "", errors: {} } as PageFormState;
  const updateThisPage = updatePage.bind(null, slug);
  const [state, dispatch] = useActionState(updateThisPage, initialState);
  return (
    <form
      id="page-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <UpdatePageFields page={page} slug={slug} state={state} />
      <div className="flex flex-row flex-nowrap my-1">
        <SubmitButton>Submit</SubmitButton>
      </div>
      <div>
        <Link href="/pages">Back to Pages</Link>
      </div>
    </form>
  );
}
