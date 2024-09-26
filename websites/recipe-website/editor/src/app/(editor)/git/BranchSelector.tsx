"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "component-library/components/SubmitButton";
import { branchCommandAction } from "./actions";
import clsx from "clsx";
import { BranchSummaryBranch } from "simple-git";

export function BranchSelector({
  branches,
}: {
  branches: BranchSummaryBranch[];
}) {
  const [branchCommandState, branchCommandActionWithState] = useActionState(
    branchCommandAction,
    null,
  );
  const [branchSelected, setBranchSelected] = useState(false);
  return (
    <form action={branchCommandActionWithState}>
      {branchCommandState && (
        <div className="text-sm py-1 text-red-300 whitespace-pre">
          {branchCommandState}
        </div>
      )}
      <ul className="pl-1 my-3">
        {branches.map(({ name, current }) => {
          return (
            <li
              key={name}
              className={clsx(current && "font-bold bg-green-950")}
            >
              <label className="p-1">
                <input
                  name="branch"
                  value={name}
                  type="radio"
                  disabled={current}
                  onSelect={() => setBranchSelected(true)}
                />{" "}
                {name}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-row gap-1">
        <SubmitButton
          overrideDefaultStyles={true}
          className="border border-white rounded px-2 py-1"
          name="command"
          value="checkout"
          disabled={!branchSelected}
        >
          Checkout
        </SubmitButton>
        <SubmitButton
          overrideDefaultStyles={true}
          className="border border-white rounded px-2 py-1"
          name="command"
          value="delete"
          disabled={!branchSelected}
        >
          Delete
        </SubmitButton>
        <SubmitButton
          overrideDefaultStyles={true}
          className="border border-white rounded px-2 py-1 bg-orange-950"
          name="command"
          value="forceDelete"
          disabled={!branchSelected}
        >
          Force Delete
        </SubmitButton>
      </div>
    </form>
  );
}
