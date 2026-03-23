"use client";

import UpdatePageFields from "@discontent/pages-collection/components/Form/Update";
import { useActionState } from "react";
import { Button } from "@discontent/component-library/components/Button";
import { Page } from "@discontent/pages-collection/controller/types";
import { PageFormState } from "@discontent/pages-collection/controller/formState";
import updatePage from "@discontent/pages-collection/controller/actions/update";
import Link from "next/link";

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
        <Button type="submit">Submit</Button>
      </div>
      <div>
        <Link href="/pages">Back to Pages</Link>
      </div>
    </form>
  );
}
