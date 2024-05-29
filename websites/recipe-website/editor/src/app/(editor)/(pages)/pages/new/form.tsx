"use client";

import CreatePageFields from "pages-collection/components/Form/Create";
import { useActionState } from "react";
import { Button } from "component-library/components/Button";
import { PageFormState } from "pages-collection/controller/formState";
import createPage from "pages-collection/controller/actions/create";
import Link from "next/link";

export default function NewPageForm() {
  const initialState = { message: "", errors: {} } as PageFormState;
  const [state, dispatch] = useActionState(createPage, initialState);
  return (
    <form
      id="page-form"
      className="w-full h-full flex flex-col grow"
      action={dispatch}
    >
      <CreatePageFields state={state} />
      <div className="flex flex-row flex-nowrap my-1">
        <Button type="submit">Submit</Button>
      </div>
      <div>
        <Link href="/pages">Back to Pages</Link>
      </div>
    </form>
  );
}
