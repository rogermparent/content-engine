"use client";

import { useActionState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { checkout, deleteBranch } from "./actions";

export function UnselectedBranchItem({ branch }: { branch: string }) {
  const checkoutThisBranch = checkout.bind(null, branch);
  const [deleteState, deleteThisBranch] = useActionState(
    deleteBranch.bind(null, branch),
    null,
  );
  return (
    <li key={branch}>
      {deleteState && (
        <div className="text-sm py-1 text-red-300 whitespace-pre">
          {deleteState}
        </div>
      )}
      <div className="flex flex-row gap-2 items-center">
        {branch}
        <form action={checkoutThisBranch}>
          <SubmitButton
            overrideDefaultStyles={true}
            className="text-sm border border-white rounded px-1"
          >
            Checkout
          </SubmitButton>
        </form>
        <form action={deleteThisBranch}>
          <SubmitButton
            overrideDefaultStyles={true}
            className="text-sm border border-white rounded px-1"
            name="force"
            value="true"
          >
            Delete
          </SubmitButton>
        </form>
      </div>
    </li>
  );
}
